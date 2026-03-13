# Phase 23: Availability Demo - Research

**Researched:** 2026-03-13
**Domain:** React interactive demo components, IntersectionObserver scroll animations, self-contained mock data
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HERO-02 | Visitor can interact with an embedded DM dashboard demo showing a mock campaign with placeholder player data and best-day recommendations | DashboardCalendar + BestDaysList can be driven by hardcoded mock data; computeDayStatuses + computeBestDays are pure functions importable without DB access |
| PLAY-02 | Visitor can interact with an embedded player availability demo using placeholder data, with a planning window computed from the current date | AvailabilityCalendar + WeeklySchedule are already pure UI components driven by props/state; hardcoded window dates avoid SSR hydration mismatch |
</phase_requirements>

---

## Summary

Phase 23 builds two self-contained interactive demo embeds — one in the hero section (DM dashboard view) and one in the PlayersSection (player availability view). Neither embed may touch the network, auth, or server actions. All interactivity must live purely in React state using the existing component library already present in the codebase.

The good news: every UI primitive needed for both demos already exists as a standalone component. `AvailabilityCalendar`, `WeeklySchedule`, `DashboardCalendar`, and `BestDaysList` are all pure-render components driven entirely by props and state. The demo components are wrappers that supply hardcoded mock data and wire up local `useState` in place of the real server-action callbacks.

The additional design decision requires the PlayersSection demo embed to animate larger as the section scrolls into view and back down when it scrolls out. This is a **continuous bidirectional** scroll animation — fundamentally different from the one-shot `useInView` (which calls `observer.disconnect()` and never resets). A new hook or inline observer is needed that tracks both intersecting and non-intersecting states without disconnecting.

**Primary recommendation:** Build two new wrapper components — `HeroDemoWidget` and `PlayerDemoWidget` — using only existing UI primitives and hardcoded placeholder data. For the zoom animation on `PlayerDemoWidget`, use a new `useScrollInView` hook (continuous, no disconnect) driving a `scale` transform via Tailwind classes.

---

## Standard Stack

### Core
| Library / API | Version | Purpose | Why Standard |
|---------------|---------|---------|--------------|
| React `useState` | 19 (already in project) | All demo interactivity | No external dependency needed |
| Native `IntersectionObserver` | Browser API | Scroll-triggered zoom animation | Already used in project; zero dependencies |
| Tailwind CSS 4 | Already in project | Scale / transform utilities | `scale-100`, `scale-105`, `transition-transform` already available |

### No New Dependencies
The project constraint "zero new npm dependencies" applies. All primitives already exist.

**Installation:** No new installs. All imports are from existing project files or React internals.

---

## Architecture Patterns

### Recommended File Structure
```
src/components/landing/
├── HeroSection.tsx            # EXISTING — add HeroDemoWidget here
├── PlayersSection.tsx         # EXISTING — replace screenshot with PlayerDemoWidget
├── HeroDemoWidget.tsx         # NEW — DM dashboard demo (HERO-02)
└── PlayerDemoWidget.tsx       # NEW — player availability demo (PLAY-02)

src/hooks/
├── useInView.ts               # EXISTING — one-shot, fires once
└── useScrollInView.ts         # NEW — continuous bidirectional, for zoom animation
```

### Pattern 1: Self-Contained Demo Widget
**What:** A `'use client'` component that owns all state for the demo interaction. It imports existing UI primitives, passes hardcoded mock data as initial state, and replaces server-action callbacks with local state mutations.
**When to use:** Wherever a demo must behave identically to the real app but make no server requests.

```typescript
// HeroDemoWidget.tsx — DM dashboard demo
'use client'
import { useState } from 'react'
import { DashboardCalendar } from '@/components/DashboardCalendar'
import { BestDaysList } from '@/components/BestDaysList'
import { computeDayStatuses, computeBestDays } from '@/lib/availability'

// Hardcoded planning window — MUST use literal date strings, not new Date()
// to avoid SSR hydration mismatch
const WINDOW_START = '2026-04-01'
const WINDOW_END = '2026-04-30'

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Aria' },
  { id: 'p2', name: 'Brom' },
  { id: 'p3', name: 'Cass' },
  { id: 'p4', name: 'Dwyn' },
]

// Pre-computed mock availability entries per player
// Using weekly patterns avoids long date-list literals
const MOCK_SLOTS = [
  { id: 'p1', name: 'Aria',  availabilityEntries: [
    { id: 'e1', type: 'weekly', dayOfWeek: 6, date: null, timeOfDay: null, status: 'free' },
    { id: 'e2', type: 'weekly', dayOfWeek: 0, date: null, timeOfDay: null, status: 'free' },
  ]},
  // ... etc
]

export function HeroDemoWidget() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const dayAggregations = computeDayStatuses(MOCK_SLOTS, WINDOW_START, WINDOW_END)

  return (
    <div className="...">
      <DashboardCalendar
        dayAggregations={dayAggregations}
        playerSlots={MOCK_PLAYERS}
        windowStart={WINDOW_START}
        windowEnd={WINDOW_END}
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate(d)}
      />
      <BestDaysList
        days={dayAggregations}
        playerSlots={MOCK_PLAYERS}
        dmExceptionMode={null}
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate(d)}
      />
    </div>
  )
}
```

