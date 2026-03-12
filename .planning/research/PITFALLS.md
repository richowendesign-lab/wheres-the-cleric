# Domain Pitfalls

**Domain:** Next.js 16 / React 19 App Router — adding onboarding modals, calendar legend entries, date-panel DM indicators, and empty-state messaging to an existing app
**Researched:** 2026-03-12
**Confidence:** HIGH for pitfalls grounded in direct codebase inspection; MEDIUM for accessibility and browser-behaviour specifics

---

## Critical Pitfalls

### Pitfall 1: Duplicating modal state across pages instead of extracting a shared component

**What goes wrong:**
The "How it works" modal must appear on the home page (`/`), the DM campaigns page (`/campaigns`), and at least one player-facing page. The naive approach is to copy the trigger button and the overlay JSX into each page. This works for the first page but immediately creates maintenance debt: any content change (adding a step, fixing wording) must be applied in three places. When the player perspective diverges from the DM perspective in step content, the duplicated logic becomes unreviewable.

**Why it happens:**
The three pages have different architectures. `page.tsx` (home) and `campaigns/page.tsx` are Server Components. Player availability pages are also Server Components. The temptation is to add a client-side `<details>` or modal inline to each.

**Consequences:**
Step card content drifts across pages. A bug fix on one page goes missing on another. Future steps (v1.5+) must be tracked across multiple files.

**Prevention:**
Extract a single `HowItWorksModal` client component. The component owns its own `open/setOpen` state internally — callers only need to render a trigger button. The modal content (step cards) lives in one place. Each page renders `<HowItWorksModal />` with at most a `perspective="dm" | "player"` prop if the content genuinely differs. Following the `ShareModal` pattern: the component is self-contained, uses `useState(false)`, and renders a `fixed inset-0 z-50` overlay.

**Detection:**
Search for "How it works" text in the codebase — if it appears in more than one file, duplication has occurred.

**Phase:** "How it works" modal phase.

---

### Pitfall 2: z-index collision between the "How it works" modal and the existing side panel

**What goes wrong:**
`CampaignTabs.tsx` uses two z-index layers: `z-10` for the invisible backdrop that closes the side panel, and `z-20` for the side panel itself. The snackbar uses `z-50`. The `ShareModal` uses `z-50`. If `HowItWorksModal` also uses `z-50`, stacking order is determined by DOM order — a modal that renders after the snackbar but before the side panel backdrop will partially be covered by the panel on the DM campaigns dashboard.

The home page (`/`) and player pages have no panel or snackbar, so this risk is page-specific: it only matters if "How it works" can be opened while the date side panel is open (e.g., if the DM clicks "How it works" on the campaigns dashboard while a date is selected).

**Why it happens:**
No formal z-index scale exists in this codebase. Values are chosen ad hoc per component. When two components both claim `z-50`, DOM order becomes the implicit tiebreaker — a fragile guarantee.

**Consequences:**
The "How it works" modal backdrop (`fixed inset-0 bg-black/60`) may render behind the date side panel (z-20), making the panel still interactive while the modal is supposedly blocking. This breaks the expected modal focus model.

**Prevention:**
- Establish an explicit z-index convention in a code comment or `globals.css` custom property:
  ```
  z-10  side panel backdrop (dismiss layer)
  z-20  side panel
  z-40  toasts / snackbar
  z-50  modals (ShareModal, HowItWorksModal)
  z-60  reserved for future tooltips over modals
  ```
- Ensure `HowItWorksModal` uses `z-50` and is positioned in the DOM after the side panel markup in `CampaignTabs.tsx`. Since `CampaignTabs` renders the panel and the snackbar before the tab content, a `HowItWorksModal` trigger rendered at the top of the availability tab content will appear later in the DOM — `z-50` will correctly stack above `z-20`.
- Close the date side panel when "How it works" opens (call `setSelectedDate(null)` before opening the modal) to avoid stacking altogether.

**Detection:**
Open the date side panel on the dashboard, then open "How it works" — verify the modal covers the panel fully.

**Phase:** "How it works" modal phase.

---

### Pitfall 3: Server Component pages cannot own modal open state — incorrect client boundary placement

**What goes wrong:**
`campaigns/page.tsx` is a Server Component. Server Components cannot hold `useState` for modal open/close. The temptation is to make the entire page a client component by adding `'use client'` to `campaigns/page.tsx` so the modal trigger can be a local button. This breaks the Server→Client boundary: the campaigns list query (`prisma.campaign.findMany`) must move to a client-side fetch, losing the clean "server fetches, client renders" architecture that the project has maintained since v1.0.

