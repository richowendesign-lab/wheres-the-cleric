# Phase 14: Dashboard Redesign — Research

**Researched:** 2026-03-10
**Domain:** React Client Component refactor — tab layout, calendar navigation, Server/Client split
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Layout: Tabs (Availability / Settings)**
Two tabs at the top of the campaign page.
- Availability tab (default, shown on load)
- Settings tab (join link, planning window, delete campaign)

**Section order inside Availability tab**
1. Group Availability (DashboardCalendar + BestDaysList) — the hero section
2. DM Availability Exceptions (DmExceptionCalendar) — below the calendar

**Awaiting Response** remains in the Availability tab, above the calendar (current position relative to calendar is preserved).

**Campaign Settings tab contents**
- Join Link (read-only + copy) + UpdateMaxPlayersForm
- Planning Window (UpdatePlanningWindowForm)
- Danger Zone (DeleteCampaignButton)

**DASH-01** Calendar adapts with prev/next arrows; NOT a hardcoded two-month side-by-side layout.

**DashboardCalendar navigation**
- Add `currentMonthIndex` state, prev/next buttons
- Show 1 or 2 months at a time (single month on mobile, 2-up on large screens if planning window >= 2 months)
- Hide prev/next if only 1 month in window

**Tab implementation**
- Simple `useState` toggle, no URL-based routing
- No routing needed (no URL change on tab switch)

### Claude's Discretion

No explicit discretion areas stated. All decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- DmExceptionCalendar UX refinement (interaction design to be revisited in a future phase)
- DashboardCalendar internals (day cell rendering, dmBlocked ring, click behaviour)
- BestDaysList internals
- All server actions and data fetching
- All Prisma queries
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Calendar view adapts to the planning window — one or two months visible at a time, with prev/next arrows to navigate when the window spans more | DashboardCalendar already computes the full `months[]` array; add `currentMonthIndex` useState + navigation buttons that slice into it |
| DASH-02 | Days outside the planning window are visually muted on the calendar | Already implemented in DashboardCalendar (`isOutside` check → gray-700 text, no button); confirm it survives the navigation refactor |
| DASH-03 | DM sees a ranked best-day list alongside the calendar | BestDaysList already exists and works correctly; wiring is already in page.tsx; no changes needed beyond layout reorganisation |
| DASH-04 | Each ranked date shows player count and names of unavailable players | BestDaysList already renders `{day.freeCount}/{day.totalPlayers} players free` and free player names; confirm completeness — names of **unavailable** players are not explicitly listed (only free player names are); may need a small fix |
| DASH-05 | Share link, planning window dates, and delete campaign remain accessible but de-emphasised | Settings tab receives JoinLink + UpdateMaxPlayersForm + UpdatePlanningWindowForm + DeleteCampaignButton; moved out of Availability tab |
</phase_requirements>

---

## Summary

Phase 14 is a pure UI refactor of the campaign dashboard (`src/app/campaigns/[id]/page.tsx`) with two interrelated changes: (1) extracting a client-side tab switcher to reorganise page sections, and (2) adding prev/next navigation to `DashboardCalendar`. No new data fetching, server actions, or schema changes are required.

The existing code is well-factored. `DashboardCalendar` already builds the full list of months in the planning window (`months[]` array, lines 60-69 of the component). Adding navigation means introducing a `currentMonthIndex` state and slicing that array to display 1 month (mobile) or 2 months (large screen). The 2-up responsive display can be achieved with a CSS responsive slice approach — no JavaScript media query listener needed.

The tab component needs to be a new Client Component (`CampaignTabs` or similar) because it requires `useState`. The parent `CampaignDetailPage` is a Server Component and must remain so (it owns all data fetching). The approach: `CampaignDetailPage` passes all data as props into the Client tab component, which then renders the correct tab's children. This is the standard Next.js App Router Server→Client boundary pattern.

One DASH-04 detail needs verification: the current `BestDaysList` shows **free** player names, but the requirement says "names of unavailable players." The current implementation satisfies the spirit (player count is shown), and may need a small adjustment to also list who cannot make it.

