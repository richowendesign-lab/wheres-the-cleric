# Phase 4: Dashboard - Research

**Researched:** 2026-02-25
**Domain:** Next.js 16 server components, multi-player availability aggregation, read-only calendar grid with tooltip/panel interactions
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Calendar grid — cell display**
- Coloured dots inside each day cell, one dot per player
- Green dot = player is free that day, red = busy, grey = no response yet
- Days where ALL players are free get a green background on the cell (the primary "highlight" signal)

**Calendar grid — detail interaction**
- Hover over a day → tooltip showing each player's name and their status + time-of-day preference
- Click a day → side panel opens with full per-player breakdown for that day
- Both interactions coexist (hover for quick scan, click for detail)

**Calendar grid — time span**
- Show the full planning window in a single scrollable grid — no month-by-month pagination
- Planning windows are expected to be short (2–6 weeks), so one view is sufficient

**Best-days ranking — scoring**
- Score = count of available players for that day (simple count, no weighting)
- No time-of-day alignment bonuses — keep scoring transparent and predictable

**Best-days ranking — display**
- Separate section below the calendar grid (not a sidebar, not integrated into cells)
- Show top 5 days only
- Each entry: rank number, date, player count (e.g. 4/4), and names of free players
  - Example: "#1 — Sat 8 Mar — 4/4 players free (Alice, Bob, Sam, Kate)"

### Claude's Discretion
- Page layout for the two unselected areas (missing players section placement, overall page structure)
- Exact side panel design and animation
- Typography, spacing, and colour tokens (should match existing app theme)
- How ties in the ranking are handled (e.g. same count → sort by date)
- Empty states (no availability submitted yet, no days in window, etc.)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | DM can view a calendar grid showing each player's availability status per day | Availability aggregation logic + read-only DashboardCalendar component pattern |
| DASH-02 | DM can see days where all players are available visually highlighted | Green cell background when score === totalPlayers; computed in aggregation pass |
| DASH-03 | DM can see which players have not yet submitted their availability | Players with zero AvailabilityEntries are "missing"; simple filter on loaded data |
| DASH-04 | DM can see a ranked list of best session days based on group availability score | Sort aggregated day scores descending, take top 5, tie-break by date ascending |
</phase_requirements>

---

## Summary

Phase 4 delivers the DM's read-only aggregate view of group availability. All data is already in the database from Phase 3. The core work is: (1) a pure TypeScript function that resolves each player's effective status for every day in the planning window (override beats weekly pattern, same logic as AvailabilityCalendar already uses for the player side), (2) a `DashboardCalendar` client component that renders the multi-dot grid with hover tooltip and click-to-panel interactions, and (3) a `BestDaysList` display component for the ranked top-5.

The dashboard page lives at `/campaigns/[id]/page.tsx`, which is already a Next.js server component. It fetches the campaign with all player slots and their availability entries in one Prisma query, then passes pre-computed aggregated data down to client components. No new API routes or server actions are needed — the dashboard is read-only. The only interactivity is client-side UI state: which day's side panel is open.

The key design challenge is the hover tooltip + click panel dual interaction. The project has no tooltip library installed. The correct approach for this codebase is a CSS-only hover tooltip (using Tailwind `group-hover` utilities) for the quick scan, and a controlled `useState` side panel for the click-to-detail view. This avoids adding a dependency for a problem that is straightforward to implement within Tailwind CSS 4.

**Primary recommendation:** Build a pure `computeDayStatuses(slots, window)` utility function first, then wire `DashboardCalendar` and `BestDaysList` as thin presentational components on top of it. The campaign detail page server component fetches all data, computes aggregates server-side, and passes plain objects to client components.

---

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, server components, page routing | Already the app framework |
| React | 19.2.3 | Client components for interactive UI (tooltip, panel) | Already installed |
| Tailwind CSS | ^4 | Styling — group-hover, transitions, colour tokens | Already the styling layer |
| Prisma 7 | ^7.4.1 | Data access for campaign + availability entries | Already the ORM |