**Why it happens:**
Adding a simple interactive button ("How it works") to a data-heavy Server Component feels like it requires making the whole page a client. Developers unfamiliar with the existing pattern reach for the easiest fix.

**Consequences:**
Database query moves to a client-side `useEffect`, adding a loading state where there was none. The DM sees a flash of empty content. The clean Server→Client prop-passing architecture is abandoned for one page, setting a precedent that makes future pages inconsistent.

**Prevention:**
Follow the existing `ShareModal` and `CampaignTabs` pattern: keep the page as a Server Component, extract a small Client Component island that owns the modal trigger and state. The page passes no props to it because the modal has no server data dependency — a zero-prop client island is perfectly valid.

```tsx
// campaigns/page.tsx — remains a Server Component
import { HowItWorksButton } from '@/components/HowItWorksButton'

export default async function CampaignsPage() {
  // ... server data fetching unchanged ...
  return (
    <main>
      <HowItWorksButton />  {/* 'use client' island, owns modal state */}
      {/* rest of server-rendered content */}
    </main>
  )
}
```

The `HowItWorksModal` can be co-located inside `HowItWorksButton` or imported as a separate component — either is fine so long as the server page file never gains `'use client'`.

**Detection:**
Check that `campaigns/page.tsx`, `page.tsx` (home), and player pages do not have `'use client'` at the top after this feature lands.

**Phase:** "How it works" modal phase.

---

### Pitfall 4: Missing focus trap and scroll lock in the onboarding modal

**What goes wrong:**
The existing `ShareModal` does not implement a focus trap or scroll lock. This is low-risk for `ShareModal` because it opens immediately after page load on a relatively simple page, and is dismissed quickly. The "How it works" modal is different: it is opened intentionally mid-session on the dashboard, which has a scrollable page body. Without scroll lock, the user can scroll behind the modal while it is open. Without a focus trap, keyboard users can Tab out of the modal and interact with the calendar or side panel beneath the overlay.

**Why it happens:**
The `ShareModal` pattern (fixed overlay div, click-to-dismiss backdrop) gives the visual appearance of a blocking modal without enforcing blocking at the DOM interaction level. It works acceptably when the underlying page has no meaningful keyboard targets. The dashboard has many interactive targets (calendar cells, tab buttons, form inputs).

**Consequences:**
- Screen reader announces content behind the modal as focusable.
- Keyboard user Tabs past "Close" and lands on a calendar date cell, pressing Enter/Space toggles a date while the modal is visually open.
- Page scrolls behind the modal, changing position context when modal closes.

**Prevention:**
Two viable options for this app:

**Option A — Native `<dialog>` element (recommended):**
Use `<dialog>` with `.showModal()`. The browser provides: built-in focus trap (Tab stays within the dialog), Escape key closes it, inert backdrop for pointer events, and `overflow: hidden` is not needed because `<dialog>` manages stacking. React 19 supports `<dialog>` natively. Use a `useRef` and call `dialogRef.current.showModal()` in a `useEffect` when `open` becomes `true`.

```tsx
'use client'
import { useEffect, useRef } from 'react'

export function HowItWorksModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open) ref.current?.showModal()
    else ref.current?.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} className="...">
      {/* step cards */}
    </dialog>
  )
}
```

**Option B — Manual `document.body.style.overflow = 'hidden'`:**
If staying with the div-overlay pattern, add scroll lock and restore it on close. This is error-prone if the modal unmounts without the cleanup running (e.g., navigation). Prefer Option A.

**What NOT to do:**
- Do not rely on `pointer-events-none` on the backdrop for keyboard blocking — it has no effect on keyboard focus.
- Do not add `tabIndex={-1}` to the overlay div and call `.focus()` on it — this traps focus on a non-descriptive element and confuses screen readers.

**Detection:**
Open the "How it works" modal and press Tab repeatedly — focus must cycle only within the modal. Press Escape — modal must close. Open the modal and try scrolling with the mouse wheel — page must not scroll.

**Phase:** "How it works" modal phase.

---

### Pitfall 5: `dmBlocked` data not flowing into the side panel — indicator silently absent

**What goes wrong:**
`CampaignTabs.tsx` builds an `aggMap` from `dayAggregations` to power the side panel. The `DayAggregation` type already has a `dmBlocked: boolean` field (added in v1.3). The side panel renders each player's status but currently has no branch for `dmBlocked`. If the new "DM unavailable" indicator is not explicitly added to the panel's render logic, it will simply be absent — no error, no warning, just a missing feature that is easy to miss in review.

