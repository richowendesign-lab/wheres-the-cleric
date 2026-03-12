# Architecture Patterns

**Domain:** D&D session scheduler — v1.4 UI clarity features
**Researched:** 2026-03-12
**Confidence:** HIGH — based on direct codebase inspection

---

## Context: Established Architecture (v1.3 Baseline)

These constraints are load-bearing. Every integration decision below works within them.

- Server Components own all data fetching. No client-side fetching exists anywhere.
- `CampaignTabs` is the single Client Component boundary on the campaign detail page. It
  receives all data as serialized props from the Server Component and owns tab state, the
  date side-panel (`selectedDate`), and the planning-window inline editor.
- `DashboardCalendar` is a Client Component nested inside `CampaignTabs`. It receives
  `dayAggregations`, `playerSlots`, `windowStart`, `windowEnd`, `selectedDate`, and
  `onSelectDate` as props. It does not own the `selectedDate` state — `CampaignTabs` does.
- The date side-panel (slide-in drawer, `fixed inset-y-0 right-0 w-80`) is rendered in
  `CampaignTabs`, not in `DashboardCalendar`. `DashboardCalendar` calls `onSelectDate` and
  `CampaignTabs` responds by opening the panel.
- `DayAggregation.dmBlocked` already exists (added in v1.3). It is already computed,
  already passed through to `CampaignTabs` via `dayAggregations`, and already used in
  `DashboardCalendar` to apply the amber ring visual.
- Modal pattern established by `ShareModal`: `'use client'`, `useState(open)`, fixed overlay
  div with backdrop, `router.replace` to clean URL params on dismiss (when modal is
  URL-triggered). No portal, no context, no global modal system.
- CSS-only hover tooltips via Tailwind `group-hover` — no JS state for tooltips.
- Layout: `src/app/layout.tsx` is a minimal Server Component — no navigation bar, no global
  context providers. Pages are fully standalone.

---

## Feature 1: HowItWorksModal — Global "How it works" explainer

### Where it lives

`src/components/HowItWorksModal.tsx` — standalone Client Component, not wired into any
existing component. Each page that needs it renders the modal and its trigger independently.

### Trigger pattern

Each page adds a `HowItWorksButton` — a small `'use client'` component (or inline in a
page-level Client Component) that holds `useState(false)` for open/closed and renders the
modal when open.

Because the home page, campaigns page, join page, and availability page are all Server
Components, none of them can call `useState` directly. The trigger must be extracted into a
Client Component. The minimum-change approach is a single `HowItWorksButton` Client Component
that owns the open state and renders both the trigger and the modal:

```typescript
// src/components/HowItWorksButton.tsx
'use client'
import { useState } from 'react'
import { HowItWorksModal } from './HowItWorksModal'

export function HowItWorksButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How it works"
        className="..."
      >
        ?
      </button>
      {open && <HowItWorksModal onClose={() => setOpen(false)} />}
    </>
  )
}
```

`HowItWorksModal` receives only `onClose` as a prop. It contains no business logic — it is a
pure display component:

```typescript
// src/components/HowItWorksModal.tsx
'use client'

export function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[var(--dnd-input-bg)] border border-[#ba7df6]/30 rounded-lg p-6 max-w-lg w-full mx-4">
        {/* numbered step cards */}
      </div>
    </div>
  )
}
```

The `HowItWorksModal` can be a `'use client'` file even if it has no internal state, because
it is imported by `HowItWorksButton` which is already `'use client'`. Alternatively it can
be a pure server-renderable component (no browser APIs) that gets rendered inside the client
boundary. Either works — the cleanest split keeps modal content in a separate file from the
button so the step copy can be edited in isolation.

### Why not URL params (like ShareModal)?

`ShareModal` is URL-triggered because it must survive a server-side redirect. The "How it
works" modal is user-initiated on demand — no redirect involved. `useState` in
`HowItWorksButton` is the right tool. URL params would add unnecessary complexity and mean
the modal state appears in browser history.

