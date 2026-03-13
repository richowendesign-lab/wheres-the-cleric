# Phase 17: Calendar & Panel Clarity - Research

**Researched:** 2026-03-12
**Domain:** React/Next.js Client Component UI — conditional rendering, calendar legend, date side-panel state
**Confidence:** HIGH — based on direct codebase inspection of CampaignTabs.tsx, DashboardCalendar.tsx, and availability.ts

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLAR-01 | Group Availability calendar legend includes a DM unavailable colour swatch — only shown when the DM has marked at least one date | `dmExceptionDates` prop already on `CampaignTabs`; legend block at lines 256–263 is the exact insertion point; gate with `dmExceptionDates.length > 0` |
| CLAR-02 | Clicking a DM-marked date in the Group Availability calendar shows a DM unavailable indicator in the date panel alongside normal player availability | `agg.dmBlocked` already in `aggMap` in `CampaignTabs`; side panel body (lines 133–149) is the insertion point; no new data threading |
| CLAR-03 | Date panel shows a clear single message when no players are available, instead of listing each player as "no response" | `agg.freeCount` and `playerSlots` are both available in panel scope; insert conditional message before the `.map()` loop |
</phase_requirements>

---

## Summary

All three requirements for this phase are purely cosmetic additions to `CampaignTabs.tsx`. No data schema changes, no new props, no Server Actions, and no new components are required. Every piece of data needed (`agg.dmBlocked`, `agg.freeCount`, `dmExceptionDates`) is already computed, already passed as props, and already in scope at the exact JSX locations where the changes land.

The phase has two insertion points inside `CampaignTabs.tsx`:

1. **Legend block** (lines 256–263) — add a third legend entry, conditionally rendered when `dmExceptionDates.length > 0`.
2. **Side-panel body** (lines 133–149) — add a DM unavailable indicator above the player list, and a no-players-available message when `freeCount === 0 && totalPlayers > 0`.

The only non-trivial decision is colour consistency: the calendar cells use `ring-1 ring-amber-400/60` (60% opacity amber ring) and the legend swatch must match. Using a bordered square swatch rather than a filled dot differentiates DM status from player-status dots visually, and matches the ring language in the calendar.

**Primary recommendation:** Make all three changes in a single edit to `CampaignTabs.tsx`. There are no file dependencies between the three changes; they can be written sequentially in one pass.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 (in use) | Conditional JSX rendering, `&&` operator pattern | Project baseline — no new dependency |
| Tailwind CSS | 4 (in use) | Colour and spacing utilities including opacity modifiers (`/60`) | Project baseline |
| TypeScript | 5 (in use) | Type narrowing for `agg?.dmBlocked`, nullish coalescing | Project baseline |

No new dependencies. This phase requires zero `npm install` commands.

---

## Architecture Patterns

### Relevant Project Structure

```
src/
├── components/
│   ├── CampaignTabs.tsx        # THE target file — all three changes land here
│   └── DashboardCalendar.tsx   # Read-only context — dmBlocked visual defined here
└── lib/
    └── availability.ts         # DayAggregation type — freeCount, dmBlocked, totalPlayers
```

### Pattern 1: Conditional Legend Entry

**What:** Add a third `<span>` to the existing legend row, gated on `dmExceptionDates.length > 0`.

**When to use:** Any legend entry that represents a state the DM may never have triggered.

**Exact insertion point:** Lines 256–263 in `CampaignTabs.tsx`, inside the `<div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">` block, after the existing two entries.

```tsx
// Source: direct codebase inspection — CampaignTabs.tsx lines 256–263
{dmExceptionDates.length > 0 && (
  <span className="flex items-center gap-1.5">
    <span className="inline-block w-2.5 h-2.5 rounded border border-amber-400/60" />DM unavailable
  </span>
)}
```

Note: use `rounded border border-amber-400/60` (a bordered square), not `rounded-full bg-amber-400/60` (a dot). This visually differentiates DM state from the player-status dots and matches the ring treatment on calendar cells.

### Pattern 2: DM Unavailable Indicator in Side Panel

