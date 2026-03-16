# Project Research Summary

**Project:** Where's the Cleric — D&D Session Planner
**Milestone:** v1.6 Campaign Detail Rework
**Domain:** Campaign detail UX — two-column layout, settings cleanup, DM availability sync
**Researched:** 2026-03-16
**Confidence:** HIGH

## Executive Summary

v1.6 makes three focused improvements to the campaign detail page: a two-column availability layout (large calendar left, persistent sidebar right), a flat settings UI replacing `<details>` accordions, and cross-campaign DM availability sync with per-campaign opt-out. All three are achievable with zero new dependencies — the existing stack (Next.js 16, React 19, Tailwind CSS 4, Prisma 7, server actions) handles everything. The only material data model change is one additive boolean field (`dmSyncEnabled Boolean @default(true)`) on the Campaign model. Everything else is CSS restructuring, markup cleanup, and server action extension.

The recommended build order is schema first, then server actions, then UI — because the sync server action must exist before the toggle component, and the `CampaignTabs` structural refactor must happen before the two-column layout work can be verified. The most important architectural decision: `CampaignTabs` must be refactored, not patched, to own the conditional two-column vs single-column layout. Both the calendar and sidebar must be children of the same `'use client'` boundary, which is the only component that can hold `selectedDate` state shared between them. Attempting to place the sidebar outside this boundary creates an unsolvable state-sharing problem that cannot be fixed incrementally.

The biggest technical risk is the date slide-in panel's `position: fixed` and full-viewport backdrop colliding with the new persistent sidebar. The correct fix is to convert the panel to a sidebar content swap: when a date is selected, the sidebar transitions from showing Best Days to showing date detail, then back on close. This removes the backdrop/z-index problem entirely and produces better UX in a two-column context because the calendar remains fully visible. The second risk is the sync re-enable backfill edge case — there is no safe canonical source for "which campaign's exceptions are correct" when a campaign re-enables sync after being opted out. The recommended approach is forward-only sync (no retroactive backfill), which is safe and easy to communicate in the UI.

## Key Findings

### Recommended Stack

Zero new dependencies. The existing stack is fully sufficient for all three v1.6 features. The two-column layout is two Tailwind grid utility classes. The flat settings UI is a markup change (delete `<details>` wrappers, replace with `<section>` elements). The sync propagation is a Prisma `findMany` + `createMany`/`deleteMany` pattern inside the existing server action. Adding any UI library (Radix, Headless UI), state library (Zustand, Jotai), or data-fetching library (React Query, SWR) for these features would be over-engineering with no payoff.

**Core technologies:**
- **Tailwind CSS 4** — responsive two-column grid (`grid-cols-1 lg:grid-cols-[1fr_320px]`); arbitrary value syntax is already used in the codebase and valid in Tailwind 4
- **Prisma 7** — `findMany` + `createMany`/`deleteMany` for bulk sync writes; the `DM → Campaign[]` relation already exists in the schema; non-breaking additive migration with `@default(true)`
- **Next.js server actions + `revalidatePath`** — all sync logic stays server-side; no client-side data fetching needed; `revalidatePath` invalidates campaign page caches after sync writes

See `.planning/research/STACK.md` for full rationale, code samples for the toggle switch, and the explicit anti-list of libraries not to add.

### Expected Features

**Must have (table stakes):**
- Calendar fills the main content area and dominates the page — a small calendar in a two-column layout feels like a downgrade
- Sidebar always visible while calendar is shown — persistent, not hidden behind a tab or scroll barrier
- Date detail panel scoped to the sidebar column only — not a full-viewport overlay; calendar must remain fully visible when panel is open
- Sidebar join link one-click copy accessible without tab-switching
- Settings sections always visible without accordion interaction — flat, scannable in one pass
- Sync opt-out toggle clearly labelled and visible in Settings

**Should have (differentiators):**
- DM availability sync across campaigns enabled by default — "mark unavailable once, applies everywhere"
- Sidebar content swap on date selection (Best Days slides out, date detail slides in) — less disruptive than a full-page overlay
- Flat settings layout reduces cognitive overhead for common DM actions