**Why it happens:**
The side panel was built before DM unavailability existed. The `dmBlocked` field is available on `agg` but the panel only iterates `playerSlots`. Since `dmBlocked` is not a player, it does not appear in the loop.

**Consequences:**
The DM clicks a date they have marked unavailable. The side panel shows only player statuses. There is no indication that the DM themselves is unavailable on that date. The calendar cell shows the amber ring (from `agg?.dmBlocked`), but the panel gives no explanation of what the amber ring means.

**Prevention:**
In `CampaignTabs.tsx`, before the `playerSlots.map(...)` loop in the side panel, add an explicit branch:

```tsx
{agg?.dmBlocked && (
  <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-800">
    <span className="w-3 h-3 rounded-full shrink-0 bg-amber-400" />
    <span className="text-gray-100 font-medium">You (DM)</span>
    <span className="text-sm ml-auto text-amber-400">Unavailable</span>
  </div>
)}
```

This renders above the player list, making DM status visually primary (it affects scheduling more than any single player).

**Detection:**
Mark a date as DM-unavailable in the Settings tab, then switch to Availability tab and click that date in the calendar. Verify the side panel shows a DM unavailable row.

**Phase:** DM unavailable indicator in date panel phase.

---

## Moderate Pitfalls

### Pitfall 6: Legend swatch colour mismatch between the legend and actual calendar cell styling

**What goes wrong:**
The existing Group Availability legend in `CampaignTabs.tsx` uses hardcoded Tailwind classes (`bg-green-400`, `bg-gray-600`) that mirror the dot colours in `DashboardCalendar.tsx`. When adding a "DM unavailable" legend swatch, the chosen colour must exactly match the amber ring on DM-blocked cells in `DashboardCalendar`. Currently, the ring is `ring-amber-400/60` (60% opacity amber). A legend swatch of `bg-amber-400` at full opacity will look visually different.

**Why it happens:**
Tailwind opacity utilities (`/60`) apply to the colour, not as a CSS `opacity` property. The rendered colour of `ring-amber-400/60` is a desaturated amber, visually closer to a warm grey than the saturated `amber-400`. A full-opacity swatch implies a colour that does not exist in the calendar.

**Consequences:**
DM tells a colleague "the amber dots are DM unavailable" — the legend shows a bright amber, the calendar shows a muted amber ring. The legend fails its job.

**Prevention:**
Use the same Tailwind utility in both places. Options:

1. Change the legend swatch to `bg-amber-400/60 ring-1 ring-amber-400/60` (or a similar rounded square with matching opacity).
2. Change the calendar ring to full opacity `ring-amber-400` and update the legend to `bg-amber-400`.

Option 2 is simpler and more legible. The amber ring in `DashboardCalendar` was set to `/60` to be subtle — if the feature is now being made more prominent (legend + indicator), increasing its visibility is appropriate.

**Detection:**
Place the rendered legend swatch and the rendered calendar cell side by side and compare. If you can see a clear colour difference, fix the opacity.

**Phase:** Calendar legend phase.

---

### Pitfall 7: The side panel's "No response" label applied when ALL players have no response reads as unhelpful, not as an empty state

**What goes wrong:**
The requirement is: "Date modal shows a clear single message when no players are available (instead of listing players as 'No response')." The current panel lists every player with their status. When a date falls early in the planning window and no player has submitted any availability, every row shows "No response". The panel looks like a normal populated list, not an empty state — the DM must read all rows to realise nobody has responded rather than seeing one clear message.

**Why it happens:**
The panel renders `playerSlots.map(...)` unconditionally. The empty-state case is not distinguished from the "data exists but is all no-response" case. Both produce the same rendered output.

**Consequences:**
DM clicks a date, sees four "No response" rows, and does not understand whether this means nobody has responded at all or whether everyone specifically declined. The messaging conflates absence of data with a negative data point.

**Prevention:**
Before the player list, check whether every player's status is `'no-response'`:

```tsx
const allNoResponse = playerSlots.every(
  slot => (agg?.playerStatuses[slot.id] ?? 'no-response') === 'no-response'
)

if (allNoResponse) {
  return <p className="text-sm text-gray-500">No players have submitted availability yet.</p>
}
// otherwise render the player list normally
```

This is different from zero players (no player slots at all) — the message must distinguish between "no players exist" and "players exist but none have responded." Check `playerSlots.length === 0` first as a separate guard.

**Detection:**
Create a campaign, add players but do not submit any availability. Click any date in the calendar. Verify the panel shows the single empty-state message, not a list of "No response" rows.

