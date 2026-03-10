---
phase: 14-dashboard-redesign
plan: "01"
subsystem: ui
tags: [react, typescript, nextjs, server-actions]

# Dependency graph
requires:
  - phase: 13-dm-availability-exceptions
    provides: DayAggregation type with dmBlocked, playerStatuses fields used by BestDaysList
provides:
  - UpdatePlanningWindowForm with serialization-safe string props (unblocks CampaignTabs in Plan 02)
  - BestDaysList rendering unavailable player names per DASH-04 requirement
affects: [14-dashboard-redesign Plan 02 (CampaignTabs), 14-dashboard-redesign Plan 03 (page rewire)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server->Client serialization safety: use string | null for date props instead of Date objects"
    - "DASH-04 pattern: show unavailable players (not free) — filter playerStatuses !== 'free'"

key-files:
  created: []
  modified:
    - src/components/UpdatePlanningWindowForm.tsx
    - src/components/BestDaysList.tsx

key-decisions:
  - "UpdatePlanningWindowForm accepts campaignId + planningWindowStart/End as string | null — Date objects cannot cross Server->Client boundary"
  - "BestDaysList unavailable = !free: PlayerDayStatus is 'free' | 'no-response', so !=='free' correctly captures all unavailability"
  - "page.tsx call site type error is a known temporary state — will be fixed in Plan 03 (expected, documented in plan)"

patterns-established:
  - "String props for dates: when a component crosses Server->Client boundary, convert Date fields to YYYY-MM-DD strings before passing as props"

requirements-completed: [DASH-04]

# Metrics
duration: 1min
completed: 2026-03-10
---

# Phase 14 Plan 01: Component Prerequisite Fixes Summary

**UpdatePlanningWindowForm refactored to string props (Server->Client safe) and BestDaysList corrected to show unavailable player names per DASH-04**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-10T14:41:11Z
- **Completed:** 2026-03-10T14:42:08Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- UpdatePlanningWindowForm now accepts flat `string | null` date props instead of a `Campaign` object with `Date` fields — eliminates React serialization error when component is rendered inside a Client Component
- `toVal` Date helper removed — inputs use YYYY-MM-DD strings directly as `defaultValue`
- BestDaysList now computes `unavailablePlayerNames` (players whose status is not 'free') instead of `freePlayerNames` — corrects DASH-04 gap
- When all players are free, no names are shown (parenthetical omitted); when some are unavailable, renders "(Name1, Name2 unavailable)"

## Task Commits

Each task was committed atomically:

1. **Task 1: Update UpdatePlanningWindowForm to accept string props** - `53901e0` (feat)
2. **Task 2: Fix BestDaysList to show unavailable player names** - `987b6b6` (fix)

## Files Created/Modified
- `src/components/UpdatePlanningWindowForm.tsx` - Replaced `campaign: Campaign` prop with flat `campaignId, planningWindowStart, planningWindowEnd` string props; removed `toVal` helper; `useActionState` bind uses `campaignId`
- `src/components/BestDaysList.tsx` - Replaced `freePlayerNames` with `unavailablePlayerNames` computation and updated render to show "(names unavailable)" label

## Decisions Made
- `page.tsx` call site type error is a known temporary state: plan explicitly documents that the old `campaign` prop usage in the page will cause a TypeScript error until Plan 03 rewires it. This is expected and not a bug.
- Filter `!== 'free'` is correct for unavailability: `PlayerDayStatus = 'free' | 'no-response'`, so any non-free status means the player hasn't confirmed availability.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The TypeScript check confirmed the `page.tsx` type error is exactly as documented in the plan (expected temporary state).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- UpdatePlanningWindowForm is ready to be consumed by CampaignTabs Client Component (Plan 02)
- BestDaysList correctly displays unavailability information per DASH-04
- Plan 03 must rewire `page.tsx` to pass the new flat string props to UpdatePlanningWindowForm (known type error exists until then)

---
*Phase: 14-dashboard-redesign*
*Completed: 2026-03-10*
