# Feature Landscape

**Domain:** Campaign detail UX — two-column layout, settings cleanup, DM availability sync (v1.6)
**Researched:** 2026-03-16
**Overall confidence:** HIGH for UX patterns (established calendar/settings conventions); HIGH for implementation context (direct codebase reading); MEDIUM for sync-specific design patterns (derived from analogous tools, not identical precedent)

---

## Context

This milestone reworks the existing campaign detail page (CampaignTabs.tsx) across three distinct concerns:

1. **Two-column layout** — large calendar on the left, persistent sidebar (Best Days list + join link copy) on the right. Date detail slide-in currently flies in from the right edge of the screen and covers everything. In the new layout it should overlay only the sidebar column.

2. **Settings cleanup** — five sections currently use a mix of always-open content and `<details>` accordions. Goal is a flat, grouped layout that is scannable without collapsing/expanding anything.

3. **DM availability sync** — when a DM marks a date unavailable in one campaign, that exception should auto-propagate to all their other campaigns. Per-campaign opt-out toggle. Dates sync; block/flag mode does not.

The existing codebase has these relevant components:
- `CampaignTabs.tsx` — single `'use client'` boundary owning all tab state, the date side-panel, and tab switching
- `BestDaysList.tsx` — renders ranked clickable rows; accepts `selectedDate` + `onSelectDate` as controlled props
- `DashboardCalendar.tsx` — group availability calendar; same controlled selection props
- `DmExceptionCalendar.tsx` — DM unavailable dates calendar with block/flag mode toggle
- `CopyLinkButton.tsx` — single-button copy-to-clipboard component

Schema: `DmAvailabilityException` is per-campaign (campaignId + date unique). `Campaign.dmExceptionMode` is per-campaign string. `Campaign.dmId` links campaigns to DM — the FK that makes cross-campaign sync possible.

---

## Table Stakes

Features that a DM expects once the layout changes. Missing or broken = the page feels worse than before.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Calendar fills the main content area | DMs expect the primary data surface to dominate the page; a small calendar in a two-column layout would feel like a downgrade | Low | CSS grid: `grid-cols-[1fr_280px]` or similar; DashboardCalendar already fills its container |
| Sidebar always visible while calendar is shown | If the Best Days list disappears when scrolling the calendar, the DM loses orientation. Persistent sidebar is the core of the layout rework. | Medium | Requires `position: sticky` on the sidebar or a CSS grid where both columns are full-height. Current implementation puts BestDaysList above DashboardCalendar in a single column — the order and container must change |
| Slide-in panel scoped to the sidebar column | With a persistent sidebar, a full-viewport slide-in covering the whole page is disorienting. The panel should overlay only the sidebar area, replacing Best Days content with date detail, then restoring it on close. | Medium | Currently `fixed inset-y-0 right-0 w-80` — must change to sidebar-relative positioning. Options: (a) animate a state swap within the sidebar div, or (b) use `position: absolute` within the sidebar container |
| Sidebar join link one-click copy | Best Days is the primary content in the sidebar; the join link copy is secondary but expected to be reachable without switching tabs. A compact copy button at the bottom of the sidebar satisfies this. | Low | CopyLinkButton already exists; just needs to render inside the sidebar |
| Smooth slide-in animation on date panel open/close | The existing slide-in uses `translate-x-full` / `translate-x-0` with a 200ms transition. Any new overlay must preserve this feel — snappy, not jarring. | Low | Same Tailwind transition pattern; just scoped to a different container |
| Keyboard close (Escape) for date panel | The existing panel closes on Escape via a `useEffect` listener. This must be preserved in the new layout. | Low | Already implemented in CampaignTabs — no change needed if state management stays in the same component |
| Backdrop click to close date panel | Clicking outside the panel (on the calendar) should close it. Current implementation uses a `fixed inset-0 z-10` click trap. With a sidebar-scoped panel, this becomes clicking anywhere outside the sidebar. | Low | Same click-outside pattern; adjust z-index layering |
| Settings sections always visible without accordion clicks | The goal is flat grouped layout. DMs expect settings to be readable without interaction — no hunting for hidden fields behind collapsed rows. | Low-Medium | Remove `<details>` wrappers from Players and My Unavailable Dates sections; render all content expanded by default |
| Settings sync toggle visible and labelled clearly | If DM availability sync is on by default, DMs who don't want it must be able to find and turn it off without digging. A labelled toggle in the My Unavailable Dates section (or a dedicated section) is expected. | Low | New UI element; toggle state stored on Campaign model (new column needed: `dmSyncEnabled Boolean @default(true)`) |

