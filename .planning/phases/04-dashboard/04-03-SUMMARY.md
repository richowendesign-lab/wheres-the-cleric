---
phase: 04-dashboard
plan: "03"
subsystem: ui
tags: [next.js, prisma, react, tailwind, server-components]

# Dependency graph
requires:
  - phase: 04-01
    provides: computeDayStatuses, DayAggregation, resolvePlayerStatusOnDate in src/lib/availability.ts
  - phase: 04-02
    provides: DashboardCalendar interactive calendar grid component and BestDaysList
provides:
  - Extended campaign detail page with full DM dashboard — calendar, missing players, best days
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server component computes aggregates and serializes Dates before passing to client components
    - Prisma query extended with nested include for availabilityEntries
    - missingPlayers derived by filtering playerSlots with zero availabilityEntries

key-files:
  created: []
  modified:
    - src/app/campaigns/[id]/page.tsx

key-decisions:
  - "Dashboard sections appended below existing invite links and planning window sections — no existing JSX modified"
  - "Dates serialized via toISOString().split('T')[0] on server before reaching client components — avoids RSC Date serialization error"
  - "computeDayStatuses called server-side, result passed as plain DayAggregation[] to DashboardCalendar and BestDaysList"
  - "DashboardCalendar always renders (handles its own empty state); Awaiting Response section is conditional on missingPlayers.length > 0"

patterns-established:
  - "Serialize pattern: Prisma Date -> ISO string on server component before client prop"
  - "Nested Prisma include: playerSlots -> availabilityEntries fetched in a single query"

requirements-completed:
  - DASH-01
  - DASH-02
  - DASH-03
  - DASH-04

# Metrics
duration: 1min
completed: 2026-02-26
---

# Phase 4 Plan 03: Dashboard Wired into Campaign Detail Page Summary

**Campaign detail page extended with full DM dashboard — Prisma query with nested availabilityEntries, server-side aggregate computation, and DashboardCalendar, BestDaysList, and Awaiting Response sections rendered below existing content**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-26T09:01:01Z
- **Completed:** 2026-02-26T09:02:19Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Extended Prisma query to include `availabilityEntries: true` nested inside `playerSlots` — fetches all data in one round-trip
- Serialized all `Date` objects to ISO strings server-side to avoid Next.js RSC serialization error when passing to client components
- Computed `dayAggregations` server-side via `computeDayStatuses` with serialized planning window bounds
- Added "Awaiting Response" section listing players with zero availability entries (conditional)
- Added "Group Availability" section with dot legend and `DashboardCalendar` component
- Added "Best Days" section with `BestDaysList` component
- Preserved all existing sections (invite links, planning window form) without modification

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend campaign detail page with full dashboard** - `a92b2aa` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/app/campaigns/[id]/page.tsx` - Extended with nested Prisma query, Date serialization, server-side aggregation, and three new dashboard sections

## Decisions Made
- Dashboard sections appended below existing content — no risk of breaking existing UI
- Dates serialized via `toISOString().split('T')[0]` on server before reaching client components — avoids RSC Date serialization error
- `computeDayStatuses` called server-side, result passed as plain `DayAggregation[]` to child components
- `DashboardCalendar` always renders (handles its own empty state message); "Awaiting Response" section is conditional on `missingPlayers.length > 0`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 is now complete — all three plans done
- The DM dashboard is fully wired: group availability calendar with click-through panel, best days ranking, and awaiting-response indicator are all visible on the campaign detail page
- No blockers or concerns

---
*Phase: 04-dashboard*
*Completed: 2026-02-26*