### Why not a global modal context in layout.tsx?

The layout has no Client Component boundary. Adding one just for this modal would pull the
entire layout into the client bundle. The narrow `HowItWorksButton` island is cheaper and
consistent with how the project handles all other client interactivity.

### Pages that get the button

Each Server Component page adds `<HowItWorksButton />` in the appropriate position in its JSX:

| Page | File | Placement |
|------|------|-----------|
| Home (unauthenticated) | `src/app/page.tsx` | Near the Log In / Sign Up buttons |
| DM campaigns list | `src/app/campaigns/page.tsx` | Header row alongside logout |
| Player join/register | `src/app/join/[joinToken]/page.tsx` | Near the name entry form |
| Player availability | `src/app/join/[joinToken]/availability/page.tsx` | Page header |

The campaign detail page (`/campaigns/[id]`) can optionally include it within `CampaignTabs`
(already a Client Component) — see Component Boundaries table below.

### Data requirements

None. The modal content is static step copy — no props beyond `onClose`. No Server Action, no
DB query, no new data flow.

---

## Feature 2: DM Unavailability Legend Entry in DashboardCalendar

### Where it lives

The legend sits in `CampaignTabs`, not in `DashboardCalendar`. Looking at the existing code
(lines 256–263 of `CampaignTabs.tsx`):

```tsx
<div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
  <span className="flex items-center gap-1.5">
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" />Free
  </span>
  <span className="flex items-center gap-1.5">
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-600" />No response
  </span>
</div>
```

This is the exact location to add the DM unavailable entry. It is conditionally rendered only
when `windowStartStr && windowEndStr` (which gates the calendar display), so the condition is
already in place.

### What to add

A third legend entry using the existing amber ring visual language. The calendar already shows
`ring-1 ring-amber-400/60` on DM-blocked dates (line 143 of `DashboardCalendar.tsx`). The
legend entry should match:

```tsx
<span className="flex items-center gap-1.5">
  <span className="inline-block w-2.5 h-2.5 rounded border border-amber-400/60" />DM unavailable
</span>
```

Using a bordered square (not a filled dot) differentiates it visually from the player-status
dots, matching the ring visual used on calendar cells.

### Condition gate

Only show this legend entry when the campaign has at least one DM exception. `CampaignTabs`
already receives `dmExceptionDates: string[]` as a prop. The condition is:

```tsx
{dmExceptionDates.length > 0 && (
  <span className="flex items-center gap-1.5">
    <span className="inline-block w-2.5 h-2.5 rounded border border-amber-400/60" />DM unavailable
  </span>
)}
```

This avoids confusing players/DM with a legend entry for a feature they have not used yet.

### Data requirements

No change. `dmExceptionDates` is already a prop on `CampaignTabs`. `DayAggregation.dmBlocked`
is already computed. No new prop threading needed.

---

## Feature 3: DM Unavailable Indicator in the Date Side-Panel

### Where it lives

The date side-panel is rendered entirely within `CampaignTabs` (lines 109–153). It already
builds `const agg = aggMap.get(selectedDate)` which gives access to `agg.dmBlocked`.

### What to add

A single conditional block inside the panel body, before the player list:

```tsx
<div className="p-4 space-y-3 overflow-y-auto flex-1">
  {/* DM indicator — only when this date is DM-blocked */}
  {agg?.dmBlocked && (
    <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
      <span className="w-3 h-3 rounded shrink-0 border border-amber-400/60" />
      <span className="text-amber-300/80 text-sm font-medium">DM unavailable</span>
    </div>
  )}
  {/* existing player list */}
  {playerSlots.map(slot => { ... })}
</div>
```

### Data requirements

No change. `agg.dmBlocked` is already in the `aggMap` that `CampaignTabs` builds from
`dayAggregations`. No new prop or data fetch.

---