---

## Differentiators

Features beyond baseline that add real value for this specific app and user.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Best Days list as sidebar anchor | Placing Best Days in a persistent sidebar means it is always in view alongside the calendar — DM sees the ranked dates and the calendar simultaneously, removing the need to mentally map between two separate sections. This is the core UX win of the rework. | Medium | Requires layout restructure in CampaignTabs; BestDaysList receives same props, just renders in a different position |
| Date panel slides in over sidebar only (not full page) | When a date is clicked, the panel replacing the Best Days sidebar creates a "detail on demand" pattern: context is temporarily replaced with detail, then restored. This is less disruptive than a full-page overlay because the calendar remains fully visible and interactive. | Medium | Sidebar must be a positioned container; panel uses `absolute` positioning within it rather than `fixed`. Requires CampaignTabs layout to define the sidebar as a `relative` container |
| DM availability sync across campaigns | A DM running two campaigns (e.g. different groups, different days) marks a personal unavailable date once and both campaigns reflect it. This removes a real friction point: currently the DM must manually replicate the same dates in every campaign. No comparable scheduling app in this niche does this. | High | Schema: new `dmSyncEnabled` boolean on Campaign; new server action `syncExceptionToAllCampaigns(dmId, date, isBlocked)` that writes DmAvailabilityException rows for all campaigns owned by the DM where `dmSyncEnabled = true`; revalidatePath for each affected campaign |
| Sync enabled by default with per-campaign opt-out | "Opt-in sync" would go unused by most DMs (low discoverability). "Opt-out" means the feature works immediately and DMs who want independence can disable it. This matches the mental model: "my unavailability is mine, not campaign-specific." | Low | Default `true` in schema; toggle in Settings UI calls `updateSyncEnabled(campaignId, enabled)` server action |
| Flat settings layout reduces scrolling | The current Settings tab has five sections, two of which are behind accordions. A flat layout where all sections are always visible is scannable in one pass. For a small-screen DM (laptop), this reduces cognitive friction around "where is the thing I need?" | Low-Medium | Remove `<details>` from Players and DM Unavailable Dates sections; adjust vertical spacing between sections |

---

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full three-column layout (calendar + sidebar + detail panel as columns) | Three columns on a typical laptop screen makes each column too narrow to be useful. The calendar especially needs width to render month grids legibly. | Two columns only: main area (calendar) + sidebar (Best Days/detail); sidebar swaps content on date select |
| DM availability sync that copies block/flag mode | Block/flag mode is a per-campaign strategic preference — some campaigns may want unavailable dates excluded from Best Days; others may want them flagged. Syncing mode would silently override these independent decisions. | Sync dates only; mode remains per-campaign as it is today |
| Sync that creates exceptions in campaigns with different planning windows | If Campaign A runs March–May and Campaign B runs June–August, syncing a March exception to Campaign B creates a phantom exception outside its planning window. This is confusing at best, corrupted data at worst. | Sync should still write the exception row regardless of window — the DmExceptionCalendar already handles out-of-window dates by rendering them dimmed and unclickable. The exception record is harmless if outside the window; it becomes visible if the window is later extended. OR: only sync dates that fall within the target campaign's planning window. The simpler approach (always write, let window filter visibility) is lower risk. Flag for planning decision. |
| Accordion-style expansion for date panel within sidebar | An accordion (expand/collapse in place) would shift the Best Days list down, causing layout jitter. The slide-in/overlay pattern is correct. | Sidebar content swap: when date selected, Best Days slides out, panel slides in; on close, panel slides out, Best Days slides back |
| Settings accordion retained for DM Unavailable Dates section | The DmExceptionCalendar is large (multi-month grid). Hiding it behind an accordion was a workaround for vertical space. In a flat layout, it should render visibly but optionally be placed lower in the settings flow so it doesn't block the quick-access fields above it. | Always render, position last before Danger Zone (already the current order); remove the `<details>` wrapper |
| Modal for date detail instead of slide-in | Modals block the underlying calendar completely and require a close action to return to context. The existing slide-in pattern is correct for this use case — it preserves the calendar view while showing detail. Do not regress to a modal. | Preserve the slide-in pattern; just scope it to the sidebar |
| Real-time sync via WebSocket or polling | For a small group (5–8 people), updates are infrequent. When the DM marks a date in one campaign, they will likely navigate to other campaigns manually. Server-side propagation on the toggle action is sufficient — no live sync infrastructure needed. | Server action writes all rows on toggle; `revalidatePath` for each campaign path |