**What:** Conditional block above the player `.map()` loop, rendered when `agg?.dmBlocked` is true.

**When to use:** Before the player list in the panel, as DM status has scheduling priority over any single player.

**Exact insertion point:** Line 133 — the opening of `<div className="p-4 space-y-3 overflow-y-auto flex-1">`, before `{playerSlots.map(...)}`.

```tsx
// Source: direct codebase inspection — CampaignTabs.tsx lines 133–149
{agg?.dmBlocked && (
  <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
    <span className="w-3 h-3 rounded shrink-0 border border-amber-400/60" />
    <span className="text-amber-300/80 text-sm font-medium">DM unavailable</span>
  </div>
)}
```

### Pattern 3: Empty State Message in Side Panel

**What:** A single sentence above the player list when `freeCount === 0 && totalPlayers > 0`.

**When to use:** When data is present but no player is free — not when no players exist at all (guard `totalPlayers > 0` to avoid showing message on a campaign with zero players).

**Exact insertion point:** Immediately after the DM indicator block (Pattern 2), before `{playerSlots.map(...)}`.

```tsx
// Source: direct codebase inspection — CampaignTabs.tsx + availability.ts DayAggregation type
{agg && agg.freeCount === 0 && agg.totalPlayers > 0 && (
  <p className="text-sm text-gray-500 italic">No players available this day.</p>
)}
```

This uses `agg.totalPlayers` (already on `DayAggregation`) as the guard so the message only appears when players exist but none are free — not on dates before any players have joined.

### Anti-Patterns to Avoid

- **Unconditional DM legend entry:** Always showing the amber swatch even when `dmExceptionDates` is empty confuses DMs who have never set any unavailable dates.
- **Inserting DM indicator inside DashboardCalendar:** The side panel lives in `CampaignTabs`, not in `DashboardCalendar`. Modifications to the panel belong exclusively in `CampaignTabs`.
- **Using `playerSlots.every(...)` instead of `agg.freeCount`:** The aggregation already has `freeCount`. There is no need to re-derive it from the player slots array.
- **Full opacity amber swatch with an opacity amber ring:** Mismatched opacity between legend and calendar cell creates user confusion. Use `border-amber-400/60` in both the legend swatch and panel indicator to mirror the calendar's `ring-amber-400/60`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Empty state detection | Custom "all no-response" loop over playerSlots | `agg.freeCount === 0 && agg.totalPlayers > 0` | `DayAggregation` already computes the aggregate; re-deriving from the raw slot array duplicates logic |
| DM blocked detection | Query dmExceptionDates to check if selectedDate is in the array | `agg?.dmBlocked` | Already computed in `computeDayAggregations` and present on every `DayAggregation` in `aggMap` |
| Conditional rendering library | Any utility/helper | React `&&` operator | Standard React JSX conditional pattern — no abstraction needed |

**Key insight:** All three requirements are satisfied purely by reading already-available data — the value of this phase is in surfacing that data in the UI, not in computing anything new.

---

## Common Pitfalls

### Pitfall 1: Legend Swatch Colour Mismatch

**What goes wrong:** The legend swatch uses `bg-amber-400` (full-opacity fill) but the calendar ring is `ring-amber-400/60` (60% opacity ring). They render as visually different colours.

**Why it happens:** Tailwind opacity modifiers (`/60`) affect the rendered colour, not just CSS `opacity`. A full-opacity swatch looks much brighter than a 60%-opacity ring.

**How to avoid:** Use `border border-amber-400/60` on a transparent square for the legend swatch. This is the same amber at the same opacity, presented as a bordered square that matches the ring visual language. Confirmed from `DashboardCalendar.tsx` line 143: `ring-1 ring-amber-400/60`.

**Warning signs:** Swatch and calendar cell look like different colours when viewed side by side.

### Pitfall 2: DM Indicator Silently Absent

**What goes wrong:** Implementation adds the legend swatch but forgets to add the indicator inside the side panel. No error is thrown — the panel simply shows no DM context when a blocked date is selected.

