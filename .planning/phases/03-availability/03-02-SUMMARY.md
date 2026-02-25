---
phase: 03-availability
plan: 02
subsystem: ui
tags: [react, tailwind, typescript, availability, calendar, weekly-schedule]

# Dependency graph
requires:
  - phase: 02-campaign
    provides: D&D dark theme styling conventions established in invite page (gray-950 background, amber accent colors)
provides:
  - WeeklySchedule component: day toggle row + inline time-of-day expansion (Set<string> selection model)
  - AvailabilityCalendar component: custom month grid scoped to planning window with pattern/override visual states
affects:
  - 03-03 (AvailabilityForm assembles both components and wires them to server actions)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Set<string> for weekly availability selection: key format '{dow}-{timeOfDay}' (e.g. '1-morning')"
    - "Map<string, 'free' | 'busy'> for date overrides keyed by YYYY-MM-DD string"
    - "Pure buildMonthGrid function using Date.UTC arithmetic to avoid timezone shift"
    - "UTC-safe date comparison using getUTCFullYear/getUTCMonth/getUTCDate throughout"

key-files:
  created:
    - src/components/WeeklySchedule.tsx
    - src/components/AvailabilityCalendar.tsx
  modified: []

key-decisions:
  - "WeeklySchedule uses Set<string> with '{dow}-{time}' key format matching AvailabilityEntry dayOfWeek/timeOfDay convention"
  - "AvailabilityCalendar renders months stacked vertically (scrollable) — simpler than paginated; Claude's discretion per CONTEXT.md"
  - "buildMonthGrid uses Date.UTC(year, month, day) for all cell dates to guarantee UTC-safe comparison across timezones"
  - "Legend added to AvailabilityCalendar for pattern-free / override-free / override-busy visual states"

patterns-established:
  - "WeeklySchedule: toggling an active day removes ALL its time slots; toggling an inactive day adds 'afternoon' as default"
  - "AvailabilityCalendar: outside-window dates rendered with disabled button (no onClick), in-window dates always clickable"

requirements-completed: [AVAIL-01, AVAIL-02, AVAIL-03]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 3 Plan 02: Availability UI Components Summary

**WeeklySchedule (day toggles + time-of-day expansion) and AvailabilityCalendar (custom UTC-safe month grid with pattern/override visual states) — both 'use client', zero external dependencies, D&D dark theme**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-24T15:54:53Z
- **Completed:** 2026-02-24T15:56:37Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- WeeklySchedule: 7 day toggle buttons (Sun-Sat), inline morning/afternoon/evening options expand per active day, amber highlights, full Set-based state via onChange callback
- AvailabilityCalendar: pure JS month grid with no external library, UTC-safe date arithmetic, renders all months in planning window, four visual states (pattern-free amber, pattern-busy grey, override-free green, override-busy red), legend included
- Full TypeScript compile with zero errors on both components

## Task Commits

Each task was committed atomically:

1. **Task 1: WeeklySchedule component** - `d9c28dc` (feat)
2. **Task 2: AvailabilityCalendar component** - `f20a8c1` (feat)

## Files Created/Modified

- `src/components/WeeklySchedule.tsx` - Day toggle + inline time-of-day UI; Set<string> selection model; onChange callback prop
- `src/components/AvailabilityCalendar.tsx` - Custom month grid covering planning window; buildMonthGrid pure function; pattern/override visual states; onDateClick callback prop

## Decisions Made

- Scrollable stacked months for calendar (not paginated) — simpler to build, left to Claude's discretion per CONTEXT.md
- Added a visual legend to the calendar bottom to aid usability (pattern-free / override-free / override-busy)
- UTC-safe date construction with Date.UTC() throughout to prevent one-day-off errors in non-UTC timezones (addresses Pitfall 2 from RESEARCH.md)
- WeeklySchedule renders time buttons inline under each active day using flex column layout — mobile-friendly without breakpoints

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both components are self-contained and ready for Plan 03 to assemble into AvailabilityForm
- WeeklySchedule accepts `selection: Set<string>` and `onChange` — AvailabilityForm will own the state and pass it down
- AvailabilityCalendar accepts `planningWindowStart/End` as ISO strings (safe for Server Component serialization), `weeklySelection` Set, `overrides` Map, and `onDateClick` — all props match the data shape from the Prisma schema
- No blockers; Plan 03 (AvailabilityForm assembly + server actions) can proceed immediately

---
*Phase: 03-availability*
*Completed: 2026-02-24*