---

## Feature Dependencies

```
Feature 1: Two-column layout
  → CampaignTabs.tsx restructure — layout changes from stacked sections to CSS grid
  → Sidebar container must be position:relative (for absolute date panel)
  → BestDaysList moves from Availability tab main content to sidebar
  → CopyLinkButton renders inside sidebar (currently only in Settings tab Join Link section)
  → DashboardCalendar remains in main area
  → Side panel changes from fixed inset-y-0 right-0 to absolute inset-y-0 right-0 within sidebar
  → Side panel width stays ~w-80 (320px) — same as sidebar width; panel fills the sidebar
  → Availability tab layout becomes a two-column grid; Settings tab is unaffected by this change
  → Awaiting Response section moves to main area or above the grid (above the calendar, below breadcrumbs)

Feature 2: Settings cleanup
  → Remove <details> wrapper from Players section
  → Remove <details> wrapper from My Unavailable Dates section
  → Both sections render always-visible
  → New section: DM Availability Sync (a new toggle)
  → Section order: Join Link → Planning Window → Players → My Unavailable Dates → DM Availability Sync → Danger Zone
  → ChevronDownIcon SVG can be removed if no other consumer uses it (only used in the two accordions)
  → No prop API changes — UpdateMaxPlayersForm, DmExceptionCalendar, etc. receive same props

Feature 3: DM availability sync
  → Schema: add dmSyncEnabled Boolean @default(true) to Campaign model
  → Migration: prisma migrate dev
  → Server action: toggleDmException must be updated (or a new action added) to propagate to sibling campaigns
    - After writing the exception for the current campaign, query all other campaigns by this DM where dmSyncEnabled = true
    - Write or delete DmAvailabilityException rows for each sibling campaign for the same date
    - revalidatePath for each affected campaign path
  → Server action: updateDmSyncEnabled(campaignId, enabled) — new action, updates Campaign.dmSyncEnabled
  → Settings UI: new toggle row in Settings tab (DM Availability Sync section)
  → Toggle must show current sync state; optimistic update + rollback pattern (same as DmExceptionCalendar mode toggle)
  → DmExceptionCalendar.tsx: no prop changes needed — it already receives initialExceptions and calls toggleDmException
  → The propagation happens inside the server action, invisible to the component
  → Awaiting response: what happens when sync is toggled from off to on?
    - Does enabling sync retroactively push current exceptions to other campaigns? This is ambiguous.
    - Recommended: NO retroactive sync on toggle. Only new exceptions sync after enablement. This is simpler and avoids unexpected mutations.
    - Flag for planning decision.

Dependencies between features:
  Feature 1 → independent of Features 2 and 3 (pure layout change)
  Feature 2 → independent of Feature 1 (Settings tab is unchanged by layout)
  Feature 2 → depends on Feature 3 for the new Sync toggle section
  Feature 3 → independent of Features 1 and 2 (schema + action change)
  Feature 3 → Feature 2 surfaces the sync toggle (they ship together)
```

---

## Complexity Assessment

| Feature | Complexity | Primary effort | Risk |
|---------|------------|----------------|------|
| Two-column layout | Medium | CSS grid in CampaignTabs; repositioning side panel from `fixed` to `absolute` within sidebar container | Side panel stacking context — sidebar must be `z-auto` or properly layered; fixed panel z-index layering currently uses z-10/z-20 which must be revisited for absolute positioning |
| Date panel scoped to sidebar | Medium | Changing `fixed inset-y-0 right-0` to sidebar-relative absolute positioning; ensuring calendar remains fully visible when panel is open | Mobile breakpoint: two-column layout likely collapses to single column on small screens; need to define collapse behaviour (revert to old full-screen panel on mobile?) |
| Settings cleanup — remove accordions | Low | Delete `<details>` wrappers; adjust spacing | None — pure markup change |
| Settings sync toggle UI | Low | New toggle row; optimistic update; calls new server action | None if server action exists first |
| DM availability sync — schema | Low | One new column: `dmSyncEnabled Boolean @default(true)` on Campaign | Migration is safe (default true means all existing campaigns behave as if sync is on — this is correct since no exceptions exist to propagate at migration time) |
| DM availability sync — server action | High | Update `toggleDmException` or wrap it: query all DM campaigns with sync enabled, batch write/delete exceptions, revalidate multiple paths | Transactional safety: if the batch write partially fails, sibling campaigns get out of sync. Should wrap in a Prisma transaction. Multiple `revalidatePath` calls are fine but each triggers a page re-render server-side. |
| Retroactive sync behaviour | Low (decision) | Decide: enable = only forward, or enable = push current state | Recommend NO retroactive sync. Simpler mental model. Less risk of accidental overwrites on campaigns with deliberate independent exceptions. |