**Why it happens:** The legend and the panel are in different parts of `CampaignTabs.tsx` (legend ~line 256, panel ~line 133). Changes in one location are easy to miss when reviewing the other.

**How to avoid:** Treat CLAR-01, CLAR-02, and CLAR-03 as a single unit. Edit all three insertion points in one pass. Verify manually: mark a date as DM-blocked, switch to Availability tab, click that date, confirm the panel shows the amber indicator.

**Warning signs:** Legend shows amber swatch but clicking a blocked date reveals no amber in the panel.

### Pitfall 3: Empty State Shows on Dates Before Any Players Join

**What goes wrong:** If `totalPlayers === 0` and `freeCount === 0`, the condition `freeCount === 0` is true — but there are no players to be available, so "No players available this day" is misleading.

**Why it happens:** The simple check `agg.freeCount === 0` does not distinguish "no players exist" from "players exist but none are free."

**How to avoid:** Guard with `agg.totalPlayers > 0`. The `DayAggregation` type has `totalPlayers: number` — use it. Full condition: `agg && agg.freeCount === 0 && agg.totalPlayers > 0`.

**Warning signs:** Empty-state message appears on campaigns with zero player slots.

### Pitfall 4: z-index Conflict with Side Panel

**What goes wrong:** Not applicable for Phase 17 — this phase adds no new overlays or modals. The changes are inline elements inside the existing side panel and legend row.

**Why documented:** The z-index landscape in `CampaignTabs` (`z-10` backdrop, `z-20` panel, `z-50` snackbar) is documented in PITFALLS.md as a risk for later phases (18/19 with HowItWorksModal). Phase 17 changes are purely within the existing `z-20` panel — no new z-index management needed.

---

## Code Examples

All examples verified against the live source file.

### Current Legend Block (lines 256–263, verbatim)

```tsx
// CampaignTabs.tsx lines 256–263 — current state
<div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
  <span className="flex items-center gap-1.5">
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" />Free
  </span>
  <span className="flex items-center gap-1.5">
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-600" />No response
  </span>
</div>
```

### After CLAR-01: Legend with Conditional DM Entry

```tsx
// CampaignTabs.tsx — after CLAR-01 change
<div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
  <span className="flex items-center gap-1.5">
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" />Free
  </span>
  <span className="flex items-center gap-1.5">
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-600" />No response
  </span>
  {dmExceptionDates.length > 0 && (
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded border border-amber-400/60" />DM unavailable
    </span>
  )}
</div>
```

### Current Side Panel Body (lines 133–149, verbatim)

```tsx
// CampaignTabs.tsx lines 133–149 — current state
<div className="p-4 space-y-3 overflow-y-auto flex-1">
  {playerSlots.map(slot => {
    const status = agg?.playerStatuses[slot.id] ?? 'no-response'
    return (
      <div key={slot.id} className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full shrink-0
          ${status === 'free' ? 'bg-green-400' : 'bg-gray-500'}`}
        />
        <span className="text-gray-100 font-medium">{slot.name}</span>
        <span className={`text-sm ml-auto
          ${status === 'free' ? 'text-green-400' : 'text-gray-500'}`}>
          {status === 'free' ? 'Free' : 'No response'}
        </span>
      </div>
    )
  })}
