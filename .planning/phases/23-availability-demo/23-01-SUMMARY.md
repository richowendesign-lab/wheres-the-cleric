---
phase: 23-availability-demo
plan: 01
subsystem: ui
tags: [react, intersectionobserver, tailwind, mock-data, demo-widgets]

# Dependency graph
requires:
  - phase: 22-features-step-selector
    provides: FeaturesBlock step-selector pattern for reference
  - phase: 21-landing-animations
    provides: useInView hook pattern that useScrollInView extends
provides:
  - useScrollInView hook (continuous bidirectional IntersectionObserver)
  - HeroDemoWidget (DM dashboard demo with DashboardCalendar + BestDaysList)
  - PlayerDemoWidget (player availability demo with WeeklySchedule + AvailabilityCalendar)
affects: [23-02-plan, HeroSection, PlayersSection]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Self-contained demo widget: 'use client' component with hardcoded mock data, no server calls"
    - "DAY_AGGREGATIONS computed at module scope (not inside component) using fixed string constants"
    - "useScrollInView: continuous bidirectional IntersectionObserver — no disconnect() in callback, only in cleanup"

key-files:
  created:
    - src/hooks/useScrollInView.ts
    - src/components/landing/HeroDemoWidget.tsx
    - src/components/landing/PlayerDemoWidget.tsx
  modified: []

key-decisions:
  - "useScrollInView omits disconnect() from intersection callback — only calls observer.disconnect() in useEffect cleanup — enables true bidirectional toggle"
  - "DAY_AGGREGATIONS computed at module scope with fixed constant strings (not inside component) — safe because it only depends on hardcoded literals"
  - "PlayerDemoWidget uses lazy initializer () => new Set(['5', '6']) for weeklySelection — avoids re-creating Set on every render"
  - "Date.UTC in handleDateClick is safe (client-side click handler, never called during SSR) — only WINDOW_START/WINDOW_END need to be static"
  - "HeroDemoWidget mock data: 4 players with Fri/Sat/Sun weekly patterns against April 2026 window — guarantees non-empty BestDaysList"

patterns-established:
  - "Demo widget pattern: import existing UI primitives, supply hardcoded mock data, replace server-action callbacks with local useState mutations"
  - "Hardcoded window dates rule: WINDOW_START/WINDOW_END must be string literals never derived from new Date() (SSR hydration safety)"

requirements-completed: [HERO-02, PLAY-02]

# Metrics
duration: 8min
completed: 2026-03-13
---

# Phase 23 Plan 01: Availability Demo Building Blocks Summary

**Three new files powering interactive demo embeds: continuous scroll hook, DM dashboard widget (DashboardCalendar + BestDaysList), and player availability widget (WeeklySchedule + AvailabilityCalendar) — all driven by hardcoded mock data with no network calls**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-13T19:45:18Z
- **Completed:** 2026-03-13T19:53:00Z
- **Tasks:** 2
- **Files modified:** 3 created

## Accomplishments
- Created `useScrollInView` hook that toggles `inView` bidirectionally without disconnecting the observer mid-session
- Created `HeroDemoWidget` with 4 mock players (Aria/Brom/Cass/Dwyn) and weekly Fri/Sat/Sun availability patterns, producing a non-empty BestDaysList for April 2026
- Created `PlayerDemoWidget` with Fri+Sat pre-selected initial state and full toggle logic replicated locally

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useScrollInView hook** - `45be826` (feat)
2. **Task 2: Create HeroDemoWidget and PlayerDemoWidget** - `733c4c8` (feat)

## Files Created/Modified
- `src/hooks/useScrollInView.ts` - Continuous bidirectional IntersectionObserver hook; no disconnect() in callback
- `src/components/landing/HeroDemoWidget.tsx` - DM dashboard demo wrapping DashboardCalendar + BestDaysList with hardcoded mock slots
- `src/components/landing/PlayerDemoWidget.tsx` - Player availability demo wrapping WeeklySchedule + AvailabilityCalendar; Fri+Sat pre-selected

## Decisions Made
- `useScrollInView` only calls `observer.disconnect()` in the useEffect cleanup function (on unmount), not in the intersection callback — this is the key difference from the existing `useInView` hook
- `DAY_AGGREGATIONS` computed at module scope rather than inside the component, since it depends only on hardcoded constants (safe and avoids re-computation on each render)
- Mock player data uses 4 players with varied Fri/Sat/Sun patterns to ensure BestDaysList shows real ranked results against April 2026
- `Date.UTC` usage inside `handleDateClick` (click handler) is intentionally allowed — it runs client-side only, never during SSR

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three building blocks are ready for Plan 02 to wire into landing sections
- `HeroDemoWidget` can be embedded in HeroSection
- `PlayerDemoWidget` can replace the static screenshot in PlayersSection with zoom animation driven by `useScrollInView`

---
*Phase: 23-availability-demo*
*Completed: 2026-03-13*