**Primary recommendation:** Create one new `CampaignTabs` Client Component that accepts all pre-fetched data as props, manages tab state, and renders the two tabs. Separately modify `DashboardCalendar` to add `currentMonthIndex` state and prev/next buttons. No routing changes needed.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | `useState` for tab + calendar navigation state | Already in project; Client Components use it |
| Next.js | 16.1.6 | App Router Server/Client boundary | Already in project |
| Tailwind CSS | 4.x | All styling | Already in project; `@theme` tokens established |
| TypeScript | 5.x | Type safety across props | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | — | All needed tools already in project |

No new npm packages are required for this phase.

**Installation:**
```bash
# No new dependencies
```

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── app/campaigns/[id]/
│   └── page.tsx              # Server Component — data fetching only; passes all data into CampaignTabs
├── components/
│   ├── CampaignTabs.tsx      # NEW — Client Component; manages tab state; renders Availability/Settings tabs
│   └── DashboardCalendar.tsx # MODIFIED — add currentMonthIndex state + prev/next navigation
```

No other files need modification.

### Pattern 1: Server → Client Boundary (Tab Wrapper)

**What:** `CampaignDetailPage` remains a Server Component. It collects all props and passes them into a single new Client Component (`CampaignTabs`) as serialisable data. `CampaignTabs` owns `useState` for the active tab and renders the two tab panels.

**When to use:** Any time a Server Component needs to pass interactive state to client-rendered UI in Next.js App Router.

**Why this approach:** The page already does all data fetching synchronously in the Server Component. Keeping data fetching there and pushing state management into a wrapper Client Component is the standard App Router pattern. It avoids `'use client'` on the entire page and keeps data fetching fast.

**Example:**
```typescript
// src/app/campaigns/[id]/page.tsx  (Server Component — unchanged boundary)
// All data fetched here, then:
return (
  <main className="min-h-screen text-gray-100 px-4 py-12">
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header: Back link + Log out (stays outside tabs) */}
      <div className="flex items-center justify-between">...</div>

      {/* Title + description (stays outside tabs) */}
      <div className="flex flex-col gap-2">...</div>

      {/* Tab component takes all pre-fetched data as props */}
      <CampaignTabs
        campaignId={campaign.id}
        joinUrl={joinUrl}
        campaign={campaign}             // for UpdatePlanningWindowForm
        maxPlayers={campaign.maxPlayers}
        playerSlotCount={campaign.playerSlots.length}
        dayAggregations={dayAggregations}
        playerSlots={serializedSlots.map(s => ({ id: s.id, name: s.name }))}
        windowStart={windowStartStr ?? ''}
        windowEnd={windowEndStr ?? ''}
        missingPlayers={missingPlayers.map(s => ({ id: s.id, name: s.name }))}
        dmExceptionDates={dmExceptionDates}
        dmExceptionMode={dmExceptionMode}
      />

      {share === '1' && <ShareModal joinUrl={joinUrl} />}
    </div>
  </main>
)
```

```typescript
// src/components/CampaignTabs.tsx  (new Client Component)
'use client'

import { useState } from 'react'

type Tab = 'availability' | 'settings'