---

## Phase Ordering Recommendation

Based on dependencies and risk:

1. **Schema + sync action** first (Feature 3, server layer only) — no UI visible to the DM, safe to ship, establishes the data model
2. **Two-column layout** (Feature 1) — high visual impact, independent, no schema dependencies
3. **Settings cleanup + sync toggle** (Features 2 + 3 UI) — low complexity, ships together since the toggle is the reason to add a new settings section

---

## Open Questions for Planning

- **Mobile breakpoint for two-column layout:** On screens narrower than ~768px, does the layout collapse to single column? If yes, the side panel must revert to the current `fixed inset-y-0 right-0` behaviour on small screens. This adds a responsive state branch to CampaignTabs.

- **Sidebar width:** BestDaysList rows currently truncate to fit. At sidebar width (~280–320px), ranked rows with date + free count + optional DM badge should still fit without wrapping. Worth verifying with the longest plausible date label ("Wednesday, 30 September 2026").

- **Retroactive sync on toggle-on:** Decided not to retroactively push existing exceptions when sync is enabled. Confirm this is acceptable — a DM who has 5 exceptions in Campaign A and enables sync expecting Campaign B to also get them will be surprised if it doesn't happen immediately.

- **Out-of-window exceptions in sibling campaigns:** When syncing an exception that falls outside a sibling campaign's planning window, write the row anyway (invisible but harmless) or skip it. Recommend: write it. DmExceptionCalendar already dimly renders out-of-window dates; the exception is simply invisible until the window is extended.

- **Existing campaigns at migration time:** `dmSyncEnabled` defaults to `true`. All existing campaigns will behave as if sync is on after migration. Since no prior mechanism created cross-campaign exceptions, there is nothing unexpected to propagate. This is safe.

---

## Sources

- Project codebase: direct reading of `CampaignTabs.tsx`, `BestDaysList.tsx`, `DmExceptionCalendar.tsx`, `CopyLinkButton.tsx`, `schema.prisma` — HIGH confidence (authoritative)
- PROJECT.md v1.6 active requirements — HIGH confidence (authoritative)
- UX research: [Accordion UX: The Pitfalls of Inline Accordion and Tab Designs (Baymard)](https://baymard.com/blog/accordion-and-tab-design) — MEDIUM confidence (established research; general, not app-specific)
- UX research: [No more accordions: how to choose a form structure (UK Government user research)](https://userresearch.blog.gov.uk/2015/08/13/no-more-accordions-how-to-choose-a-form-structure/) — MEDIUM confidence (directional; from 2015 but the finding is stable and often cited)
- UX research: [PatternFly Drawer design guidelines](https://www.patternfly.org/components/drawer/design-guidelines/) — MEDIUM confidence (enterprise design system; inline vs overlay drawer patterns are widely applicable)
- UX research: [Adobe Commerce slide-out panels and overlays pattern library](https://developer.adobe.com/commerce/admin-developer/pattern-library/containers/slideouts-modals-overlays) — MEDIUM confidence (establishes slide-in for contextual detail as a standard admin pattern)
- Calendar UI patterns: [Calendar UI Examples (Eleken)](https://www.eleken.co/blog-posts/calendar-ui); [Calendar design best practices (setproduct)](https://www.setproduct.com/blog/calendar-ui-design) — LOW-MEDIUM confidence (marketing/UX blog; directional)
- Multi-calendar sync: [OneCal](https://www.onecal.io/); [CalendarBridge](https://calendarbridge.com/) — LOW confidence for this app (enterprise sync tools; relevant only as analogy for cross-calendar availability propagation patterns)
