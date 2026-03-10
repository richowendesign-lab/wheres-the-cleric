---
phase: 13-dm-availability-exceptions
plan: 02
subsystem: ui
tags: [react, nextjs, typescript, optimistic-ui, server-actions, tailwind]

# Dependency graph
requires:
  - phase: 13-dm-availability-exceptions
    provides: toggleDmException and setDmExceptionMode Server Actions, DayAggregation.dmBlocked field, dmExceptionDates and dmExceptionMode vars in CampaignDetailPage
  - phase: 11-schema-foundation-calendar-utilities
    provides: buildMonthGrid and formatDateKey utilities, DmAvailabilityException schema
provides:
  - DmExceptionCalendar client component with click-to-toggle optimistic state and block/flag mode toggle
  - DashboardCalendar shows amber ring on dmBlocked dates
  - BestDaysList filters (block mode) or badges (flag mode) dmBlocked days
  - Full end-to-end DM exception UI wired into CampaignDetailPage
affects:
  - 14-dashboard-redesign
  - 15-shareable-message

# Tech tracking
tech-stack:
  added: []
  patterns:
    - DmExceptionCalendar uses same optimistic rollback pattern as AvailabilityForm (prevExceptions saved before optimistic update, restored on error)
    - Mode toggle uses separate modeStatus state (not shared with date toggle saveStatus) to avoid status conflicts
    - DmExceptionCalendar does NOT call revalidatePath after toggleDmException — optimistic state is source of truth
    - Cell state derived via getCellState helper to keep render logic clean

key-files:
  created:
    - src/components/DmExceptionCalendar.tsx
  modified:
    - src/components/DashboardCalendar.tsx
    - src/components/BestDaysList.tsx
    - src/app/campaigns/[id]/page.tsx

key-decisions:
  - "DmExceptionCalendar wraps content in <section> (not a standalone section in page) — consistent with existing section pattern"
  - "BestDaysList empty state check uses displayDays.length (post-filter) not bestDays.length — DM-blocking all best days should show empty state"
  - "DashboardCalendar amber ring uses ring-amber-400/60 (60% opacity) to overlay without replacing existing green/gray states"
  - "UX refinement deferred — user approved with note 'we will need to work on the UX later'; current implementation is functional but not final design"

patterns-established:
  - "DM exception UI: separate saveStatus and modeStatus states prevent date-click and mode-toggle feedback from conflicting"
  - "BestDaysList mode filtering: block = filter, flag = badge — pure visual distinction, no server round-trip"

requirements-completed: [DMEX-01, DMEX-02, DMEX-03, DMEX-04]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 13 Plan 02: DM Exception Calendar UI Summary

**DmExceptionCalendar client component with click-to-toggle amber dates, block/flag mode button, and dmBlocked visual treatments in DashboardCalendar (amber ring) and BestDaysList (filter or badge)**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-10T10:00:45Z
- **Completed:** 2026-03-10T10:02:36Z
- **Tasks:** 2 auto-tasks + 1 human verification checkpoint (approved)
- **Files modified:** 4

## Accomplishments
- Created DmExceptionCalendar with optimistic toggle matching AvailabilityForm rollback discipline
- Mode toggle (block/flag) with separate modeStatus state — no status conflicts with date toggle
- DashboardCalendar now shows amber ring-1 ring-amber-400/60 overlay on DM-blocked dates
- BestDaysList applies mode-based filtering (block → hide) or badging (flag → "DM busy" amber badge)
- CampaignDetailPage renders DmExceptionCalendar guarded by planning window presence; BestDaysList receives dmExceptionMode prop

## Task Commits

Each task was committed atomically:

1. **Task 1: Build DmExceptionCalendar client component** - `f434a12` (feat)
2. **Task 2: Wire DmExceptionCalendar into page; add dmBlocked visual treatment to DashboardCalendar and BestDaysList** - `e400548` (feat)

## Files Created/Modified
- `src/components/DmExceptionCalendar.tsx` - Click-to-toggle DM exception calendar with optimistic state, mode toggle (block/flag), amber cell styling, legend, and Toast feedback
- `src/components/DashboardCalendar.tsx` - Added amber ring-1 ring-amber-400/60 conditional class on cells where agg.dmBlocked === true
- `src/components/BestDaysList.tsx` - New dmExceptionMode optional prop; block mode filters out dmBlocked days; flag mode shows DM busy amber badge; empty state check uses post-filter displayDays
- `src/app/campaigns/[id]/page.tsx` - Import and render DmExceptionCalendar below planning window section; pass dmExceptionMode to BestDaysList

## Decisions Made
- DmExceptionCalendar wraps its own section header inside the component (not caller) — self-contained for clarity
- Empty state for BestDaysList checks displayDays.length (post-filter) not bestDays.length — if DM blocks all ranked days in block mode, empty state is correct behaviour
- Separate modeStatus from saveStatus — prevents date click feedback and mode toggle feedback from clobbering each other
- Amber ring uses 60% opacity (ring-amber-400/60) to overlay both green and gray cell states without fully covering them
- UX refinement deferred per user note: "we will need to work on the UX later" — current implementation is functional and verified but the interaction design will be revisited in a future phase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript error in src/components/DeleteCampaignButton.tsx (Promise return type mismatch) was present before this plan and is out of scope. No new errors introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full DM exception UI complete and human-verified: click-toggle, mode switch, visual treatments across all calendar/list views
- Phase 14 (dashboard redesign) can proceed — exception data and amber visual token established here are ready for the full redesign
- Phase 15 (shareable message) can use BestDaysList dmExceptionMode filtering as the ranking source of truth
- UX improvement pass noted for a future phase (user-requested deferral)

## Self-Check: PASSED

- src/components/DmExceptionCalendar.tsx: FOUND
- src/components/DashboardCalendar.tsx: FOUND (dmBlocked amber ring confirmed via grep)
- src/components/BestDaysList.tsx: FOUND (dmBlocked filter/badge confirmed via grep)
- src/app/campaigns/[id]/page.tsx: FOUND (DmExceptionCalendar import and render confirmed via grep)
- Task commits: f434a12 (FOUND), e400548 (FOUND)

---
*Phase: 13-dm-availability-exceptions*
*Completed: 2026-03-10*