### Pattern 2: Player Demo Widget (No Server Actions)
**What:** A `'use client'` component replicating `AvailabilityForm` but with all server-action calls removed. Local state only.
**When to use:** PLAY-02 player availability embed.

```typescript
// PlayerDemoWidget.tsx — player availability demo
'use client'
import { useState } from 'react'
import { WeeklySchedule } from '@/components/WeeklySchedule'
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar'

// CRITICAL: hardcoded string literals, NOT new Date()
// Reason: new Date() on server and client may produce different values
// causing React hydration mismatch errors. The project STATE.md confirms this rule.
const WINDOW_START = '2026-04-01'
const WINDOW_END = '2026-04-30'

export function PlayerDemoWidget() {
  const [weeklySelection, setWeeklySelection] = useState<Set<string>>(
    new Set(['5', '6'])  // Fri + Sat pre-selected for friendly demo UX
  )
  const [overrides, setOverrides] = useState<Map<string, 'free' | 'busy'>>(new Map())

  function handleDateClick(dateKey: string) {
    // Mirror real AvailabilityForm toggle logic — no server call
    const current = overrides.get(dateKey)
    const newOverrides = new Map(overrides)
    if (current !== undefined) {
      newOverrides.delete(dateKey)
    } else {
      const [y, m, d] = dateKey.split('-').map(Number)
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
      const isPatternFree = weeklySelection.has(String(dow))
      newOverrides.set(dateKey, isPatternFree ? 'busy' : 'free')
    }
    setOverrides(newOverrides)
  }

  return (
    <div className="space-y-6">
      <WeeklySchedule selection={weeklySelection} onChange={setWeeklySelection} />
      <AvailabilityCalendar
        planningWindowStart={WINDOW_START}
        planningWindowEnd={WINDOW_END}
        weeklySelection={weeklySelection}
        overrides={overrides}
        onDateClick={handleDateClick}
      />
    </div>
  )
}
```

### Pattern 3: Continuous Bidirectional Scroll Hook (Zoom Animation)
**What:** A new `useScrollInView` hook that does NOT call `observer.disconnect()`. Returns `inView: boolean` that toggles true when intersecting and back to false when not. Drives scale transforms on the PlayersSection demo embed.
**When to use:** The PlayersSection zoom-on-entry / zoom-on-exit animation.

```typescript
// src/hooks/useScrollInView.ts
import { useRef, useState, useEffect } from 'react'

export function useScrollInView<T extends HTMLElement = HTMLElement>(
  options: { threshold?: number; rootMargin?: string } = {}
): { ref: React.RefObject<T | null>; inView: boolean } {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // No disconnect() — let it toggle continuously
          setInView(entry.isIntersecting)
        })
      },
      {
        threshold: options.threshold ?? 0.2,
        rootMargin: options.rootMargin ?? '0px',
      }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return { ref, inView }
}
```

Then in `PlayersSection.tsx`, wrap the demo embed:
```tsx
// Apply zoom class to the demo wrapper div, not the whole section
const { ref: zoomRef, inView: demoInView } = useScrollInView({ threshold: 0.2 })

<div
  ref={zoomRef as React.RefObject<HTMLDivElement>}
  className={[
    'transition-transform duration-500 ease-out motion-reduce:transition-none',
    demoInView ? 'scale-105' : 'scale-100',
  ].join(' ')}
>
  <PlayerDemoWidget />
</div>
```