**Phase:** Empty state messaging phase.

---

### Pitfall 8: Opening "How it works" modal breaks back-button expectation if history is manipulated

**What goes wrong:**
`ShareModal` calls `router.replace(window.location.pathname, { scroll: false })` on dismiss to clean the `?share=1` param from the URL. This is correct for `ShareModal` because its open state is derived from a URL param. The "How it works" modal must NOT manipulate the URL — it is triggered by a button click, not a URL param, and pushing a history entry (or replacing) for a UI-only modal creates a broken back-button: user opens modal, presses Back, browser navigates to the previous page instead of closing the modal.

**Why it happens:**
Developers familiar with `ShareModal`'s dismiss pattern may cargo-cult `router.replace` into the new modal, not realising the two modals have different URL-coupling contracts.

**Consequences:**
User opens "How it works", presses Escape or clicks backdrop, modal closes correctly. User opens "How it works" again, presses browser Back — navigates away from the page entirely.

**Prevention:**
The "How it works" modal must be purely UI state: `useState(false)`, open on button click, close on backdrop/Escape/button, no URL manipulation. No `router.push`, no `router.replace`. Document this constraint as a code comment in the component.

**Detection:**
Open the modal, close it, open it again, press the browser Back button — the page must not navigate.

**Phase:** "How it works" modal phase.

---

### Pitfall 9: Step cards with numbered visuals must work without JavaScript

**What goes wrong:**
The "How it works" modal uses visual numbered cards (step number + heading + description). If the step number is rendered via a CSS counter or JavaScript-computed index, disabling JavaScript or rendering in a low-capability environment will produce cards with invisible or 0-indexed numbers.

**Why it happens:**
Developers reach for array index (`steps.map((step, i) => <StepCard number={i + 1} ... />)`) which is fine — but if the step number display relies on `::before` CSS counter without a fallback, SSR produces a number but client-side the counter resets on hydration, causing a flash.

**Prevention:**
Pass the step number explicitly as a prop or as a hardcoded value in the step data array. Do not use CSS counters for this. Since the steps are static content (not dynamic), a hardcoded array like:
```ts
const STEPS = [
  { number: 1, heading: '...', description: '...' },
  { number: 2, heading: '...', description: '...' },
]
```
is the safest and most maintainable approach. Numbers are always correct regardless of rendering environment.

**Detection:**
Verify step numbers display correctly in the first SSR paint (view source) and after hydration.

**Phase:** "How it works" modal phase.

---

### Pitfall 10: aria-label on the "How it works" trigger button is insufficient — modal needs role and aria-labelledby

**What goes wrong:**
The trigger button can have a clear label ("How it works"). But when the modal opens, a screen reader must be able to announce the modal heading ("How it works — How it works") and convey that the user is now inside a dialog. Without `role="dialog"` and `aria-labelledby` pointing to the modal heading, the screen reader simply announces whatever element received focus, which may be the close button or the first step card — not the modal title.

**Why it happens:**
The existing `ShareModal` has `<h2>` inside the modal panel, but no `role="dialog"` or `aria-labelledby` on the container. This is an existing accessibility gap. The new modal is an opportunity to set the correct standard.

**Prevention:**
If using native `<dialog>` (recommended, per Pitfall 4), no explicit `role="dialog"` is needed — `<dialog>` has the implicit role. Provide `aria-labelledby` pointing to the heading inside the dialog:

```tsx
<dialog ref={ref} aria-labelledby="how-it-works-title" onClose={onClose}>
  <h2 id="how-it-works-title">How it works</h2>
  {/* step cards */}
</dialog>
```

If using the div-overlay pattern, add `role="dialog" aria-modal="true" aria-labelledby="how-it-works-title"` to the panel div.

**Detection:**
Use VoiceOver (macOS) or NVDA (Windows). Open the modal. The screen reader must announce "How it works, dialog" when focus moves into the modal.

**Phase:** "How it works" modal phase.

---

## Minor Pitfalls

### Pitfall 11: Legend items in CampaignTabs are hardcoded — adding a DM swatch requires understanding conditional rendering

**What goes wrong:**
The legend in `CampaignTabs.tsx` currently shows two items: "Free" and "No response." These are always rendered when the calendar is shown. A "DM unavailable" swatch should only appear if the DM has actually marked at least one date as unavailable (otherwise it adds a legend entry for a colour the DM may never see in the calendar, creating confusion).

**Why it happens:**
The legend is hardcoded and always rendered. Adding a third item unconditionally is the path of least resistance.