**Defer to v2+:**
- Visual indicator on synced vs independently-set exception dates in the calendar
- Retroactive backfill when re-enabling sync for a campaign
- Real-time sync via WebSocket or polling — not needed for small groups of 5–8 players
- Three-column layout — too narrow on typical laptop screens; two columns is the correct choice

See `.planning/research/FEATURES.md` for full dependency graph, open questions, and phase ordering recommendation from the feature perspective.

### Architecture Approach

The single `'use client'` boundary (`CampaignTabs.tsx`) must be restructured to own the conditional page layout: two-column when on the Availability tab, single-column when on the Settings tab. All three features are implemented inside this boundary or in direct children. One new client component is needed (`DmSyncToggle`) following the existing optimistic-update pattern from `DmExceptionCalendar`. The sync propagation lives entirely in the server action, invisible to client components — the `DmExceptionCalendar` component calls `toggleDmException` as before and the server decides what to propagate.

**Major components:**
1. **`CampaignTabs.tsx` (modified)** — owns `activeTab`, `selectedDate`, and all layout state; renders two-column availability layout and flat settings; gains `dmSyncEnabled` prop
2. **`DmSyncToggle.tsx` (new)** — per-campaign sync opt-out toggle with optimistic update + rollback; calls new `setDmSyncEnabled` server action
3. **`toggleDmException` server action (extended)** — after writing to the target campaign, finds all other DM campaigns with `dmSyncEnabled = true` and writes the same exception to each within their planning window

**Unchanged components:** `BestDaysList`, `DashboardCalendar`, `DmExceptionCalendar`, `UpdatePlanningWindowForm`, `UpdateMaxPlayersForm`, `CopyLinkButton`, `DeleteCampaignButton` — all receive the same props; only their position in the layout or their containing wrapper changes.

See `.planning/research/ARCHITECTURE.md` for the full build order (8 steps), data flow diagrams, and anti-patterns to avoid.

### Critical Pitfalls

1. **Fixed date panel backdrop blocks sidebar clicks** — the current `fixed inset-0 z-10` backdrop intercepts all clicks on the persistent sidebar while a date panel is open. Fix: convert the date panel to a sidebar content swap using `absolute` positioning within the sidebar div, not `fixed` to the viewport. No full-screen backdrop needed.

2. **`CampaignTabs` patched instead of restructured** — placing the sidebar outside `CampaignTabs` makes `selectedDate` state-sharing impossible (server components cannot hold state). The correct fix is a structural refactor so both calendar and sidebar are children of the same top-level client component. Do this first, before any other v1.6 work.

3. **Schema migration deferred until after server action code** — the `dmSyncEnabled` field must exist in the Prisma schema before any sync server action code can be written or TypeScript will not recognise the field. Run `prisma db push` as the literal first step of the sync phase.

4. **Rapid double-click race condition** — two opposing server actions in flight simultaneously (add then remove, or remove then add) can leave sync-enabled campaigns in split-brain state. Add a per-date in-flight guard (`pendingDates: Set<string>`) that ignores clicks while an action is already in flight.

5. **Re-enable sync backfill has no safe canonical source** — per-campaign exception storage means diverged exception sets after an opt-out period cannot be reconciled without an authoritative source. Do not attempt retroactive backfill. Re-enabling sync applies forward only; document this in the toggle UI label.

See `.planning/research/PITFALLS.md` for the full set of 15 pitfalls with exact code prevention patterns, including mobile layout concerns, duplicate join link handling, empty sidebar state, and `revalidatePath` performance considerations.

## Implications for Roadmap

Based on dependencies discovered in research, the natural phase structure is three phases driven by a strict dependency order: schema and server layer first, then each UI feature independently.

### Phase 1: Schema and Sync Server Layer

**Rationale:** Everything else depends on the `dmSyncEnabled` field existing in the Prisma schema. The server action extension must exist before the `DmSyncToggle` component can be built. Building this first also allows the sync logic to be tested in isolation before any UI exists, and locks down the sync semantics (bidirectionality, window scoping, no backfill on re-enable) before any UI makes assumptions about them.