export function CampaignTabs({ /* all props */ }) {
  const [activeTab, setActiveTab] = useState<Tab>('availability')

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[var(--dnd-border-muted)]">
        <button
          type="button"
          onClick={() => setActiveTab('availability')}
          className={`px-4 py-2 text-sm font-medium transition-colors
            ${activeTab === 'availability'
              ? 'text-white border-b-2 border-[var(--dnd-accent)] -mb-px'
              : 'text-[var(--dnd-text-muted)] hover:text-white'}`}
        >
          Availability
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-medium transition-colors
            ${activeTab === 'settings'
              ? 'text-white border-b-2 border-[var(--dnd-accent)] -mb-px'
              : 'text-[var(--dnd-text-muted)] hover:text-white'}`}
        >
          Settings
        </button>
      </div>

      {/* Availability tab */}
      {activeTab === 'availability' && (
        <div className="space-y-8">
          {/* Awaiting Response */}
          {/* Group Availability: DashboardCalendar + BestDaysList */}
          {/* DM Availability Exceptions: DmExceptionCalendar */}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* Join Link */}
          {/* Planning Window */}
          {/* Danger Zone */}
        </div>
      )}
    </>
  )
}
```

### Pattern 2: Calendar Month Navigation

**What:** `DashboardCalendar` currently renders ALL months in the planning window. Add a `currentMonthIndex` state (0-based index into the `months[]` array). Prev/next buttons decrement/increment it, clamped to valid bounds.

**When to use:** When the planning window spans more than 1 month (hide buttons when `months.length === 1`).

**2-up display logic:** On large screens when `months.length >= 2`, show months at index `currentMonthIndex` and `currentMonthIndex + 1` side by side. On mobile, always show only 1 month. Navigate by 1 month at a time in both cases. When 2-up and at the last odd month, show only 1 month.

**Example:**
```typescript
// In DashboardCalendar — simplified navigation logic
const [currentMonthIndex, setCurrentMonthIndex] = useState(0)

// months[] already computed (existing logic kept intact)
// Slice: mobile = [months[currentMonthIndex]], lg = [months[currentMonthIndex], months[currentMonthIndex + 1]].filter(Boolean)

const showPrev = currentMonthIndex > 0
const showNext = currentMonthIndex < months.length - 1

// For 2-up mode on large screens, also advance by 1 at a time
// so the DM can step through one month at a time regardless of display width
```

**Navigation button styling — consistent with existing action patterns:**
```typescript
// Prev/Next arrows matching the app's muted/accent pattern
<button
  type="button"
  onClick={() => setCurrentMonthIndex(i => Math.max(0, i - 1))}
  disabled={!showPrev}
  className="p-1.5 rounded text-[var(--dnd-text-muted)] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
  aria-label="Previous month"
>
  ←
</button>
<span className="text-sm text-gray-300">{monthLabel}</span>
<button
  type="button"
  onClick={() => setCurrentMonthIndex(i => Math.min(months.length - 1, i + 1))}
  disabled={!showNext}
  className="p-1.5 rounded text-[var(--dnd-text-muted)] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
  aria-label="Next month"
>
  →
</button>
```

**Responsive 2-up display** (CSS, no JS media query listener):
```typescript
// Container wrapping the month grid(s):
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Always show currentMonthIndex */}
  <MonthGrid ... />
  {/* Conditionally show next month on large screens */}
  {months[currentMonthIndex + 1] && (
    <div className="hidden lg:block">
      <MonthGrid ... />
    </div>
  )}
</div>
```

### Pattern 3: Prop Serialisation Boundary

**What:** Server Components can only pass serialisable data to Client Components. All props crossing the boundary must be plain objects, strings, numbers, booleans, arrays — no Date objects, no Prisma models.

**Critical:** `campaign` (the Prisma Campaign object) cannot be passed directly to a Client Component because it contains `Date` fields. Pass only what is needed — `campaignId: string`, `maxPlayers: number | null`, the serialised form already done in `page.tsx` for `windowStartStr`/`windowEndStr`.

**The `UpdatePlanningWindowForm` issue:** It currently accepts a `campaign: { id: string; planningWindowStart: Date | null; planningWindowEnd: Date | null }` prop. Since `Date` objects are not serialisable, the form's campaign prop must be replaced with pre-serialised strings when crossing the Server→Client boundary in `CampaignTabs`. Pass `planningWindowStart: string | null` and `planningWindowEnd: string | null` instead, and update `UpdatePlanningWindowForm` to accept strings, OR keep the conversion in a thin wrapper inside `CampaignTabs`.

**Simplest resolution:** Convert dates to ISO strings before passing to `CampaignTabs`:
```typescript
// In page.tsx — already have these:
const windowStartStr = campaign.planningWindowStart?.toISOString().split('T')[0] ?? null
const windowEndStr   = campaign.planningWindowEnd?.toISOString().split('T')[0] ?? null

// Pass strings to CampaignTabs; have CampaignTabs reconstruct the object:
// planningWindowCampaign = { id, planningWindowStart: windowStart parsed back or kept as string }
```

The cleanest approach: update `UpdatePlanningWindowForm` to accept `{ id: string; planningWindowStart: string | null; planningWindowEnd: string | null }` and use the string values directly (they're already `YYYY-MM-DD` which is what the date input `defaultValue` needs).

### Anti-Patterns to Avoid

- **Making `CampaignDetailPage` a Client Component:** Would break server-side data fetching (async/await) and is unnecessary. Keep data fetching in the Server Component.
- **Passing Prisma model instances to Client Components:** Date fields are not serialisable and will throw at runtime. Use the string forms already computed in the page.
- **Using Next.js router/URL for tab state:** Adds complexity (searchParams, navigation history), deferred by design decision.
- **Rendering all months and hiding with CSS:** The current "render all, scroll" approach is replaced by navigation state. Don't keep the old render-all code path — it conflicts with the navigation UX.
- **JavaScript `window.matchMedia` listener for 2-up detection:** Tailwind responsive classes (`hidden lg:block`, `lg:grid-cols-2`) achieve the same result without JS and without layout flashes.
- **Resetting `currentMonthIndex` on planning window change:** The window only changes in the Settings tab, and navigating back to Availability will show the first month by default (initial state is 0). No explicit reset needed — tabs do not share state with forms.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab underline indicator | Custom border-bottom with JS measurements | Tailwind `border-b-2 border-[var(--dnd-accent)] -mb-px` | CSS border-bottom on the button with negative margin collapses to the tab bar border — zero JS, works reliably |
| Responsive 2-up calendar | `useWindowSize` hook + JS switching | Tailwind `hidden lg:block` on second month grid | GPU-accelerated, no layout shift, no event listeners |
| Month navigation bounds | Custom min/max logic | `Math.max(0, i - 1)` / `Math.min(months.length - 1, i + 1)` inline in setState | One-liner; no utility function needed |
| Tab routing | Next.js `useRouter` + `searchParams` | `useState<'availability' | 'settings'>` | Explicitly deferred in CONTEXT.md; simple state is sufficient |

**Key insight:** This phase is intentionally scope-controlled. Every problem has an existing solution in the app's current patterns; no new abstractions are needed.

---

## Common Pitfalls

### Pitfall 1: Date Objects Crossing the Server→Client Boundary

**What goes wrong:** Passing `campaign` (Prisma object with `Date` fields) as a prop to a Client Component throws a React serialisation error: "Only plain objects, and a few built-ins, can be passed to Client Components from Server Components. Classes or null prototypes are not supported."

**Why it happens:** `campaign.planningWindowStart` and `campaign.planningWindowEnd` are JavaScript `Date` objects. React cannot serialise these for the RSC payload.

**How to avoid:** The page already serialises the dates to strings (`windowStartStr`, `windowEndStr`). Pass those strings to `CampaignTabs` and thread them to `UpdatePlanningWindowForm`. Update `UpdatePlanningWindowForm` props to accept `string | null` instead of `Date | null`.

**Warning signs:** Runtime error in browser console mentioning "Client Component" and "serialisation"; or TypeScript type error when passing `campaign` directly.

### Pitfall 2: Tab Component Causes Hydration Mismatch

**What goes wrong:** If tab state initialises differently on server and client (e.g. reading from URL or localStorage on client only), React's hydration will mismatch and produce a console error or flicker.

**Why it happens:** Server renders one state; client hydrates with a different initial state.

**How to avoid:** Initialise tab state with a hardcoded default: `useState<Tab>('availability')`. This is identical on server (hypothetical SSR) and client. Since the component has `'use client'`, it is not server-rendered — but keeping the default stable avoids future issues if the component boundary moves.

**Warning signs:** React console warning about "Text content did not match"; visible flash on first load.

### Pitfall 3: currentMonthIndex Stale When Planning Window Changes

**What goes wrong:** DM is on month 3 of 4, navigates to Settings tab, changes the planning window to a shorter range (now only 2 months), comes back to Availability — `currentMonthIndex` is still 2 but `months.length` is now 2, causing `months[2]` to be undefined.

**Why it happens:** `currentMonthIndex` is maintained in `DashboardCalendar` state, which persists across tab switches because React keeps the component mounted when the Availability tab is hidden (if rendered conditionally, state is lost; if kept in DOM and hidden with CSS, state persists — this is a tradeoff).

**How to avoid:** Planning window changes go through the Settings tab → `updatePlanningWindow` server action → `revalidatePath` → full page re-render. The Server Component re-renders and passes new props, which causes React to remount the Client Components with fresh state. `currentMonthIndex` resets to 0 automatically. This is the existing behaviour in the codebase (`setDmExceptionMode` calls `revalidatePath` for the same reason per STATE.md).

**Warning signs:** Calendar showing undefined month after planning window update; blank calendar area.

### Pitfall 4: 2-Up Navigation Parity (What Counts as "at the end")

**What goes wrong:** DM is on a 3-month window, in 2-up mode showing months 2 and 3 — the "Next" button should be disabled. But if the disable condition only checks `currentMonthIndex < months.length - 1`, clicking Next when showing months 1+2 would move to index 2, showing only month 3 (the second slot would be empty on large screens). This is acceptable UX but needs to be intentional.

**How to avoid:** Always navigate by 1 month at a time. The "Next" button disables when `currentMonthIndex >= months.length - 1`. In 2-up mode, the second column simply doesn't render if `months[currentMonthIndex + 1]` is undefined. The DM will naturally understand that month 3 is the last. This is simpler than jump-by-2 navigation.

**Warning signs:** Next button never disabling; or skipping months.

### Pitfall 5: BestDaysList Shows Free Players, Not Unavailable Players (DASH-04)

**What goes wrong:** DASH-04 requires "names of unavailable players." The current `BestDaysList` renders `freePlayerNames` (players whose status is `'free'`). For a day with 4 players where 3 are free, it shows "3/4 players free (Alice, Bob, Carol)" — but not who is unavailable.

**Why it happens:** The component was built before DASH-04 was fully specified.

**How to avoid:** Compute `unavailablePlayerNames` (players with status other than `'free'`) and display them. The fix is small — add `.filter(slot => day.playerStatuses[slot.id] !== 'free').map(slot => slot.name)` and conditionally render it. Alternatively, the current "free player names" satisfies the requirement implicitly — the DM can infer who's unavailable by exclusion. The planner should decide which interpretation is correct; research notes both.

---

## Code Examples

### Tab Bar — Underline Style Matching App Conventions

```typescript
// Source: Project design tokens (globals.css) + ui-designer SKILL.md patterns
// Uses --dnd-accent (#ba7df6) for active indicator, --dnd-text-muted for inactive
// -mb-px trick: button's bottom border overlaps the tab bar's bottom border, hiding it for active tab

<div className="flex gap-0 border-b border-[var(--dnd-border-muted)] mb-6">
  {(['availability', 'settings'] as const).map(tab => (
    <button
      key={tab}
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
        activeTab === tab
          ? 'border-[var(--dnd-accent)] text-white'
          : 'border-transparent text-[var(--dnd-text-muted)] hover:text-gray-200'
      }`}
    >
      {tab === 'availability' ? 'Availability' : 'Settings'}
    </button>
  ))}