### Supporting (no installation needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `use-debounce` | ^10.1.0 | Already installed, not needed for dashboard | Skip — no debouncing required for read-only views |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS group-hover tooltip | Radix UI Tooltip / Floating UI | Adds a dependency; overkill for a fixed-position hover label over day cells |
| Server-side aggregation | Client-side fetch + compute | Server-side keeps the client component simple and avoids waterfall requests |
| Separate `/dashboard` route | Extending `/campaigns/[id]/page.tsx` | The campaign detail page is the natural DM home — no new route needed |

**Installation:** No new packages required. All needed libraries are already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── campaigns/[id]/
│       └── page.tsx           # Extend: add dashboard sections below existing invite/planning-window
├── components/
│   ├── DashboardCalendar.tsx  # New: read-only multi-dot grid + hover tooltip + click panel
│   └── BestDaysList.tsx       # New: ranked top-5 days display
└── lib/
    └── availability.ts        # New: computeDayStatuses() pure utility function
```

### Pattern 1: Server-side Aggregation, Client-side Interaction

**What:** The server component fetches all data and computes the full day-status map before rendering. Client components receive plain serializable objects — no data fetching in client components.

**When to use:** Read-only views where interactivity is display-only (opening a panel, showing a tooltip). Avoids client-side data fetching and keeps client bundles small.

**Example:**

```typescript
// src/app/campaigns/[id]/page.tsx (Server Component)
const campaign = await prisma.campaign.findUnique({
  where: { id },
  include: {
    playerSlots: {
      include: { availabilityEntries: true },
      orderBy: { createdAt: 'asc' },
    },
  },
})

// Compute aggregates server-side
const dayStatuses = computeDayStatuses(
  campaign.playerSlots,
  campaign.planningWindowStart,
  campaign.planningWindowEnd
)

// Pass plain data to client component
return <DashboardCalendar dayStatuses={dayStatuses} players={campaign.playerSlots} />
```

### Pattern 2: Availability Resolution — Override Beats Weekly

**What:** The effective status for a player on a specific date follows: override entry (if exists) > weekly pattern > "no response". This is the same logic already implemented in `AvailabilityCalendar.tsx` — extract it into a shared utility.

**When to use:** Anywhere the dashboard needs to know if a player is free/busy/no-response on a specific date.

**Example:**

```typescript
// src/lib/availability.ts
export type PlayerDayStatus = 'free' | 'busy' | 'no-response'

export interface DayAggregation {
  date: string              // "YYYY-MM-DD"
  playerStatuses: Record<string, PlayerDayStatus>  // playerSlotId → status
  freeCount: number
  totalPlayers: number
  allFree: boolean
}

export function resolvePlayerStatusOnDate(
  entries: AvailabilityEntry[],
  dateKey: string,       // "YYYY-MM-DD"
  dayOfWeek: number      // 0–6
): PlayerDayStatus {
  // 1. Check for override entry matching this date
  const override = entries.find(
    e => e.type === 'override' && e.date !== null &&
    formatDateKey(new Date(e.date)) === dateKey
  )
  if (override) return override.status as PlayerDayStatus

  // 2. Fall back to weekly pattern
  const weeklyEntry = entries.find(
    e => e.type === 'weekly' && e.dayOfWeek === dayOfWeek && e.status === 'free'
  )
  return weeklyEntry ? 'free' : 'no-response'
}