## Feature 4: Empty State in the Date Side-Panel

### Where it lives

Same location — the player list inside `CampaignTabs`'s side-panel (lines 133–149).

### Current behaviour

When no players are available, all players render as "No response" (gray dot, gray text). This
is accurate but not helpful — it looks like a list of non-responses rather than a clear signal.

### What to add

Two separate improvements:

**A. No-players-free summary line** (when `freeCount === 0`):

```tsx
{agg && agg.freeCount === 0 && (
  <p className="text-sm text-gray-500 italic mb-2">No players available this day.</p>
)}
```

Placed above the player list so the DM sees the summary first.

**B. Distinguish "busy" from "no response"** (optional but useful):

The current `playerStatuses` type only has `'free' | 'no-response'`. The existing tooltip and
panel both display "No response" for both truly-busy and simply-unresponded players. This
distinction exists in the data (`AvailabilityEntry.status === 'busy'` is stored) but is
collapsed before reaching the panel. Changing this would require threading a richer status
type through `DayAggregation` — that is a moderate schema/data-flow change.

For this milestone, the simpler fix is B.1 only: show the clear empty-state message when
`freeCount === 0`. Do not attempt to distinguish busy vs no-response — that is a separate
concern and out of scope per the requirements.

### Data requirements

No change. `agg.freeCount` is already in `DayAggregation` and already in `aggMap`.

---

## Component Boundaries

| Component | Type | Change | Notes |
|-----------|------|--------|-------|
| `HowItWorksModal` | Client (new) | Create | Static step cards, `onClose` prop only |
| `HowItWorksButton` | Client (new) | Create | Owns `useState(open)`, renders modal |
| `src/app/page.tsx` | Server | Modify | Add `<HowItWorksButton />` |
| `src/app/campaigns/page.tsx` | Server | Modify | Add `<HowItWorksButton />` to header row |
| `src/app/join/[joinToken]/page.tsx` | Server | Modify | Add `<HowItWorksButton />` |
| `src/app/join/[joinToken]/availability/page.tsx` | Server | Modify | Add `<HowItWorksButton />` |
| `CampaignTabs` | Client | Modify | (1) Add legend entry, (2) add DM indicator in panel, (3) add empty-state message in panel |
| `DashboardCalendar` | Client | No change | `dmBlocked` visual already exists |

No new data fetching. No new Server Actions. No schema changes. No new props on any existing
component (all required data is already threaded).

---

## Data Flow: What Changes vs What Stays

### What stays identical

- Server Component fetches campaign data and serializes to props — unchanged.
- `CampaignTabs` receives `dayAggregations` (with `dmBlocked` already set) — unchanged.
- `DashboardCalendar` receives `dayAggregations` — unchanged.
- The side-panel `aggMap` lookup — unchanged.

### What changes

- `CampaignTabs` JSX: three small additions (legend entry, DM indicator block, empty-state
  paragraph). All read from data already in scope.
- Four Server Component pages: each adds one `<HowItWorksButton />` import and render.
- Two new files created: `HowItWorksModal.tsx`, `HowItWorksButton.tsx`.

### No new data flows introduced

```
Server Component (unchanged)
  → CampaignTabs props (unchanged)
     → aggMap (unchanged) — dmBlocked already present
     → dmExceptionDates (unchanged) — length check for legend gate
     → DashboardCalendar (unchanged)
```

---

## Build Order

Dependencies between the four features are minimal. Build order:

**Step 1: HowItWorksModal and HowItWorksButton (no deps)**

Write `HowItWorksModal.tsx` with static step content first. Then wrap in `HowItWorksButton.tsx`.
Wire into all four pages. This is purely additive — no existing file changes except adding one
import and one JSX element per page.

**Step 2: DM legend entry in CampaignTabs (no deps)**

Single JSX addition in `CampaignTabs.tsx` inside the existing legend block. Gate on
`dmExceptionDates.length > 0`. No other changes needed.

