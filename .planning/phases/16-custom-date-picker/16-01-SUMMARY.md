---
phase: 16-custom-date-picker
plan: 01
subsystem: ui
tags: [react, nextjs, date-picker, tailwind, calendarUtils]

# Dependency graph
requires:
  - phase: 11-calendar-utils
    provides: buildMonthGrid and formatDateKey utility functions used by DatePickerInput
provides:
  - Reusable DatePickerInput Client Component with purple/dark DnD theme
  - CampaignForm wired with custom date pickers replacing native browser inputs
affects:
  - Any future form that needs a date picker (can import DatePickerInput directly)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Self-contained date picker using buildMonthGrid from calendarUtils — no date library
    - Hidden input pattern for FormData submission from a controlled Client Component
    - Outside-click dismiss via mousedown + touchstart (covers desktop and mobile)

key-files:
  created:
    - src/components/DatePickerInput.tsx
  modified:
    - src/components/CampaignForm.tsx

key-decisions:
  - "DatePickerInput does not add required to the hidden input — browsers ignore required on hidden inputs; server-side validation handles missing dates"
  - "Both mousedown and touchstart registered for outside-click dismiss — touchstart needed for mobile devices where mousedown does not fire"
  - "placeholder prop defaults to Pick a date — calling sites provide contextual strings (Planning window start / end)"
  - "displayLabel uses en-GB locale with timeZone UTC to avoid off-by-one day display from timezone conversion"

patterns-established:
  - "Date picker pattern: trigger button + hidden input + absolute popover using calendarUtils grid, no external date library"

requirements-completed: [PICK-01, PICK-02]

# Metrics
duration: 17min
completed: 2026-03-11
---

# Phase 16 Plan 01: Custom Date Picker Summary

**Styled purple/dark DatePickerInput Client Component built on calendarUtils grid, replacing native browser date inputs in CampaignForm with no new npm dependencies.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-11T15:56:27Z
- **Completed:** 2026-03-11T16:13:54Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `DatePickerInput.tsx` — a fully self-contained date picker using `buildMonthGrid` and `formatDateKey` from `calendarUtils.ts`, styled with existing DnD design tokens
- Hidden input carries YYYY-MM-DD value into FormData without touching any Server Action
- Outside-click (mousedown + touchstart) and Escape-key dismiss implemented for accessibility and mobile support
- CampaignForm `planningWindowStart` and `planningWindowEnd` native date inputs replaced; zero `<input type="date">` remain

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DatePickerInput component** - `af959e3` (feat)
2. **Task 2: Wire DatePickerInput into CampaignForm** - `c4e91c8` (feat)

**Plan metadata:** `2fa2bfd` (docs: complete plan)

## Files Created/Modified

- `src/components/DatePickerInput.tsx` - Self-contained date picker Client Component with month nav, calendar grid, trigger button, hidden input
- `src/components/CampaignForm.tsx` - Replaced two native date inputs with DatePickerInput; import added

## Decisions Made

- `required` prop is accepted but NOT forwarded to the hidden input — browsers ignore `required` on hidden inputs and the server action handles validation
- `displayLabel` uses `timeZone: 'UTC'` in `toLocaleDateString` to prevent off-by-one day display from local timezone conversion
- Both `mousedown` and `touchstart` registered on `document` for outside-click dismiss — `touchstart` fires before `mousedown` on mobile, ensuring consistent popover close behavior
- Trigger button uses `type="button"` explicitly to prevent accidental form submission on click

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `DatePickerInput` is ready for reuse in any other form that needs a date picker (e.g., `UpdatePlanningWindowForm`)
- No blockers for subsequent Phase 16 plans
- Confirmed: `updatePlanningWindow` server action calls `revalidatePath` — key-based remount strategy (noted as Phase 16 blocker in STATE.md) applies to edit form wiring if needed in plan 16-02

## Self-Check: PASSED

- FOUND: `src/components/DatePickerInput.tsx`
- FOUND: `src/components/CampaignForm.tsx`
- FOUND: `.planning/phases/16-custom-date-picker/16-01-SUMMARY.md`
- FOUND commit: `af959e3` (feat(16-01): create DatePickerInput client component)
- FOUND commit: `c4e91c8` (feat(16-01): wire DatePickerInput into CampaignForm)

---
*Phase: 16-custom-date-picker*
*Completed: 2026-03-11*