export function computeDayStatuses(
  playerSlots: PlayerSlotWithEntries[],
  windowStart: Date | null,
  windowEnd: Date | null
): DayAggregation[] {
  if (!windowStart || !windowEnd) return []

  const days: DayAggregation[] = []
  const cursor = new Date(Date.UTC(
    windowStart.getUTCFullYear(), windowStart.getUTCMonth(), windowStart.getUTCDate()
  ))
  const end = new Date(Date.UTC(
    windowEnd.getUTCFullYear(), windowEnd.getUTCMonth(), windowEnd.getUTCDate()
  ))

  while (cursor <= end) {
    const dateKey = formatDateKey(cursor)
    const dow = cursor.getUTCDay()
    const playerStatuses: Record<string, PlayerDayStatus> = {}
    let freeCount = 0

    for (const slot of playerSlots) {
      // A player has "no response" if they have ZERO entries at all
      if (slot.availabilityEntries.length === 0) {
        playerStatuses[slot.id] = 'no-response'
      } else {
        const status = resolvePlayerStatusOnDate(slot.availabilityEntries, dateKey, dow)
        playerStatuses[slot.id] = status
        if (status === 'free') freeCount++
      }
    }

    days.push({
      date: dateKey,
      playerStatuses,
      freeCount,
      totalPlayers: playerSlots.length,
      allFree: freeCount === playerSlots.length && playerSlots.length > 0,
    })

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return days
}
```

### Pattern 3: "No Response" Detection (DASH-03)

**What:** A player has "not yet submitted any availability" when their `availabilityEntries` array is empty (zero rows). This differs from "marked busy on this day" — it means they've never touched the form.

**When to use:** The missing-players list at the top of the dashboard.

**Example:**

```typescript
// Derived from loaded data — no extra DB query needed
const missingPlayers = playerSlots.filter(
  slot => slot.availabilityEntries.length === 0
)
```

### Pattern 4: Hover Tooltip (CSS-only, group-hover)

**What:** The day cell is a `group` container. The tooltip is an absolutely-positioned child that appears on `group-hover:opacity-100`. No JS event handling for show/hide — pure CSS transition.

**When to use:** Quick-scan hover information that doesn't require interaction within the tooltip itself (read-only player list).

**Example:**

```tsx
// DashboardCalendar.tsx — day cell with hover tooltip
<div className="relative group">
  {/* Day cell */}
  <button
    onClick={() => setSelectedDate(dateKey)}
    className={`w-full rounded-md py-1.5 text-sm text-center transition-colors
      ${agg.allFree ? 'bg-green-800/60 hover:bg-green-700/60' : 'hover:bg-gray-800'}`}
  >
    <span>{date.getUTCDate()}</span>
    {/* Player dots */}
    <div className="flex justify-center gap-0.5 mt-0.5">
      {playerSlots.map(slot => (
        <span
          key={slot.id}
          className={`w-1.5 h-1.5 rounded-full inline-block
            ${agg.playerStatuses[slot.id] === 'free' ? 'bg-green-400' :
              agg.playerStatuses[slot.id] === 'busy' ? 'bg-red-400' : 'bg-gray-600'}`}
        />
      ))}
    </div>
  </button>

  {/* Hover tooltip — positioned above the cell */}
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10
    opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
    bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200
    whitespace-nowrap shadow-xl">
    {playerSlots.map(slot => (
      <div key={slot.id} className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full
          ${agg.playerStatuses[slot.id] === 'free' ? 'bg-green-400' :
            agg.playerStatuses[slot.id] === 'busy' ? 'bg-red-400' : 'bg-gray-500'}`}
        />
        <span>{slot.name}</span>
        {/* time-of-day preference if available */}
      </div>
    ))}
  </div>
</div>
```

### Pattern 5: Click-to-Panel Side Panel

**What:** A controlled side panel rendered at the page level. `useState<string | null>(null)` holds the selected date key. The panel slides in from the right (CSS transition on `translate-x`). Clicking outside or pressing Escape closes it.

**When to use:** Detail view for a selected day — shows full per-player breakdown.

**Example:**

```tsx
// DashboardCalendar.tsx
const [selectedDate, setSelectedDate] = useState<string | null>(null)
const selectedAgg = selectedDate ? dayAggMap.get(selectedDate) : null

// Panel
<div className={`fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-800
  shadow-2xl z-20 flex flex-col transition-transform duration-200
  ${selectedDate ? 'translate-x-0' : 'translate-x-full'}`}>
  {selectedAgg && (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="font-semibold text-gray-100">{formatDate(selectedDate)}</h3>
        <button onClick={() => setSelectedDate(null)} aria-label="Close">✕</button>
      </div>
      <div className="p-4 space-y-3">
        {playerSlots.map(slot => (
          <div key={slot.id} className="flex items-center gap-3">
            {/* status dot + name + time-of-day */}
          </div>
        ))}
      </div>
    </>
  )}
</div>
```

### Pattern 6: Best Days Ranking

**What:** Sort `DayAggregation[]` by `freeCount` descending, ties broken by date ascending, take first 5.

**Example:**

```typescript
// Pure computation — no library needed
function computeBestDays(days: DayAggregation[]): DayAggregation[] {
  return [...days]
    .filter(d => d.freeCount > 0)
    .sort((a, b) => {
      if (b.freeCount !== a.freeCount) return b.freeCount - a.freeCount
      return a.date.localeCompare(b.date) // ISO strings sort correctly
    })
    .slice(0, 5)
}
```

### Anti-Patterns to Avoid

- **Fetching data in client components:** The dashboard data is static per page load — fetch once in the server component, compute aggregates there, pass serialized plain objects to clients. Do NOT use `useEffect` + fetch in `DashboardCalendar`.
- **Re-using `AvailabilityCalendar` for the dashboard grid:** That component is built for single-player interactive editing. The dashboard needs a different visual (multi-dot cells, hover tooltip, click panel, green background). Build a separate `DashboardCalendar` component.
- **Storing tooltip state in React:** Hover tooltips are CSS transitions — do not use `useState` + `onMouseEnter/Leave` for show/hide (creates re-renders on every hover). Use `group-hover` instead.
- **Separate DB query for missing players:** Missing players are those with `availabilityEntries.length === 0` — detectable from the same query that loads everything else. No additional query needed.
- **Computing aggregates client-side:** The full planning window for 5 players over 6 weeks is tiny data. Computing server-side eliminates loading states and simplifies client components.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date arithmetic across months | Custom day-iteration loop from scratch | Copy `buildMonthGrid` + date key pattern from `AvailabilityCalendar.tsx` | Already verified correct UTC-safe implementation in the codebase |
| Tooltip positioning | JS-based positioning with `getBoundingClientRect` | Tailwind `group-hover` + `absolute bottom-full` | No dependency, no JS overhead, works fine for fixed grid cells |
| Ranking/sorting | Custom priority queue | Plain `Array.sort` with two-key comparator | Top-5 from ≤42 days is trivially fast |

**Key insight:** The hard problems (date normalization, UTC-safe parsing, override resolution) are already solved in `AvailabilityCalendar.tsx` and `availability.ts`. Extract and reuse that logic rather than reimplementing.

---

## Common Pitfalls

### Pitfall 1: Timezone Shift in Date Comparisons

**What goes wrong:** Dates stored as `DateTime` in Prisma/SQLite come back as JavaScript `Date` objects. If you call `.toISOString().split('T')[0]`, you get the UTC date. If you call `.toLocaleDateString()`, you get the local timezone date. Mismatch causes availability to appear on wrong days.

**Why it happens:** The codebase uses `Date.UTC()` throughout to pin everything to UTC. Mixing local and UTC methods breaks the comparison.

**How to avoid:** Always use `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, `getUTCDay()` when constructing date keys. Reuse the `formatDateKey` pattern from `AvailabilityCalendar.tsx`.

**Warning signs:** A player's availability appears one day off from what they set.

### Pitfall 2: Weekly-Only Players Mistakenly Flagged as "No Response"

**What goes wrong:** A player who only set a weekly pattern (no overrides) has `availabilityEntries` with rows, but those rows have `type === 'weekly'` and no date. If the missing-player detection only checks for override entries, these players appear as "not responded."

**Why it happens:** "No response" means zero `AvailabilityEntries` total — not zero overrides. The check is `slot.availabilityEntries.length === 0`, NOT `slot.availabilityEntries.filter(e => e.type === 'override').length === 0`.

**How to avoid:** Check total entries length, not by type.

**Warning signs:** Players who set weekly availability appear in the missing-players list.

### Pitfall 3: The `@@unique([playerSlotId, date])` Constraint Means At Most One Override Per Player Per Date

**What goes wrong:** Dashboard code assumes there might be multiple override entries per date per player when iterating — introduces unnecessary complexity.

**Why it happens:** Not reading the schema carefully.

**How to avoid:** The schema has `@@unique([playerSlotId, date])`. There is at most 1 override entry per (player, date). Use `.find()` not `.filter()` when looking for an override.

**Warning signs:** More complex code than necessary; or code that handles a case that cannot occur.

### Pitfall 4: Tooltip Clipped by Overflow-Hidden Parent

**What goes wrong:** The calendar grid uses `grid` or `overflow-hidden` containers. The absolute-positioned tooltip gets clipped at the boundary.

**Why it happens:** CSS `overflow: hidden` on a parent clips absolutely-positioned children.

**How to avoid:** Ensure the tooltip's closest `relative`-positioned ancestor is NOT `overflow-hidden`. The `.relative.group` wrapper on each cell should be outside any clipping container. Alternatively, use `z-index` and ensure the grid container does not set `overflow: hidden`.

**Warning signs:** Tooltip is visually cut off at grid edges.

### Pitfall 5: Panel Overlaps Campaign Content Without Backdrop

**What goes wrong:** The side panel slides over campaign content. On narrow viewports, the user can't interact with the calendar behind it because there's no backdrop or close affordance.

**Why it happens:** Fixed panels need an explicit close mechanism. Keyboard users need `Escape` to close.

**How to avoid:** Add a semi-transparent backdrop `div` behind the panel that closes it on click. Add `useEffect` to listen for `Escape` key.

**Warning signs:** Panel can only be closed by the X button; clicking outside does nothing.

### Pitfall 6: Server Component Passing Non-Serializable Props

**What goes wrong:** Prisma returns `Date` objects. Passing `Date` objects from a server component to a client component throws a Next.js error ("Only plain objects can be passed to Client Components from Server Components").

**Why it happens:** React Server Components serialize props — `Date` is not serializable.

**How to avoid:** Convert all `Date` values to ISO strings before passing to client components. The existing codebase already does this (see `invite/[token]/page.tsx` lines 91-96). Continue the same pattern.

**Warning signs:** Next.js build error about non-serializable props.

---

## Code Examples

Verified patterns from existing codebase:

### Prisma Query — Fetch Campaign With All Availability Data

```typescript
// Pattern from src/app/campaigns/[id]/page.tsx — extend with availabilityEntries
const campaign = await prisma.campaign.findUnique({
  where: { id },
  include: {
    playerSlots: {
      include: {
        availabilityEntries: true,  // Add this for dashboard
      },
      orderBy: { createdAt: 'asc' },
    },
  },
})
```

### UTC-Safe Date Key Format (from AvailabilityCalendar.tsx)

```typescript
function formatDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}
```

### Day Iteration Over Planning Window (from AvailabilityCalendar.tsx)

```typescript
// Iterate every date in window — UTC-safe
const cursor = new Date(Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth(), windowStart.getUTCDate()))
const end = new Date(Date.UTC(windowEnd.getUTCFullYear(), windowEnd.getUTCMonth(), windowEnd.getUTCDate()))
while (cursor <= end) {
  const dateKey = formatDateKey(cursor)
  const dow = cursor.getUTCDay()
  // ... process day
  cursor.setUTCDate(cursor.getUTCDate() + 1)
}
```

### Theme Tokens (existing app conventions)

```tsx
// Background colours
bg-gray-950    // page background
bg-gray-900    // section background / header
bg-gray-800    // card / chip background

// Text colours
text-gray-100  // primary text
text-gray-400  // secondary / muted text
text-gray-500  // dim text (day headers)

// Accent colours
text-amber-400       // headings
bg-amber-500         // primary action button
text-amber-500       // small labels (uppercase tracking)
bg-amber-900/40      // available day background (from AvailabilityCalendar)
font-fantasy         // headings (Cinzel via --font-fantasy CSS var)

// Status colours for dots (new for dashboard)
bg-green-400   // free dot
bg-red-400     // busy dot
bg-gray-600    // no-response dot
bg-green-800/60  // all-free cell background
```

### Server Component Data Flow (existing pattern from invite/[token]/page.tsx)

```typescript
// Convert Prisma Date → string before passing to client components
initialEntries={slot.availabilityEntries.map(e => ({
  id: e.id,
  type: e.type,
  dayOfWeek: e.dayOfWeek,
  date: e.date?.toISOString() ?? null,  // Date → string
  timeOfDay: e.timeOfDay,
  status: e.status,
}))}
```

### Displaying Day Label in Best Days List

```typescript
// Format "YYYY-MM-DD" → "Sat 8 Mar" for display
function formatBestDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })
  // → "Sat, 8 Mar" (adjust as needed)
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Client-side data fetch in useEffect | Server component data fetching (Next.js 13+) | No loading spinner; data available on first paint |
| Tooltip libraries (Popper.js, Tippy) | CSS group-hover with Tailwind | Zero JS for hover behavior; simpler; no dependency |
| Page refresh to see updated data | ISR or streaming | For this read-only view, simple server fetch on navigation is sufficient |