**Step 3: DM indicator in date side-panel (depends on Step 2 visual language)**

Adds one conditional block inside the panel `<div className="p-4 ...">`. Uses same amber
color tokens as the legend entry from Step 2. Logically independent but should share visual
language — do after Step 2.

**Step 4: Empty state in date side-panel (no deps)**

One paragraph element added inside the same panel `<div>`. Can be done alongside Step 3 in
the same edit.

Steps 2, 3, and 4 are all edits to `CampaignTabs.tsx` and can be done in one sitting.

---

## Patterns to Follow

### Pattern: Narrow Client Component Island for Modal Trigger

`HowItWorksButton` follows the same pattern as `CopyLinkButton`, `DeleteCampaignButton`, and
`ShareModal` — a small `'use client'` island embedded in a Server Component page. The Server
Component page does not need to become a Client Component; it just renders the island.

### Pattern: Static Modal with onClose Callback

`HowItWorksModal` follows `ShareModal`'s structure exactly: `fixed inset-0 z-50` overlay,
`fixed inset-0 bg-black/60` backdrop (click to close), panel div. The only difference from
`ShareModal` is that the modal is closed via the `onClose` callback (state in the parent
`HowItWorksButton`) rather than via `router.replace` — because no URL cleanup is needed.

### Pattern: Data Already in Scope, No New Props

All three `CampaignTabs` changes (legend, indicator, empty state) read from props and local
derived state (`aggMap`) that already exist. This is the minimum-change approach — no prop
drilling required, no new data fetching, no changes to the Server Component page.

---

## Anti-Patterns to Avoid

### Anti-Pattern: Adding a Global Modal Context to layout.tsx

The layout is a Server Component. Wrapping it in a Client Component to host modal state would
pull the entire application into the client bundle. The `HowItWorksButton` island avoids this.

### Anti-Pattern: URL-Triggering the HowItWorks Modal

URL params are the right tool for modals that must survive a server-side redirect (like
`ShareModal`). For a user-initiated modal triggered by a button click, `useState` in a narrow
Client Component is simpler, cleaner, and does not pollute browser history.

### Anti-Pattern: Adding the DM Indicator Inside DashboardCalendar

`DashboardCalendar` does not own the side-panel. The side-panel is in `CampaignTabs`. Adding
an indicator inside `DashboardCalendar` would require lifting more state or adding new props.
The indicator belongs in the panel where it is already rendered.

### Anti-Pattern: Threading New Props Through DashboardCalendar for the Legend

The legend sits in `CampaignTabs` above `<DashboardCalendar />`. `DashboardCalendar` does
not need to know about the legend — it already has `dmBlocked` on each `DayAggregation`.
Adding a `showDmLegend` prop to `DashboardCalendar` would be unnecessary indirection.

### Anti-Pattern: Distinguishing 'busy' vs 'no-response' in This Milestone

`PlayerDayStatus` currently collapses both states to `'no-response'`. Separating them would
require changes to `DayAggregation`, `computeDayStatuses`, and every component that reads
player statuses. That is a meaningful refactor — out of scope for a polish milestone that
targets the empty-state message specifically.

---

## Sources

- Direct inspection of `/Users/richardowen/Desktop/wheres-the-cleric/src/components/CampaignTabs.tsx`
- Direct inspection of `/Users/richardowen/Desktop/wheres-the-cleric/src/components/DashboardCalendar.tsx`
- Direct inspection of `/Users/richardowen/Desktop/wheres-the-cleric/src/components/ShareModal.tsx`
- Direct inspection of `/Users/richardowen/Desktop/wheres-the-cleric/src/lib/availability.ts`
- Direct inspection of all four Server Component pages that need the "?" button
- Direct inspection of `/Users/richardowen/Desktop/wheres-the-cleric/src/app/layout.tsx`
- All findings derived from codebase state. No training-data assumptions.