</div>
```

### After CLAR-02 + CLAR-03: Panel with DM Indicator and Empty State

```tsx
// CampaignTabs.tsx — after CLAR-02 and CLAR-03 changes
<div className="p-4 space-y-3 overflow-y-auto flex-1">
  {/* CLAR-02: DM unavailable indicator */}
  {agg?.dmBlocked && (
    <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
      <span className="w-3 h-3 rounded shrink-0 border border-amber-400/60" />
      <span className="text-amber-300/80 text-sm font-medium">DM unavailable</span>
    </div>
  )}
  {/* CLAR-03: Empty state when no players are free */}
  {agg && agg.freeCount === 0 && agg.totalPlayers > 0 && (
    <p className="text-sm text-gray-500 italic">No players available this day.</p>
  )}
  {playerSlots.map(slot => {
    const status = agg?.playerStatuses[slot.id] ?? 'no-response'
    return (
      <div key={slot.id} className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full shrink-0
          ${status === 'free' ? 'bg-green-400' : 'bg-gray-500'}`}
        />
        <span className="text-gray-100 font-medium">{slot.name}</span>
        <span className={`text-sm ml-auto
          ${status === 'free' ? 'text-green-400' : 'text-gray-500'}`}>
          {status === 'free' ? 'Free' : 'No response'}
        </span>
      </div>
    )
  })}
</div>
```

### DayAggregation Type (for reference)

```typescript
// Source: src/lib/availability.ts
export interface DayAggregation {
  date: string              // 'YYYY-MM-DD'
  playerStatuses: Record<string, PlayerDayStatus>  // playerSlotId -> status
  freeCount: number
  totalPlayers: number
  allFree: boolean
  dmBlocked: boolean        // already computed, already in aggMap
}
```

### DashboardCalendar dmBlocked Usage (read-only context)

```tsx
// Source: DashboardCalendar.tsx line 143 — confirmed via grep
${agg?.dmBlocked ? 'ring-1 ring-amber-400/60' : ''}
// This is the visual this phase must match in the legend and panel
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Panel shows only player rows regardless of DM status | Panel shows DM indicator before player rows when `dmBlocked` is true | Phase 17 | DM can see their own unavailability reflected in the date panel, matching the calendar's amber ring |
| Legend shows only "Free" and "No response" | Legend shows "DM unavailable" swatch when `dmExceptionDates.length > 0` | Phase 17 | Amber ring on calendar cells gets a legend entry — no more mystery colour |
| All-"No response" panel reads like a normal populated list | All-"No response" panel shows a single empty-state sentence | Phase 17 | DM instantly sees "no one is available" without reading every row |

---

## Open Questions

1. **Should the empty-state message suppress the player list entirely, or appear alongside it?**
   - What we know: CLAR-03 says "clear single message instead of listing each player as 'no response'" — "instead of" implies replacing the list
   - What's unclear: Does the DM still want to see who specifically hasn't responded even when everyone is in "no response" state?
   - Recommendation: Show the message AND keep the player list. "Instead of" in the requirement most likely means instead of the list being the ONLY signal, not that the list should vanish. The DM still needs to know which players are missing responses vs which declined. Keep the list; prepend the summary. If product intent is truly to replace the list, that is a planner decision — both implementations are simple.

2. **Exact copy for the empty-state message**
   - What we know: "No players available this day." is clear and concise
   - What's unclear: Should it distinguish "no response" from "all busy"? (Currently the data type collapses both to `'no-response'`.)
   - Recommendation: Use "No players available this day." Do not attempt to distinguish busy vs no-response — that requires a `PlayerDayStatus` type change, which is out of scope per PITFALLS.md analysis.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection of `/Users/richardowen/Desktop/wheres-the-cleric/src/components/CampaignTabs.tsx` — exact line numbers, prop names, class names, insertion points
- Direct inspection of `/Users/richardowen/Desktop/wheres-the-cleric/src/components/DashboardCalendar.tsx` — confirmed `ring-1 ring-amber-400/60` at line 143
- Direct inspection of `/Users/richardowen/Desktop/wheres-the-cleric/src/lib/availability.ts` — confirmed `DayAggregation` fields: `freeCount`, `totalPlayers`, `dmBlocked`
- `/Users/richardowen/Desktop/wheres-the-cleric/.planning/research/ARCHITECTURE.md` — feature analysis for all three changes with code examples
- `/Users/richardowen/Desktop/wheres-the-cleric/.planning/research/PITFALLS.md` — colour mismatch pitfall (Pitfall 6), empty state pitfall (Pitfall 7), dmBlocked silently absent (Pitfall 5)

### Secondary (MEDIUM confidence)

- None required — all findings derive from first-party codebase inspection.

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries already in use
- Architecture: HIGH — exact line numbers verified from live source file
- Pitfalls: HIGH — derived from direct codebase inspection plus prior milestone research

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable UI codebase; no external dependency changes)
