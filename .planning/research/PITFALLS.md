# Domain Pitfalls

**Domain:** Next.js 16 App Router — adding two-column layout, flat settings, and cross-campaign DM availability sync to an existing D&D scheduling app
**Milestone:** v1.6 Campaign Detail Rework
**Researched:** 2026-03-16
**Confidence:** HIGH for pitfalls grounded in direct codebase inspection and established Next.js/React 19/Prisma behaviour; MEDIUM for cross-campaign sync edge cases (race conditions, cascading revalidation) which are architectural patterns validated against known behaviour but not live-tested in this exact schema

---

## Critical Pitfalls

### Pitfall 1: The fixed date slide-in panel (z-20, `position: fixed`) collides with the new persistent sidebar at the same layer

**What goes wrong:**
The current `CampaignTabs.tsx` renders the date detail panel as `fixed inset-y-0 right-0 w-80 z-20` — a full-height fixed drawer that slides in from the right edge of the viewport. The planned two-column layout puts a persistent Best Days + join link sidebar in the right column. When the date panel slides in, it occupies the same right-side viewport space as the persistent sidebar, and at `z-20` it visually overlaps the sidebar but may be behind it depending on stacking context.

More critically: the backdrop dismiss layer for the date panel is `fixed inset-0 z-10` — a full-screen transparent overlay. In the new layout, this backdrop will intercept all clicks on the persistent sidebar content, blocking interaction with the sidebar while the date panel is open.

**Why it happens:**
The date panel was designed for a single-column layout where "the right side of the screen" was empty space. In the two-column layout, the right column is no longer empty — it is a real content region. The fixed panel needs to overlay the sidebar deliberately, not accidentally.

**Consequences:**
- DM cannot click Best Days list items while a date panel is open (backdrop intercepts)
- If sidebar is sticky/scrollable, the fixed panel and sidebar create competing scroll contexts
- Visual confusion: the persistent sidebar shows Best Days but the date panel also shows date detail — two right-side panels can appear simultaneously on desktop if the panel z-index is insufficient

**Prevention:**
Redesign the date slide-in to work in the two-column context. Two reliable patterns:

**Pattern A — Overlay that covers only the left (calendar) column:**
The slide-in panel overlays only the calendar area, not the full viewport. Position the panel absolutely within the calendar column's container, not fixed to the viewport. This requires the calendar column to have `position: relative` and `overflow: hidden`.

**Pattern B — Replace the fixed slide-in with inline expansion within the sidebar:**
When a date is selected, the sidebar transitions from showing the Best Days list to showing the date detail (replacing or prepending the date content at the top of the sidebar). No fixed overlay needed. This removes the backdrop/z-index problem entirely and is the better UX for this layout: the sidebar is already the "secondary info" region.

**Which phases:** Layout phase, date panel integration phase.

---

### Pitfall 2: The two-column layout shifts `CampaignTabs` from a single-component with internal sections to a parent layout that must be orchestrated — but `CampaignTabs` is a single `'use client'` boundary

**What goes wrong:**
`CampaignTabs.tsx` currently owns all state: `activeTab`, `selectedDate`, `editingWindow`, `windowSaved`. It renders the date slide-in panel, the tab bar, and all tab content. The new layout does not use tabs for the calendar vs sidebar — the calendar and sidebar are always both visible on desktop. This changes the component's responsibilities fundamentally.

The temptation is to keep `CampaignTabs` as-is and wrap it in a new two-column layout div. This fails because:
1. The date slide-in panel state (`selectedDate`) is in `CampaignTabs` but the new sidebar (now a sibling, not a child) needs to react to it
2. The Settings tab is still a tab — it needs to hide the two-column layout and show flat settings instead
3. The whole page layout (two-column vs full-width Settings) is conditional on `activeTab`, which is inside `CampaignTabs`

Patching the existing component without restructuring produces tangled state and invalid layout hierarchy.

**Why it happens:**
The existing component architecture was correctly designed for the single-column layout it shipped with. It was not designed for a parent-level layout change. Incremental changes resist the structural edit needed.