**Consequences:**
DM has not marked any unavailable dates. Legend shows "DM unavailable" in amber. DM wonders where the amber dates are. Confusion, not clarity.

**Prevention:**
Conditionally render the DM unavailable legend entry only when `dmExceptionDates.length > 0`:

```tsx
{dmExceptionDates.length > 0 && (
  <span className="flex items-center gap-1.5">
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />DM unavailable
  </span>
)}
```

This data is already available as a prop on `CampaignTabs` (`dmExceptionDates: string[]`).

**Detection:**
Render the dashboard with no DM exception dates — legend must show only two items. Mark one date, reload — legend must now show three items.

**Phase:** Calendar legend phase.

---

### Pitfall 12: "How it works" modal content for DM vs player perspectives may diverge — avoid branching content within one component

**What goes wrong:**
The DM sees the app from a campaign-management perspective (create campaign, share link, read calendar). Players see it from an availability-submission perspective. If the modal shows both perspectives (e.g., "Step 1: DM creates a campaign / Step 1: Visit the join link"), the same component would need conditional rendering that grows complex as steps are added or content changes per version.

**Why it happens:**
The requirement says "DM and player can access a 'How it works' explainer." The simplest reading is one modal that shows both flows. But a DM already knows how to create a campaign — showing "Step 1: DM creates a campaign" to the DM is redundant. Similarly, a player does not need to know the DM's workflow.

**Prevention:**
Show both DM and player steps in a single unified linear flow: "Step 1 (DM): Create a campaign → Step 2 (DM): Share the link → Step 3 (Players): Submit availability → Step 4 (DM): See the best dates." This narrative works for both audiences because it explains the full picture. No branching needed. Alternatively, use a tab inside the modal ("For DMs" / "For Players") but only if the content genuinely cannot be presented linearly. Avoid `perspective` props that gate entire sections.

**Detection:**
Show the modal to a DM and a player independently. Both should leave understanding the full workflow without information that confuses rather than clarifies.

**Phase:** "How it works" modal phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| "How it works" modal | Duplicating modal JSX across three pages | Extract a single `HowItWorksModal` client component; pages render zero-prop or minimal-prop islands |
| "How it works" modal | Server Component pages cannot hold modal state | Keep pages as Server Components; extract `HowItWorksButton` as the client island |
| "How it works" modal | z-index collision with side panel (z-20) and snackbar (z-40/z-50) | Document z-index scale; use z-50 for all modals; optionally close side panel on modal open |
| "How it works" modal | No focus trap — keyboard users escape the modal | Use native `<dialog>` with `.showModal()` for built-in focus trap and Escape handling |
| "How it works" modal | URL manipulation causing broken back button | No `router.push/replace` — modal is pure UI state, no URL coupling |
| "How it works" modal | Missing `aria-labelledby` on modal container | Point `aria-labelledby` to modal heading; use `<dialog>` for implicit `role="dialog"` |
| Calendar legend | DM unavailable swatch colour differs from actual ring | Match opacity modifier exactly; consider making the ring full opacity for legibility |
| Calendar legend | Legend shows DM swatch even with zero exception dates | Conditionally render swatch only when `dmExceptionDates.length > 0` |
| Date panel indicator | `dmBlocked` field exists but panel does not render it | Add explicit `agg?.dmBlocked` branch in `CampaignTabs` side panel before player list |
| Empty state messaging | All-"No response" reads like a populated list, not an empty state | Check `allNoResponse` before rendering player list; show single contextual message instead |

---

## Sources

- Codebase inspection: `src/components/ShareModal.tsx`, `src/components/CampaignTabs.tsx`, `src/components/DashboardCalendar.tsx`, `src/components/DmExceptionCalendar.tsx`, `src/app/campaigns/page.tsx`, `src/app/page.tsx`, `src/app/layout.tsx` (HIGH confidence — first-party)
- Project context: `.planning/PROJECT.md` — existing architectural decisions (Server→Client boundary, searchParams pattern, redirect behaviour) (HIGH confidence — first-party)
- React 19 `<dialog>` support and `.showModal()` with `useRef` (HIGH confidence — core React 19 / HTML spec behaviour, knowledge cutoff August 2025)
- ARIA dialog pattern: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap requirements — W3C ARIA Authoring Practices Guide (HIGH confidence — stable spec)
- Tailwind CSS 4 opacity modifier behaviour (`/60` on colour utilities) (HIGH confidence — Tailwind docs, knowledge cutoff August 2025)
- Browser history API behaviour with modal UI — `pushState`/`replaceState` implications for Back button (HIGH confidence — Web API spec, stable)