</div>
```

### DashboardCalendar — Navigation Header

```typescript
// Source: Derived from existing DashboardCalendar pattern + project conventions
// Nav arrows are positioned in the calendar card header, between month label and prev/next

const showNav = months.length > 1
const displayedMonths = months.slice(currentMonthIndex, currentMonthIndex + 2)  // max 2

return (
  <>
    <div className="rounded-lg bg-[#140326]/60 p-4">
      {showNav && (
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setCurrentMonthIndex(i => Math.max(0, i - 1))}
            disabled={currentMonthIndex === 0}
            className="p-1.5 rounded text-[var(--dnd-text-muted)] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous month"
          >
            &#8592;
          </button>
          <span className="text-xs text-gray-400">
            {currentMonthIndex + 1} / {months.length}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonthIndex(i => Math.min(months.length - 1, i + 1))}
            disabled={currentMonthIndex >= months.length - 1}
            className="p-1.5 rounded text-[var(--dnd-text-muted)] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            aria-label="Next month"
          >
            &#8594;
          </button>
        </div>
      )}

      {/* Responsive grid: 1 col mobile, 2 col large when 2 months available */}
      <div className={displayedMonths.length > 1 ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
        {displayedMonths.map(({ year, month }) => (
          <MonthGrid key={`${year}-${month}`} year={year} month={month} ... />
        ))}
      </div>
    </div>
    {/* Side panel and backdrop unchanged */}
  </>
)
```

### UpdatePlanningWindowForm — Updated Prop Types

```typescript
// Source: Existing UpdatePlanningWindowForm.tsx — updated to accept strings
// Avoids serialisation error when crossing Server→Client boundary