**Consequences:**
- `selectedDate` shared between sidebar and calendar requires prop-lifting or context — impossible if sidebar is outside `CampaignTabs`'s render tree
- Tab switching between Availability and Settings must control a higher-level layout — two-column visible vs full-width single column — but the `activeTab` state is inside `CampaignTabs`
- If the sidebar is placed outside `CampaignTabs` in `page.tsx`, it cannot receive `selectedDate` updates without a prop chain through a server component (impossible — server components cannot hold state)

**Prevention:**
Accept that `CampaignTabs` needs structural refactoring, not patching. The correct model:

1. The server page (`page.tsx`) stays as a Server Component — no change to its data fetching pattern
2. A new top-level client component (`CampaignDetail.tsx` or similar) replaces `CampaignTabs` as the `'use client'` boundary — it owns `activeTab`, `selectedDate`, and all interactive state
3. This component renders a conditional layout: two-column when `activeTab === 'availability'`, single-column when `activeTab === 'settings'`
4. Both the calendar column and the sidebar column are children of this single client component, so they share state naturally

The existing `CampaignTabs` component can either be renamed/refactored in place or replaced. The key constraint is: **a single `'use client'` component must own the layout switch and all shared state**.

**Which phases:** Layout restructuring phase (must be done before any other v1.6 work).

---

### Pitfall 3: The DM availability sync server action creates phantom exceptions on the re-enable path ("re-sync on toggle-on" edge case)

**What goes wrong:**
The planned sync feature: when a DM marks a date as unavailable on any campaign, that exception propagates to all other campaigns owned by the same DM (unless a campaign has opted out). When the DM re-enables sync for a campaign (toggle-on after it was opted out), the feature should backfill the campaign with all currently synced exceptions from the DM's other campaigns.

The edge case: what is the "current synced set" at the moment of re-enable? If the DM has modified exceptions across several campaigns after the opt-out was set, each campaign may have a different set of synced dates. There is no single authoritative "DM exception list" — each campaign has its own `DmAvailabilityException` rows. The backfill on re-enable must pick a source, and any choice can be surprising:

- "Copy from campaign A" — the DM may have removed a date from campaign A but not B; the re-enabled campaign silently inherits A's state, not B's
- "Union of all campaigns" — adds dates from campaigns the DM already cleaned up; looks like a bug
- "Intersection of all campaigns" — drops dates that should carry over; silent data loss

The "re-sync on toggle-on" path has no obviously correct answer, and getting it wrong silently corrupts the DM's exception data.

**Why it happens:**
The schema has no global DM-level exception model. Exceptions are per-campaign (`DmAvailabilityException` has `campaignId`). Sync is a propagation pattern imposed on top of per-campaign storage. When sync is disabled for a campaign, the campaign's exceptions diverge from other campaigns. Re-enabling sync cannot know which state is "correct."

**Prevention:**
Two viable approaches:

**Approach A — Re-sync on toggle-on does NOT backfill (simplest and safest):**
When sync is re-enabled, the campaign starts receiving new exceptions going forward, but existing exceptions on the campaign are left unchanged. The campaign's prior state (from when it was opted out) is kept as-is. This is easy to explain to the DM: "Your existing dates stay the same. New unavailable dates will now sync." No data corruption risk. The only downside is that the DM may need to manually clear/add dates to bring the re-enabled campaign in line.

**Approach B — Re-sync on toggle-on backfills from a defined source (explicit but complex):**
Define a canonical source — one campaign as the "primary" source, or simply the most-recently-modified exception set. Document this as the expected behaviour and explain it in the UI. More correct but requires schema changes (tracking which campaign is primary, or adding timestamps to exception sets) and adds significant complexity.

**Recommendation:** Approach A. Implement it first and document the behaviour in the UI toggle label (e.g., "Sync enabled — new unavailable dates will apply to this campaign"). A future milestone can add backfill if users request it.

**Which phases:** DM availability sync server action phase.

---

### Pitfall 4: Cascading `revalidatePath` calls across all campaigns in a single server action can cause Vercel Edge function timeout on DMs with many campaigns

**What goes wrong:**
The sync server action — called on every DM exception toggle — must:
1. Write the new exception to the originating campaign
2. Find all other campaigns owned by the same DM that have sync enabled
3. Write the exception to each of those campaigns
4. Call `revalidatePath` for each affected campaign