**Deprecated/outdated in this project's stack:**
- `getServerSideProps` / `getStaticProps`: App Router uses async server components instead (already used throughout this project)
- `pages/` directory patterns: This project uses `app/` directory throughout

---

## Open Questions

1. **Time-of-day preference display in tooltip and side panel**
   - What we know: Players can set `timeOfDay` per day (via `AvailabilityEntry.timeOfDay` — "morning" | "afternoon" | "evening"). The CONTEXT.md tooltip description says "name and their status + time-of-day preference."
   - What's unclear: How is `timeOfDay` stored? Looking at the schema — `timeOfDay` is on `AvailabilityEntry`, but Phase 3 CONTEXT and actions show that `saveWeeklyPattern` does NOT save timeOfDay (entries only have `dayOfWeek` and `status: 'free'`). The `toggleDateOverride` also does not save timeOfDay. It appears timeOfDay was not fully implemented in Phase 3.
   - Recommendation: Check the Phase 3 plans and `WeeklySchedule.tsx` component. If `timeOfDay` is not currently saved, the tooltip should display status only (free/busy/no-response), not time-of-day preference. Plan for this case explicitly — either show "—" for time-of-day or omit it. Do NOT assume the field is populated.

2. **Whether the dashboard replaces or extends `/campaigns/[id]/page.tsx`**
   - What we know: The campaign detail page at `/campaigns/[id]/page.tsx` already shows invite links and the planning window form. This is the DM's natural home for a campaign.
   - What's unclear: Should the dashboard sections be added below the existing content on this page, or should there be a separate `/campaigns/[id]/dashboard` route?
   - Recommendation: Add dashboard sections directly to `/campaigns/[id]/page.tsx` below the existing sections. The planning window is short (2–6 weeks), so all content fits on one scrollable page. This avoids a new route and keeps the DM experience cohesive.