### Anti-Patterns to Avoid
- **Using `new Date()` for demo window bounds:** Causes SSR hydration mismatch. Use literal `'YYYY-MM-DD'` strings. This is explicitly recorded in STATE.md.
- **Importing server actions in demo widgets:** `saveWeeklyPattern` and `toggleDateOverride` from `@/lib/actions/availability` are Next.js server actions — calling them from a no-auth demo would throw. The demo must replicate the toggle logic locally.
- **Applying zoom with `useInView` (existing hook):** The existing `useInView` calls `observer.disconnect()` after first intersection — it will only zoom in, never zoom out. Must use a new continuous hook.
- **Calling `computeDayStatuses` with `new Date()` derived strings:** Same hydration risk. Pre-compute with fixed date constants.
- **Adding `'use client'` to page.tsx:** The STATE.md constraint is absolute — `page.tsx` must stay server-only for the auth redirect guard.
- **Importing `DashboardCalendar` or `BestDaysList` with their `CopyBestDatesButton`:** `CopyBestDatesButton` uses the Clipboard API which requires user gesture — fine in demo context, but be aware it will silently fail in HTTP-only dev if not on localhost. Not a blocker (localhost is treated as secure context).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar grid rendering | Custom month grid | `buildMonthGrid` from `@/lib/calendarUtils` | Already handles UTC-safe first-day-of-week offset and null padding |
| Date key formatting | Custom serializer | `formatDateKey` from `@/lib/calendarUtils` | UTC-safe; avoids local timezone offset bugs |
| Best day ranking | Custom sort | `computeBestDays` from `@/lib/availability` | Already implements freeCount desc + date asc tiebreak |
| Per-day aggregation | Custom loop | `computeDayStatuses` from `@/lib/availability` | Handles weekly pattern + override resolution; pure function, no DB dependency |
| Day cell styling | Custom CSS | `AvailabilityCalendar` and `DashboardCalendar` props | Already implement the full visual states including outside-window, hover, selected ring |
| Weekly day toggle | Custom button row | `WeeklySchedule` component | Already implemented, accessible, styled |

**Key insight:** Every reusable primitive was designed as a pure UI component from the start. The `AvailabilityForm` is the only component that couples to server actions — the demos simply bypass that coupling layer.

---

## Common Pitfalls

### Pitfall 1: SSR Hydration Mismatch from Dynamic Dates
**What goes wrong:** `new Date()` called during server render returns a different value than during client hydration, producing a React hydration error that breaks the entire page.
**Why it happens:** Server and client run in different execution contexts with millisecond difference; or timezone differences between server and browser.
**How to avoid:** All date strings in demo components must be hardcoded literals (`'2026-04-01'`). This is an explicit project rule recorded in STATE.md: "AvailabilityDemoWidget must use hardcoded placeholder dates, not new Date(), to avoid SSR hydration mismatch."
**Warning signs:** React console error "Hydration failed because the server rendered HTML didn't match the client."

### Pitfall 2: Importing Server Actions into Demo Components
**What goes wrong:** `saveWeeklyPattern` and `toggleDateOverride` are Next.js Server Actions. Importing them into a no-auth demo component causes them to fire against the real DB. With no valid `playerSlotId`, the action returns an error — demo appears broken.
**Why it happens:** Copy-pasting from `AvailabilityForm` without stripping the action calls.
**How to avoid:** Demo components replicate the local toggle logic only. No imports from `@/lib/actions/`.
**Warning signs:** Network requests visible in browser DevTools, or "Error: No player slot" appearing in demo.

### Pitfall 3: useInView Zoom Only Goes One Direction
**What goes wrong:** Using the existing `useInView` hook for the zoom animation — it fires once and then `disconnect()`s the observer. The demo zooms in when the section enters view but never zooms back out on scroll-away.
**Why it happens:** `useInView` was purpose-built for one-shot entrance animations. The `observer.disconnect()` call is intentional.
**How to avoid:** Create `useScrollInView` (a new hook file) that omits `observer.disconnect()` from the callback. Leave `useInView` unchanged — other sections depend on its one-shot behaviour.
**Warning signs:** Section zooms in but never returns to `scale-100` when scrolled away.

### Pitfall 4: Zoom Applied to Entire PlayersSection
**What goes wrong:** Attaching the scale transform to the outer `<section>` element (which also has the fade/slide-up entrance animation from Phase 21) causes both animations to fight. The section may scale AND translate simultaneously.
**Why it happens:** Applying the zoom ref to the same element that owns the Phase 21 animation.
**How to avoid:** Apply the zoom to a wrapper `<div>` around the demo embed only, not the `<section>` element itself.
**Warning signs:** Jittery animation on section entry; layout shift around the demo area.

### Pitfall 5: BestDaysList Renders "No availability data yet" in Demo
**What goes wrong:** If mock data has no `freeCount > 0` days, `BestDaysList` renders its empty state message instead of ranked days — making the demo look broken.
**Why it happens:** `computeBestDays` filters `d.freeCount > 0` strictly. If mock `availabilityEntries` is empty or weekly patterns don't match the demo window dates, all days have freeCount=0.
**How to avoid:** Ensure MOCK_SLOTS entries have weekly patterns that include days that fall within the WINDOW_START/WINDOW_END range. Verify the planning window month contains the days-of-week specified in weekly patterns.
**Warning signs:** "No availability data yet — waiting for players" shown in hero demo.

---

## Code Examples