Steps 2–4 are O(n) where n = number of DM campaigns with sync enabled. Each campaign gets a DB write (upsert or delete) and a `revalidatePath`. For this app's use case (small groups, 5–15 campaigns per DM), this is trivial. But `revalidatePath` in Next.js 15/16 triggers a cache invalidation that requires a round-trip to the Vercel deployment infrastructure — and N concurrent `revalidatePath` calls in a single server action adds latency to the action response.

More practically: if a DM has campaigns with different planning windows and a sync'd exception date falls outside a campaign's planning window, the write is harmless but `revalidatePath` still fires, causing unnecessary cache churn.

**Why it happens:**
Developers follow the existing pattern (one `revalidatePath` per action) without considering that the sync action loops over multiple campaigns.

**Prevention:**
- Use `Promise.all()` for the DB writes across campaigns to run them in parallel, not serially — this keeps total DB time under control
- Only call `revalidatePath` for the originating campaign in the sync action (the current campaign the DM is on). Do NOT call `revalidatePath` for every affected campaign — the DM is not viewing those pages right now. Their cache will be naturally invalidated when they next navigate to them, because `page.tsx` fetches fresh data on every server render (no `generateStaticParams`, no ISR)
- This is safe because: the date panel and Best Days list in the currently-viewed campaign are the only things that need to update immediately. Other campaigns will be re-fetched when navigated to

**Which phases:** DM availability sync server action phase.

---

### Pitfall 5: Optimistic updates in `DmExceptionCalendar` interact badly with cross-campaign sync — the optimistic state on one campaign is inconsistent with the actual DB state after sync

**What goes wrong:**
`DmExceptionCalendar.tsx` uses optimistic UI: when the DM clicks a date, it immediately updates local state (`exceptions` set) and shows the new state before the server confirms. This is correct for single-campaign exceptions. With cross-campaign sync, the server action writes the exception to multiple campaigns. But each campaign detail page has its own `DmExceptionCalendar` instance with its own local `exceptions` state. Those other instances are not notified of the sync — they still show the pre-sync state for their campaign.

The critical scenario: DM has Campaign A and Campaign B, both with sync enabled. On Campaign A's page, they mark a date as unavailable. Campaign A's calendar shows it optimistically. The server action syncs it to Campaign B. When the DM navigates to Campaign B, the page does a fresh server render (revalidated), so Campaign B shows the synced exception correctly. **This is fine — the problem does not manifest here.**

The problem manifests when: the DM is on Campaign A, has the date panel open showing a date that is now synced to Campaign B, and then navigates back to Campaign A after making further changes on Campaign B. The local state in Campaign A's `DmExceptionCalendar` may have drifted from DB truth (if Campaign B's changes were also synced back to Campaign A).

More practically: the toggle direction matters. Marking a date **unavailable** syncs it. But what about marking it **available** again (unblocking)? If the DM unblocks a date on Campaign A, does that sync the unblock to Campaign B? If yes, and Campaign B had independently added that date as blocked, the DM loses that Campaign B exception silently.

**Why it happens:**
Sync logic at the server action level is invisible to client-side optimistic state. The component assumes it is the only writer for its campaign's exceptions — sync breaks that assumption.