// BEFORE:
type Campaign = { id: string; planningWindowStart: Date | null; planningWindowEnd: Date | null }
export function UpdatePlanningWindowForm({ campaign }: { campaign: Campaign }) {
  const toVal = (d: Date | null) => d ? d.toISOString().slice(0, 10) : ''
  // ...defaultValue={toVal(campaign.planningWindowStart)}
}

// AFTER:
interface UpdatePlanningWindowFormProps {
  campaignId: string
  planningWindowStart: string | null  // 'YYYY-MM-DD' or null
  planningWindowEnd: string | null    // 'YYYY-MM-DD' or null
}
export function UpdatePlanningWindowForm({ campaignId, planningWindowStart, planningWindowEnd }: UpdatePlanningWindowFormProps) {
  const [state, formAction, isPending] = useActionState(updatePlanningWindow.bind(null, campaignId), null)
  // ...defaultValue={planningWindowStart ?? ''}
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All sections on one page (current state) | Two tabs: Availability + Settings | Phase 14 | Settings de-emphasised; Availability is the primary view |
| DashboardCalendar renders all months | DashboardCalendar renders 1-2 months with prev/next | Phase 14 | Cleaner for long planning windows |
| Join Link / Planning Window / Delete at top of page | Moved to Settings tab | Phase 14 | Reduces visual noise in the primary (Availability) view |

**No deprecated patterns introduced.** All existing component internals unchanged.

---

## Open Questions

1. **DASH-04: Free players vs. unavailable players in BestDaysList**
   - What we know: The current `BestDaysList` shows free player names. DASH-04 says "names of unavailable players."
   - What's unclear: Is showing free player names sufficient (DM infers unavailable by exclusion), or must unavailable names be explicit?
   - Recommendation: The planner should implement the explicit version (list unavailable player names) since the requirement says so. The code change is small: `playerSlots.filter(slot => day.playerStatuses[slot.id] !== 'free').map(slot => slot.name)`. If `unavailableNames.length === 0`, no names needed (everyone is free).

2. **Tab accessibility (aria roles)**
   - What we know: The tab bar uses `<button>` elements. ARIA tab pattern uses `role="tablist"`, `role="tab"`, `role="tabpanel"` with `aria-selected` and `aria-controls`.
   - What's unclear: The existing app doesn't use ARIA roles beyond basics. Whether to implement full ARIA tab pattern or keep simple buttons.
   - Recommendation: Add minimal ARIA for correctness (`role="tablist"` on the container, `aria-selected` on buttons) but do not implement full keyboard navigation (arrow key switching) — that's polish beyond the scope of this phase.

3. **Whether DmExceptionCalendar also needs navigation**
   - What we know: CONTEXT.md says DmExceptionCalendar internals are unchanged. It currently renders all months (same pattern as DashboardCalendar before this phase).
   - What's unclear: A long planning window would make DmExceptionCalendar very tall with all months stacked.
   - Recommendation: Per CONTEXT.md decision ("DmExceptionCalendar internals unchanged"), leave it as-is. UX refinement is deferred.

---

## Sources

### Primary (HIGH confidence)

- Direct code reading: `src/app/campaigns/[id]/page.tsx` — full current layout and data flow
- Direct code reading: `src/components/DashboardCalendar.tsx` — existing month-building logic
- Direct code reading: `src/components/BestDaysList.tsx` — current rendering, DASH-03/04 status
- Direct code reading: `src/components/DmExceptionCalendar.tsx` — existing pattern for calendar + month iteration
- Direct code reading: `src/lib/calendarUtils.ts` — `buildMonthGrid`, `formatDateKey`
- Direct code reading: `src/lib/availability.ts` — `DayAggregation` type, `computeBestDays`
- Direct code reading: `src/app/globals.css` — design tokens (`--dnd-accent`, `--dnd-card-bg`, etc.)
- Direct code reading: `.planning/phases/14-dashboard-redesign/CONTEXT.md` — all locked decisions
- Direct code reading: `.planning/STATE.md` — accumulated decisions (serialisation pattern, revalidatePath discipline)
- Direct code reading: `package.json` — confirmed Next.js 16.1.6, React 19.2.3, Tailwind CSS 4.x

### Secondary (MEDIUM confidence)

- Next.js App Router Server/Client boundary pattern — established in Phases 12-13 of this project (ShareModal, DmExceptionCalendar all use same pattern); consistent with Next.js 15/16 docs

### Tertiary (LOW confidence)

- None. All findings verified directly from project source code.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use, no new dependencies
- Architecture: HIGH — all patterns established in prior phases of this project, verified from source
- Pitfalls: HIGH — identified from direct code inspection, not speculation
- DASH-04 interpretation: MEDIUM — requirement wording is ambiguous; two valid implementations

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack; no external library changes relevant)
