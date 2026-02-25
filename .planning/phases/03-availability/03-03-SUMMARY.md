---
phase: 03-availability
plan: 03
subsystem: ui
tags: [react, typescript, tailwind, use-debounce, useTransition, auto-save, availability]

# Dependency graph
requires:
  - phase: 03-availability
    plan: 01
    provides: saveWeeklyPattern and toggleDateOverride Server Actions
  - phase: 03-availability
    plan: 02
    provides: WeeklySchedule and AvailabilityCalendar UI components
  - phase: 02-campaign
    provides: invite page Server Component (invite/[token]/page.tsx) with Prisma query and D&D dark theme

provides:
  - AvailabilityForm component: root form assembling WeeklySchedule and AvailabilityCalendar with auto-save
  - Auto-save with 600ms useDebouncedCallback for weekly pattern changes
  - Immediate useTransition save for date override clicks
  - SaveIndicator sub-component with idle/saving/saved/error states and 2s fade-to-idle
  - Flush on unmount to prevent lost saves on tab close
  - Optimistic local state with rollback on failure for date overrides
  - invite/[token]/page.tsx updated to include availabilityEntries and render AvailabilityForm

affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useDebouncedCallback(fn, 600) for weekly selection — batches rapid toggles, saves once after idle"
    - "useTransition wrapping Server Action calls for date overrides — immediate, non-blocking"
    - "debouncedSaveWeekly.flush() in useEffect cleanup — prevents lost saves on unmount/tab close"
    - "Optimistic update + rollback: setOverrides(newOverrides) before save, setOverrides(overrides) on error"
    - "SaveStatus state machine: idle -> saving -> saved/error; setTimeout 2000ms idle reset"
    - "initialEntries prop pattern: Server Component serializes Prisma rows to plain objects for Client Component"
    - "planningWindowStart/End ?? '' empty string guard: AvailabilityCalendar section skipped when no planning window"

key-files:
  created:
    - src/components/AvailabilityForm.tsx
  modified:
    - src/app/invite/[token]/page.tsx

key-decisions:
  - "SaveIndicator extracted as inline sub-component with onRetry prop — retry calls debouncedSaveWeekly.flush() to immediately trigger last weekly save"
  - "Calendar section conditionally rendered only when both planningWindowStart and planningWindowEnd are non-empty strings"
  - "Date override optimistic rollback uses captured overrides closure (pre-click state) to revert on server error"
  - "availabilityEntries fetched via Prisma include (not separate query) — single round-trip for full slot data"

requirements-completed: [AVAIL-04]

# Metrics
duration: ~8min
completed: 2026-02-25
---

# Phase 3 Plan 03: AvailabilityForm Integration Summary

**AvailabilityForm root component wiring WeeklySchedule + AvailabilityCalendar to Server Actions via 600ms debounce and useTransition, with optimistic save indicator and pre-populated state from Prisma initialEntries**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-25T08:56:39Z
- **Completed:** 2026-02-25T09:04:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- AvailabilityForm assembles WeeklySchedule and AvailabilityCalendar into a unified auto-saving form
- Weekly changes debounced at 600ms via useDebouncedCallback; date overrides fire immediately via useTransition
- SaveIndicator shows idle/saving/saved/error states with 2-second auto-reset and retry button
- Flush-on-unmount prevents lost saves when player navigates away mid-debounce
- Optimistic local state for date overrides with server-error rollback
- Invite page updated to include availabilityEntries in Prisma query and render AvailabilityForm with serialized props
- Pre-populated state from initialEntries: weeklySelection Set and overrides Map derived at component init

## Task Commits

Each task was committed atomically:

1. **Task 1: AvailabilityForm root component with auto-save** - `d75cd1e` (feat)
2. **Task 2: Update invite page to wire in AvailabilityForm** - `7e75e1c` (feat)

## Files Created/Modified

- `src/components/AvailabilityForm.tsx` — Root availability form (188 lines): useDebouncedCallback weekly save, useTransition date override, SaveIndicator, flush on unmount, optimistic rollback
- `src/app/invite/[token]/page.tsx` — Added availabilityEntries Prisma include, AvailabilityForm import and render, removed Phase 2 disabled button placeholder

## Decisions Made

- SaveIndicator retry triggers `debouncedSaveWeekly.flush()` — re-sends the last weekly state immediately without requiring user to re-toggle
- Calendar section rendered only when both planningWindowStart and planningWindowEnd are truthy — safe guard for campaigns without planning windows
- Rollback on date override failure reuses the captured `overrides` closure from before the click, ensuring correct pre-click state restoration

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 (availability) is functionally complete — players can toggle weekly availability and date overrides with auto-save
- Phase 4 can now build the DM dashboard to display aggregated availability data across all player slots
- The AvailabilityEntry model (with weekly and override types) is fully populated and ready for Group Availability query work

## Self-Check: PASSED

Files verified:
- `src/components/AvailabilityForm.tsx` — exists, 188 lines
- `src/app/invite/[token]/page.tsx` — exists, AvailabilityForm rendered

Commits verified:
- `d75cd1e` — feat(03-03): add AvailabilityForm root component with auto-save
- `7e75e1c` — feat(03-03): wire AvailabilityForm into invite page with pre-loaded entries

---
*Phase: 03-availability*
*Completed: 2026-02-25*