**Prevention:**
- The sync action for the delete/unblock case must also propagate the delete to all sync-enabled campaigns. The DM unblocking a date on Campaign A should remove it from Campaign B too (otherwise "sync enabled" means asymmetric: adds propagate, removes don't)
- Document the sync semantics explicitly before implementing: "when sync is on, the DM's exception list is shared — any add or remove on any campaign propagates to all sync-enabled campaigns"
- Do NOT extend the optimistic state to reflect cross-campaign sync. The optimistic update correctly reflects the current campaign's expected state. The DM sees sync effects when they navigate to other campaigns (fresh server render). Trying to update other campaigns' state client-side from one campaign's page is overengineering and requires a shared state mechanism that does not exist in this architecture

**Which phases:** DM availability sync server action phase, DmExceptionCalendar integration phase.

---

### Pitfall 6: Race condition on simultaneous toggles — two rapid clicks on the same date produce inconsistent final state

**What goes wrong:**
`DmExceptionCalendar.tsx` already has this risk for single campaigns, but sync makes it worse. The existing implementation:
1. User clicks date → optimistic UI update → server action fired
2. User clicks same date again before action 1 completes → second optimistic update → second server action fired

With no debounce and no in-flight guard, two opposite server actions (add then delete, or delete then add) race to completion. Whichever completes last wins in the DB. The optimistic UI may show the opposite state from the DB.

With cross-campaign sync, each toggle fires N DB writes. Two racing toggles can leave some campaigns in one state and others in the opposite state — a split-brain exception set.

**Why it happens:**
The existing component has rollback on error but no in-flight state guard. Rapid double-clicks on the same cell trigger two actions. The existing delete+upsert pattern (with `@@unique` constraint) is safe for single actions but not for simultaneous opposing actions.

**Consequences:**
- Optimistic UI shows the date as blocked; DB has it unblocked (or vice versa) — silent inconsistency
- With sync: Campaign A blocked, Campaign B unblocked — DB is split across campaigns
- The error rollback in the existing component only handles action failure, not the "wrong final state" case when two actions both succeed in the wrong order

**Prevention:**
Add a per-date in-flight guard: track which `dateKey` values have an active server action, and ignore clicks on those cells until the action resolves. This is already the right pattern for the single-campaign case; it becomes critical with sync.

```typescript
const [pendingDates, setPendingDates] = useState<Set<string>>(new Set())

function handleDateClick(dateKey: string) {
  if (pendingDates.has(dateKey)) return  // guard: ignore rapid second click
  setPendingDates(prev => new Set([...prev, dateKey]))
  // ... rest of optimistic update + action call
  // In .then() / .catch(): setPendingDates(prev => { const next = new Set(prev); next.delete(dateKey); return next })
}
```

Apply visual feedback to the pending cell (reduced opacity or spinner) so the DM knows the click registered and further clicks are intentional.

**Which phases:** DmExceptionCalendar integration phase.

---

## Moderate Pitfalls

### Pitfall 7: The two-column layout breaks the existing mobile layout that CampaignTabs provides

**What goes wrong:**
The existing layout is single-column and works on mobile by default. The new two-column layout (large calendar left, sidebar right) is only appropriate at wider viewport widths. On mobile, both columns must stack vertically. The question is the stacking order: should the sidebar (Best Days) appear above the calendar, or below?

If stacking order is calendar-first (natural HTML order), mobile users see the calendar first and must scroll down to see Best Days. This is reasonable since the calendar is the primary content. But if the sidebar is positioned first in HTML order (for desktop CSS grid to pull it right), mobile users see the sidebar first, which breaks the expected flow.

**Why it happens:**
CSS Grid with `order` properties or column-reversal for responsive layout can make HTML source order and visual order diverge. Screen readers and keyboard navigation follow source order, not visual order — if the sidebar is visually on the right but first in source, keyboard users tab through the sidebar before the calendar.

**Prevention:**
Use source order that matches mobile reading order: calendar section first, sidebar second. On desktop, use CSS Grid `grid-template-columns` with the sidebar placed in the second column via grid area assignments — not by reordering elements. This ensures: mobile = calendar above sidebar; desktop = calendar left, sidebar right; keyboard/screen reader = calendar before sidebar at all widths. Tailwind CSS 4's `grid` utilities support this cleanly:

```
grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6
```

Calendar column in source order first; sidebar in source order second; CSS positions sidebar to the right on desktop without source reordering.

**Which phases:** Layout phase.

---

### Pitfall 8: The persistent sidebar "Best Days" list duplicates state already in `BestDaysList` — two sources of truth for `selectedDate`

**What goes wrong:**
`BestDaysList.tsx` currently receives `selectedDate` and `onSelectDate` as props, driving the date panel from the Best Days list. In the new layout, Best Days is in the persistent sidebar. If the persistent sidebar and `DashboardCalendar` are siblings that both need to write `selectedDate`, the state must live in their shared parent — the top-level client component (see Pitfall 2).

If `BestDaysList` is refactored to manage its own selected state internally (tempting since it is self-contained), it diverges from the calendar's `selectedDate`. The calendar cell may show a ring around a selected date that the sidebar's own state does not reflect, and vice versa.

**Why it happens:**
Component authors reach for local state first. When two sibling components need to share the same piece of state, the fix is always to lift it, but the pattern is easy to miss during a refactor.

**Prevention:**
The rule is already established in the existing codebase: `selectedDate` is owned by `CampaignTabs` (the top-level client component) and passed down as props to both `BestDaysList` and `DashboardCalendar`. This pattern must be preserved in the refactored component. Neither `BestDaysList` nor the new sidebar component should manage `selectedDate` locally.

**Which phases:** Layout phase, sidebar component phase.

---

### Pitfall 9: The Settings tab accordion-to-flat migration leaves the `<details>` / `<summary>` elements in the DOM, creating hidden interactive elements

**What goes wrong:**
The current Settings tab has two `<details>` accordions: "Players" and "My Unavailable Dates." The flat redesign removes the accordions and shows all sections in a single scannable layout. During migration, the `<details>` elements might be kept but with `open` attribute forced, or kept but with `display: none` on the `<summary>`. Either approach leaves hidden interactive elements in the DOM that are still accessible to keyboard navigation and screen readers.

**Why it happens:**
Developers incrementally modify existing markup rather than replacing it. Adding `open` to `<details>` makes it look flat visually but the `<summary>` is still a keyboard-focusable toggle that confuses screen reader users (it announces "disclosure button" on elements that appear to not be collapsible).

**Prevention:**
Remove `<details>` and `<summary>` entirely when converting to flat layout. Replace with `<section>` with a `<h2>` heading and direct content — no interactive collapse wrapper. The flat layout does not use disclosure widgets. Leaving hidden interactive structure causes accessibility violations and keyboard navigation confusion.

**Which phases:** Settings tab redesign phase.

---

### Pitfall 10: The `dmAvailabilitySync` opt-out toggle needs a schema migration — the field does not exist yet

**What goes wrong:**
The current `Campaign` model has no `dmAvailabilitySyncEnabled` (or equivalent) field. The sync opt-out toggle requires a boolean column on `Campaign`. Forgetting to add the migration means the server action has no field to read or write, and either crashes with a Prisma validation error at runtime or silently treats all campaigns as "sync enabled" (if the field is undefined and the action defaults to true).

Additionally: the migration's default value matters. When the field is first added, what does it default to? If it defaults to `true`, all existing campaigns inherit sync-enabled behaviour — the DM may be surprised when a date they mark on Campaign A suddenly appears on Campaign B. If it defaults to `false`, sync is opt-in, which is safer but contradicts the planned "sync on by default" UX.

**Why it happens:**
Schema changes are easy to defer during prototyping. The server action logic can be written and partially tested by hardcoding a default, and the migration gets forgotten or deferred.

**Prevention:**
Add the schema field and run `prisma migrate dev` as the first step of the sync feature phase — before writing any server action code. The field name should clearly indicate its purpose (`dmAvailabilitySyncEnabled Boolean @default(true)` per the planned "on by default, opt-out" model). Document the default value rationale in a schema comment or in this file.

Regarding the default: "sync on by default" requires the `@default(true)` migration. Existing DMs should be notified (via UI) that sync is now active when they first visit a campaign after the migration — a one-time info banner or tooltip on the toggle is sufficient.

**Which phases:** DM availability sync schema phase (must precede all sync action work).

---

### Pitfall 11: The flat Settings layout causes the `UpdatePlanningWindowForm` to appear twice — once in the Availability tab (inline editor triggered by pencil icon) and once in Settings

**What goes wrong:**
In the current layout, `UpdatePlanningWindowForm` appears in Settings (always visible). In the Availability tab, a pencil icon opens an inline editing panel that also renders `UpdatePlanningWindowForm`. In the new layout, the inline editor in the Availability tab may be removed (since Settings is now a flat, always-readable layout, not an accordion buried two taps deep). However, if the inline editor is removed from the Availability tab without a clear navigation affordance to Settings, DMs lose the ability to edit the planning window from the main calendar view — requiring them to switch tabs to Settings for a common action.

**Why it happens:**
The two-column layout and flat Settings are designed independently. The interaction between "where do you edit the planning window" and "what the Settings tab now looks like" is a cross-feature concern that gets missed.

**Prevention:**
Explicitly decide, before implementation: should the inline planning window editor in the Availability tab be kept, removed, or replaced with a Settings tab link? Recommendation: keep a lightweight pencil/edit link in the calendar header that navigates to (or focuses) the planning window section in the Settings tab. This avoids duplicating the form while keeping discoverability.

**Which phases:** Settings tab phase, calendar header phase.

---

### Pitfall 12: The sidebar join link section duplicates the join link from the Settings tab — two out-of-sync UI elements for the same value

**What goes wrong:**
The planned sidebar contains the join link. The Settings tab also has a "Join Link" section with `CopyLinkButton`. Both render the same URL, but if either section's styling or content ever diverges, the DM sees two different renderings of the same information with no indication of which is "authoritative." More concretely: the Settings tab has explanatory copy ("Share this link with your players…") that the sidebar may not have. A DM who only looks at the sidebar misses this context.

**Why it happens:**
The sidebar join link is a convenience affordance (always visible without switching tabs). It is natural to add it without removing the Settings tab copy.

**Prevention:**
This is acceptable as-is — two presentations of the same URL are fine as long as they share the same underlying `joinUrl` prop. The key constraint: both must use the same `CopyLinkButton` component and the same `joinUrl` value passed from the server. No hardcoding or re-derivation of the URL in the sidebar. Document in the component comment that the URL value comes from the server-rendered `page.tsx` and must not be derived client-side.

**Which phases:** Sidebar component phase.

---

## Minor Pitfalls

### Pitfall 13: The sidebar "Best Days" section has no empty state if no planning window is set

**What goes wrong:**
`BestDaysList` currently renders nothing (or a placeholder) when `dayAggregations` is empty because no planning window is set. In a sidebar, an empty region looks broken — the sidebar appears to have a gap or missing section. The calendar column already shows a "Set a planning window to see group availability" message, but the sidebar has no corresponding empty state.

**Prevention:**
Add an explicit empty state to the sidebar Best Days section: "Set a planning window to see best days." Match the tone and styling of the empty state already in `DashboardCalendar`.

**Which phases:** Sidebar component phase.

---

### Pitfall 14: The `dmAvailabilitySync` opt-out toggle UI is adjacent to the `DmExceptionCalendar` in Settings — DMs may not understand which dates are synced vs independently set

**What goes wrong:**
After sync is enabled, some exceptions came from other campaigns (synced), some were added directly on this campaign. The exception calendar shows all of them identically. When the DM looks at the calendar on Campaign B and sees a blocked date, they cannot tell if it was set on Campaign B directly or synced from Campaign A. If they remove it on Campaign B, does it remove it from Campaign A too? The sync semantics (bidirectional or unidirectional?) must be obvious from the UI, but are easy to get wrong.

**Prevention:**
Before implementation, lock down the sync semantics in a decision record:
- Is sync bidirectional? (Recommended yes: any campaign can write, all sync-enabled campaigns receive the write)
- Does an unblock on Campaign B sync the unblock back to Campaign A? (See Pitfall 5)
- Is there any visual indication in the exception calendar that a date was synced vs locally added? (Nice to have; not required for v1.6)

Communicate the sync behaviour in the toggle label and a brief description near the `DmExceptionCalendar` in Settings. "Unavailable dates are synced across all your campaigns. Turn this off to manage this campaign's dates independently."

**Which phases:** Settings tab phase, DM sync UX phase.

---

### Pitfall 15: The `revalidatePath` in the sync action invalidates the current campaign page, causing a full server re-render, which races with the optimistic update's rollback window

**What goes wrong:**
The existing `toggleDmException` action calls `revalidatePath` then returns `{ success: true }`. The client component receives `{ success: true }`, clears the saving indicator, and assumes the DB matches the optimistic state. But `revalidatePath` in Next.js invalidates the RSC cache for the path — meaning the next navigation to `/campaigns/${campaignId}` will fetch fresh server data. This is fine.

The risk: if the client component's optimistic update and the RSC invalidation race (e.g., the user refreshes the page while the action is still resolving), the server may render the pre-action state (the DB write has not committed yet) while the client shows the post-action optimistic state. On refresh, the old state reappears briefly, then the page re-fetches and shows the correct state.

**Why it matters for sync:** With sync, the `revalidatePath` is called for the originating campaign. If the DM navigates to another campaign immediately after toggling, they land on a non-invalidated page that may not show the synced exception. The page will not show the synced exception until next navigation or manual refresh.

**Prevention:**
This is acceptable and expected behaviour for `revalidatePath`-based cache invalidation in Next.js App Router. The only risk worth flagging: if the sync feature's UX implies "your change is instantly visible everywhere," the DM may be confused when they navigate to Campaign B and do not see the synced date. Set expectations in the UI: sync applies when Campaign B is next loaded. Alternatively, invalidate Campaign B's path too — but see Pitfall 4 for the tradeoff.

**Which phases:** DM availability sync server action phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Layout restructure | `CampaignTabs` single-component boundary must expand to own the layout switch | Refactor `CampaignTabs` to a `CampaignDetail` layout component before any other v1.6 work |
| Two-column layout | Fixed date slide-in panel collides with persistent sidebar — backdrop blocks sidebar clicks | Redesign date panel as sidebar-replacement or column-scoped overlay, not full-viewport fixed |
| Two-column layout mobile | Source order divergence between desktop visual order and mobile reading order | Calendar first in source; sidebar second; CSS Grid places sidebar right on desktop |
| Two-column layout | `selectedDate` state must remain in the top-level client component | Neither `BestDaysList` nor sidebar should manage `selectedDate` locally |
| Settings flat redesign | `<details>/<summary>` accordions left in DOM after migration causes hidden interactive elements | Remove `<details>` elements entirely; replace with `<section>` + `<h2>` |
| Settings flat redesign | `UpdatePlanningWindowForm` appears in two places; inline editor may become redundant | Decide and document: keep inline editor or add "Edit in Settings" link |
| Sync schema | `dmAvailabilitySyncEnabled` field missing from schema — Prisma crash at runtime | Add field and migrate first, before writing any sync action code; default `true` |
| Sync server action | `revalidatePath` loop over N campaigns adds latency | Only revalidate the originating campaign; other campaigns refresh naturally on navigation |
| Sync server action | Re-enable sync (toggle-on) backfill has no safe "correct" source | Do not backfill; re-enable applies forward only; document in UI label |
| Sync server action | Opposing syncs: does an unblock on Campaign A remove the date from Campaign B? | Lock down bidirectional semantics before implementing; document decision |
| DmExceptionCalendar | Rapid double-click on same date creates racing actions, split-brain state across campaigns with sync | Add per-date in-flight guard; ignore second click while first action is pending |
| Sync UX | DM cannot distinguish synced dates from independent dates in exception calendar | Add explanatory copy near opt-out toggle; defer per-date sync indicator to later milestone |
| Sidebar | Empty state when no planning window set — sidebar Best Days region appears broken | Add "Set a planning window to see best days" empty state to sidebar |

---

## Sources

- Codebase inspection (HIGH confidence): `src/app/campaigns/[id]/page.tsx`, `src/components/CampaignTabs.tsx`, `src/components/DashboardCalendar.tsx`, `src/components/DmExceptionCalendar.tsx`, `src/lib/actions/campaign.ts`, `prisma/schema.prisma` — all read directly
- Project context (HIGH confidence): `.planning/PROJECT.md` — active v1.6 requirements, v1.3 architectural decisions, existing auth and revalidation patterns
- Next.js App Router revalidation behaviour — `revalidatePath` invalidates RSC cache for path; safe to call from server actions; does not block action response (HIGH confidence — stable Next.js core behaviour, knowledge cutoff August 2025)
- React 19 Client Component state lifting — sibling components sharing state via common parent; `useState` in the lowest shared ancestor (HIGH confidence — React core pattern, stable)
- Prisma `@@unique` constraint on `DmAvailabilityException(campaignId, date)` — safe for upsert, not for simultaneous opposing delete+create (HIGH confidence — read directly from schema)
- Optimistic update + in-flight guard pattern — `useState<Set<string>>` for pending cells; ignore clicks while action is in flight (MEDIUM confidence — well-known pattern, not verified against this codebase's existing component code)
- CSS Grid source-order vs visual-order for responsive two-column layouts — accessibility concern for keyboard/screen reader navigation (HIGH confidence — WCAG 1.3.2, CSS Grid specification, stable)
- `revalidatePath` and Next.js RSC cache: calling it for N paths in one server action (MEDIUM confidence — documented Next.js behaviour; exact performance characteristics on Vercel Edge at knowledge cutoff August 2025, not live-verified)
