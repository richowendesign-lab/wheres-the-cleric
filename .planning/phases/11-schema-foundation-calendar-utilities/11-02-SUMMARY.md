---
phase: 11-schema-foundation-calendar-utilities
plan: 02
subsystem: ui
tags: [typescript, calendar, refactor, utilities]

# Dependency graph
requires: []
provides:
  - src/lib/calendarUtils.ts with shared buildMonthGrid and formatDateKey exports
  - DashboardCalendar.tsx importing from calendarUtils (no local copies)
  - AvailabilityCalendar.tsx importing from calendarUtils (no local copies)
  - availability.ts importing formatDateKey from calendarUtils (no local copy)
affects: [Phase 13 DmExceptionCalendar, Phase 16 DatePicker]

# Tech tracking
tech-stack:
  added: []
  patterns: [utility extraction, single source of truth for shared functions]

key-files:
  created:
    - src/lib/calendarUtils.ts
  modified:
    - src/components/DashboardCalendar.tsx
    - src/components/AvailabilityCalendar.tsx
    - src/lib/availability.ts

key-decisions:
  - "calendarUtils.ts has zero imports — prevents any circular dependency regardless of import direction from lib files"
  - "Named exports only (no default export) — consistent with existing lib patterns and allows tree-shaking"
  - "Function bodies copied verbatim — pure extraction with no logic change"

patterns-established:
  - "calendarUtils pattern: shared calendar functions live in src/lib/calendarUtils.ts, not in components"
  - "UTC-safe date serialization: always use formatDateKey from calendarUtils, not toISOString().split('T')[0]"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 11 Plan 02: calendarUtils Extraction Summary

**Extracted duplicate buildMonthGrid and formatDateKey functions into src/lib/calendarUtils.ts, eliminating three byte-for-byte identical private copies across DashboardCalendar, AvailabilityCalendar, and availability.ts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T14:25:04Z
- **Completed:** 2026-03-09T14:27:00Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 updated)

## Accomplishments
- Created src/lib/calendarUtils.ts with zero imports and two named exports: buildMonthGrid and formatDateKey
- Removed 17-line duplicate function block from DashboardCalendar.tsx (lines 15-31)
- Removed 17-line duplicate function block from AvailabilityCalendar.tsx (lines 13-29)
- Removed 3-line private formatDateKey from availability.ts (lines 24-26)
- All three files now import from the single shared source — no behaviour change

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/lib/calendarUtils.ts with the two shared exports** - `221085f` (feat)
2. **Task 2: Update DashboardCalendar, AvailabilityCalendar, and availability.ts to import from calendarUtils** - `da0022b` (refactor)

## Files Created/Modified
- `src/lib/calendarUtils.ts` - New shared utility: buildMonthGrid (2D grid builder) and formatDateKey (UTC-safe YYYY-MM-DD serializer)
- `src/components/DashboardCalendar.tsx` - Removed local function copies, added import from calendarUtils
- `src/components/AvailabilityCalendar.tsx` - Removed local function copies, added import from calendarUtils
- `src/lib/availability.ts` - Removed private formatDateKey, added import from calendarUtils

## Decisions Made
- calendarUtils.ts has zero imports, preventing circular dependencies regardless of future import direction from lib files
- Named exports only (no default export), consistent with existing lib patterns and enabling tree-shaking
- Function bodies copied verbatim — pure extraction, no logic change whatsoever

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript error in `src/components/DeleteCampaignButton.tsx` (Type 'Promise<{ error: string; }>' not assignable to VoidOrUndefinedOnly) — present before and after this plan's changes, out of scope, logged here for awareness.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- calendarUtils.ts is the shared foundation Phase 13 (DmExceptionCalendar) and Phase 16 (DatePicker) will import from
- No blockers — TypeScript compilation is clean for all plan-related files
- The pre-existing DeleteCampaignButton.tsx type error should be addressed before or during a future phase

## Self-Check: PASSED

- src/lib/calendarUtils.ts: FOUND
- src/components/DashboardCalendar.tsx: FOUND
- src/components/AvailabilityCalendar.tsx: FOUND
- src/lib/availability.ts: FOUND
- 11-02-SUMMARY.md: FOUND
- Commit 221085f (Task 1): FOUND
- Commit da0022b (Task 2): FOUND

---
*Phase: 11-schema-foundation-calendar-utilities*
*Completed: 2026-03-09*