### How computeDayStatuses Works Without DB
```typescript
// Source: src/lib/availability.ts (pure function, no Prisma import)
// computeDayStatuses takes PlayerSlotWithEntries[] — the same interface shape
// works for both DB-sourced and hardcoded mock data.

import { computeDayStatuses } from '@/lib/availability'

const mockSlots = [
  {
    id: 'p1',
    name: 'Aria',
    availabilityEntries: [
      { id: 'e1', type: 'weekly', dayOfWeek: 5, date: null, timeOfDay: null, status: 'free' },
      { id: 'e2', type: 'weekly', dayOfWeek: 6, date: null, timeOfDay: null, status: 'free' },
    ]
  }
]

// Returns DayAggregation[] — same shape as real dashboard data
const dayAggregations = computeDayStatuses(mockSlots, '2026-04-01', '2026-04-30')
```

### Tailwind Scale Transition Pattern
```tsx
// Pattern used in existing components for transitions
// scale-105 = 1.05x zoom (subtle but noticeable)
// duration-500 gives a slightly slower ease than the 700ms used for fade-ins

<div
  className={[
    'transition-transform duration-500 ease-out motion-reduce:transition-none',
    inView ? 'scale-105' : 'scale-100',
  ].join(' ')}
>
```

### Existing useInView Signature (DO NOT MODIFY)
```typescript
// Source: src/hooks/useInView.ts
// This hook calls observer.disconnect() — one-shot only
// Other sections depend on this behaviour; do not change it
export function useInView<T extends HTMLElement = HTMLElement>(
  options: { threshold?: number; rootMargin?: string } = {}
): { ref: React.RefObject<T | null>; inView: boolean }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Screenshot image in PlayersSection | Interactive demo embed | Phase 23 | Visitors can actually interact, not just view |
| Screenshot image in HeroSection | Interactive DM demo | Phase 23 | Shows real calendar + best-days behaviour |
| One-shot useInView for all animations | useInView (one-shot) + useScrollInView (continuous) | Phase 23 | Enables zoom-in/zoom-out scroll UX |

**Deprecated/outdated for this phase:**
- `/players-screenshot.png` static image in `PlayersSection`: replaced by `PlayerDemoWidget` component
- `/hero-screenshot.png` static image in `HeroSection`: replaced by `HeroDemoWidget` component

---

## Open Questions

1. **How much of the DM dashboard to show in HeroDemoWidget?**
   - What we know: HERO-02 requires "mock campaign with placeholder player data and best-day recommendations"
   - What's unclear: Whether to show the full two-column layout (calendar + best days side by side) or a simplified version
   - Recommendation: Mirror the real CampaignTabs layout but in a compact embed-sized container; show both calendar and best-days list as that's the core value proposition

2. **Exact mock data for demo players**
   - What we know: Must show some "free" days to make best-days list non-empty
   - What's unclear: How many mock players and what availability patterns to use
   - Recommendation: 4 players (matching the project's "group size: 5 people" from PROJECT.md), with different weekend/weekday patterns so the best-days list has interesting variation

3. **Planning window for PLAY-02 "computed from current date"**
   - What we know: REQUIREMENTS.md says "planning window computed from the current date" — but STATE.md says no `new Date()` to avoid SSR hydration
   - What's unclear: How to satisfy "computed from current date" without `new Date()`
   - Recommendation: Use literal date strings that are approximately current (e.g., `'2026-04-01'` to `'2026-04-30'`) rather than dynamically computed. The requirement means "feels like a real campaign window" not "mathematically derived from today". Alternatively, compute relative to a fixed reference date in a `useMemo` with `'use client'` guard — but literal strings are simpler and safer.

---

## Sources

### Primary (HIGH confidence)
- Direct source read: `src/lib/availability.ts` — `computeDayStatuses`, `computeBestDays`, `PlayerSlotWithEntries` interface
- Direct source read: `src/lib/calendarUtils.ts` — `buildMonthGrid`, `formatDateKey`
- Direct source read: `src/components/AvailabilityCalendar.tsx` — props interface, cell state logic
- Direct source read: `src/components/DashboardCalendar.tsx` — props interface, aggregation map pattern
- Direct source read: `src/components/WeeklySchedule.tsx` — props interface
- Direct source read: `src/components/BestDaysList.tsx` — props interface
- Direct source read: `src/hooks/useInView.ts` — disconnect() pattern confirmed
- Direct source read: `.planning/STATE.md` — hydration mismatch rule confirmed

### Secondary (MEDIUM confidence)
- MDN IntersectionObserver API — `isIntersecting` property toggles on both entry and exit; omitting `disconnect()` makes it bidirectional (well-established browser API behaviour)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all primitives are directly readable in the codebase, no guessing
- Architecture: HIGH — component interfaces are explicit; mock data shape is validated against TypeScript types
- Pitfalls: HIGH — SSR hydration rule is explicitly documented in STATE.md; others derived from direct source reading

**Research date:** 2026-03-13
**Valid until:** Stable — no external dependencies to age out