**Delivers:** `dmSyncEnabled Boolean @default(true)` field on `Campaign` with migration applied; `toggleDmException` propagates to sync-enabled sibling campaigns (scoped to each sibling's planning window); new `setDmSyncEnabled` server action; sync semantics decision record documented.

**Addresses:** Feature 3 (DM availability sync), server layer only

**Avoids:** Pitfall 10 (schema missing at runtime), Pitfall 3 (backfill edge case locked down before UI ships), Pitfall 5 (sync semantics documented before component integration), Pitfall 4 (only revalidate originating campaign path, not all siblings)

### Phase 2: Two-Column Layout Restructure

**Rationale:** The `CampaignTabs` structural refactor is the highest-risk change in v1.6 and must be isolated as its own phase. It is independent of the sync schema (no data model dependency) but is a prerequisite for the Settings phase because Settings renders inside the same restructured component. Doing this as a focused, standalone phase makes it reviewable and rollback-safe.

**Delivers:** Two-column availability layout (calendar left, persistent sidebar right); sidebar contains `BestDaysList` and `CopyLinkButton`; date detail panel converted from full-viewport fixed overlay to sidebar content swap; mobile responsive (single-column stack below `lg:` breakpoint, calendar source-ordered first); `selectedDate` state correctly owned by the top-level client component; join link removed from Settings tab (now in sidebar).

**Addresses:** Feature 1 (two-column layout), join link sidebar placement

**Avoids:** Pitfall 1 (fixed panel backdrop blocks sidebar), Pitfall 2 (CampaignTabs restructured not patched), Anti-Pattern 4 (sidebar is in-flow not fixed), Pitfall 7 (mobile source order correct for keyboard/screen reader), Pitfall 8 (selectedDate not duplicated in sidebar)

### Phase 3: Flat Settings UI and Sync Toggle

**Rationale:** This phase is low complexity and low risk. Accordion removal is pure markup change. The `DmSyncToggle` component calls the server action from Phase 1 and follows the existing optimistic-update pattern from `DmExceptionCalendar` — it is a small, well-understood component. Phases 1 and 2 must precede this so the `dmSyncEnabled` prop chain is wired through the restructured `CampaignTabs` and the server action is ready to call.

**Delivers:** Flat grouped settings layout — `<details>` wrappers removed entirely and replaced with `<section>` elements; all settings sections always visible; `DmSyncToggle` component rendered in Settings; Settings section order: Planning Window → Players → My Unavailable Dates → DM Availability Sync → Danger Zone; join link section removed from Settings (already in sidebar from Phase 2).

**Addresses:** Feature 2 (settings cleanup), Feature 3 UI (sync toggle)

**Avoids:** Pitfall 9 (details/summary removed entirely, not hidden with CSS — hidden interactive elements cause screen reader confusion), Pitfall 11 (inline planning window editor decision made before implementation), Pitfall 14 (sync semantics communicated in toggle label copy)

### Phase Ordering Rationale

- Schema must precede server actions because Prisma client regeneration must run before TypeScript can see the new field
- Server actions must precede client components that call them
- `CampaignTabs` layout restructure must precede the Settings cleanup because Settings renders inside the same component; combining both in one phase creates a large, hard-to-review diff
- Features 1 (layout) and 2+3 (settings + sync UI) are independent of each other but share the same component file, so the layout restructure is isolated first to reduce diff complexity in the Settings phase

### Research Flags

Phases with well-documented patterns (skip `/gsd:research-phase`):
- **Phase 1:** Prisma schema migrations, `@default` fields, and server action patterns are established and already in use in this codebase; no additional research needed
- **Phase 2:** Tailwind CSS grid patterns verified against existing codebase usage; sidebar `sticky` positioning is standard CSS; sidebar content swap pattern is documented in ARCHITECTURE.md
- **Phase 3:** `<details>` removal and accessible `<section>` replacement is straightforward markup; optimistic toggle pattern is already implemented in `DmExceptionCalendar` and can be cloned directly

One area to verify during Phase 1 implementation (not requiring a full research phase — a quick integration test is sufficient):
- **`revalidatePath('/campaigns', 'layout')` segment cache invalidation** — MEDIUM confidence that this cascades to all `/campaigns/[id]` children. If it does not behave as expected, fall back to per-ID invalidation in a loop (already specified in ARCHITECTURE.md as the fallback).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All three features traced directly to existing browser APIs, Tailwind utilities, and Prisma patterns already in the codebase. Zero new dependencies confirmed via direct `package.json` and component inspection. |
| Features | HIGH | Based on direct codebase inspection and established UX research for accordion removal and slide-in panel scoping. Sync-specific UX patterns derived from analogous multi-calendar tools — MEDIUM for that sub-area only. |
| Architecture | HIGH | Based on direct inspection of all relevant files: `CampaignTabs.tsx`, `DmExceptionCalendar.tsx`, `BestDaysList.tsx`, `DashboardCalendar.tsx`, `campaign.ts` actions, `schema.prisma`, `page.tsx`. Component boundaries and data flow are well-understood. |
| Pitfalls | HIGH (structural pitfalls) / MEDIUM (sync edge cases) | Structural pitfalls (z-index, state lifting, schema order) are grounded in direct codebase reading. Cross-campaign sync edge cases (race conditions, cascading revalidation performance) are validated against known Prisma and Next.js behaviour but not live-tested in this exact schema configuration. |

**Overall confidence:** HIGH

### Gaps to Address

- **`revalidatePath` with `'layout'` type for nested dynamic segments** — MEDIUM confidence. Verify during Phase 1 implementation. Fallback is already specified (loop over sibling IDs) and adds no meaningful complexity.

- **Mobile layout for sidebar date panel** — the research specifies the sidebar content swap pattern (`absolute` positioning within sidebar div) for desktop. The exact mobile behaviour needs a decision before Phase 2 implementation: on narrow screens, should the date panel revert to `fixed` full-screen, or does the single-column stacked layout mean the panel simply replaces the sidebar section inline? Recommendation: revert to `fixed` full-screen on mobile (matches current behaviour, keeps mobile path simple).

- **Retroactive sync on toggle-on** — research recommends no backfill (forward-only sync). Confirm this is acceptable before Phase 3 ships. Toggle label copy must clearly communicate forward-only semantics so DMs are not confused when enabling sync does not immediately populate a campaign with the DM's existing unavailable dates from other campaigns.

- **Inline planning window editor fate** — the inline editor in the Availability tab currently duplicates `UpdatePlanningWindowForm` from Settings (Pitfall 11). Decision needed before Phase 3: keep the inline editor, remove it, or replace it with a "Jump to Settings" affordance. Research recommendation: keep a lightweight link in the calendar header that sets `activeTab = 'settings'`, avoiding both form duplication and loss of discoverability.

## Sources

### Primary (HIGH confidence)

- Codebase direct inspection: `src/app/campaigns/[id]/page.tsx`, `src/components/CampaignTabs.tsx`, `src/components/DmExceptionCalendar.tsx`, `src/components/BestDaysList.tsx`, `src/components/DashboardCalendar.tsx`, `src/components/CopyLinkButton.tsx`, `src/lib/actions/campaign.ts`, `prisma/schema.prisma`, `package.json`, `.planning/PROJECT.md`, `.planning/STATE.md` — all read directly in this research session
- Prisma 7 `createMany` / `deleteMany` APIs — consistent with existing `deleteMany` usage confirmed in codebase
- ARIA `role="switch"` toggle pattern — ARIA specification; stable
- Tailwind CSS 4 arbitrary `grid-cols-[...]` value syntax — confirmed by existing arbitrary value usage in this codebase
- React 19 state lifting pattern — React core specification; stable
- CSS Grid source-order vs visual-order accessibility concern — WCAG 1.3.2, CSS Grid specification; stable

### Secondary (MEDIUM confidence)

- Next.js App Router `revalidatePath` with `'layout'` type — Next.js 15+ cache documentation; exact behaviour for nested dynamic segments not live-tested in this app
- Baymard / UK Government user research on accordion UX — established research; general UX principles, not app-specific
- PatternFly drawer design guidelines and Adobe Commerce slide-out panel patterns — enterprise design systems; applicable as analogy for sidebar vs overlay patterns
- Optimistic update + per-date in-flight guard pattern — well-known React pattern; not verified against this codebase's specific `DmExceptionCalendar` implementation detail

### Tertiary (LOW confidence)

- OneCal / CalendarBridge multi-calendar sync — referenced only as analogy for cross-calendar availability propagation design patterns; enterprise tools not directly comparable to this app's use case

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