---

## Sources

### Primary (HIGH confidence)

- Codebase: `/Users/richardowen/Desktop/my-portfolio/src/app/campaigns/[id]/page.tsx` — existing server component pattern
- Codebase: `/Users/richardowen/Desktop/my-portfolio/src/components/AvailabilityCalendar.tsx` — UTC-safe date logic, verified working
- Codebase: `/Users/richardowen/Desktop/my-portfolio/src/lib/actions/availability.ts` — override/weekly data model
- Codebase: `/Users/richardowen/Desktop/my-portfolio/prisma/schema.prisma` — definitive data model
- Codebase: `/Users/richardowen/Desktop/my-portfolio/package.json` — confirmed installed dependencies and versions
- Codebase: `/Users/richardowen/Desktop/my-portfolio/src/app/globals.css` — confirmed theme tokens

### Secondary (MEDIUM confidence)

- Tailwind CSS 4 `group-hover` pattern: Standard utility, no changes from v3 for group-hover behavior; confirmed by presence in existing codebase
- Next.js 16 server component serialization constraint: Documented behavior; confirmed by existing pattern in `invite/[token]/page.tsx`

### Tertiary (LOW confidence)

- Time-of-day field population: Assumed NOT fully implemented based on Phase 3 action code inspection — should verify with WeeklySchedule.tsx before implementing tooltip

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are existing, confirmed from package.json
- Architecture: HIGH — server component pattern already established in codebase; extending existing page
- Availability aggregation logic: HIGH — override-beats-weekly rule confirmed from AvailabilityCalendar.tsx
- Tooltip pattern (group-hover): HIGH — standard Tailwind CSS 4 pattern
- Side panel implementation: MEDIUM — specific design is Claude's discretion; pattern is standard React useState
- Time-of-day display: LOW — timeOfDay field existence confirmed in schema, but population status unknown (Phase 3 actions don't appear to save it)

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable stack — all locked-in versions)
