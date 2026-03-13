---
phase: 17-calendar-panel-clarity
plan: 01
subsystem: ui
tags: [react, tsx, availability, calendar, side-panel, legend]

# Dependency graph
requires: []
provides:
  - Conditional "DM unavailable" amber-bordered legend swatch in Group Availability calendar
  - DM unavailable exclamation-circle indicator at top of date side panel
  - "No players available this day." empty-state message when freeCount === 0 and players exist
affects: [calendar-ui, availability-display]

# Tech tracking
tech-stack:
  added: []
  patterns: [inline SVG icon for status indicators, conditional rendering gated on aggregated data fields]

key-files:
  created: []
  modified:
    - src/components/CampaignTabs.tsx

key-decisions:
  - "Used exclamation-circle SVG (viewBox 0 0 16 16, stroke currentColor) instead of bordered square for CLAR-02 panel indicator — bordered square read as a checkbox to users"
  - "Legend swatch uses rounded border border-amber-400/60 (square) to match calendar cell ring-amber-400/60 visual language, not a dot"
  - "Empty-state message appears alongside player list, not replacing it — DM still needs to see which players have not responded"

patterns-established:
  - "Pattern: Inline SVG icon components in CampaignTabs.tsx follow width/height attributes + viewBox 0 0 16 16 + fill=none + aria-hidden=true"
  - "Pattern: Availability panel indicators use agg?.dmBlocked (pre-computed) rather than re-deriving from dmExceptionDates"

requirements-completed: [CLAR-01, CLAR-02, CLAR-03]

# Metrics
duration: 24min
completed: 2026-03-13
---

# Phase 17 Plan 01: Calendar Panel Clarity Summary

**Three targeted CampaignTabs.tsx additions surface pre-computed DM availability data: a conditional amber-bordered legend swatch, an exclamation-circle panel indicator for DM-blocked dates, and an empty-state message when no players are free.**

## Performance

- **Duration:** ~24 min
- **Started:** 2026-03-13T09:19:49Z
- **Completed:** 2026-03-13T09:43:00Z
- **Tasks:** 2 (1 auto + 1 human-verify with inline fix)
- **Files modified:** 1

## Accomplishments

- CLAR-01: Legend swatch conditionally renders when `dmExceptionDates.length > 0`, using amber-bordered square to match the calendar cell `ring-amber-400/60` visual language
- CLAR-02: Side panel DM indicator uses an exclamation-circle SVG icon (consistent with app icon pattern) gated on `agg?.dmBlocked`
- CLAR-03: Empty-state message "No players available this day." guards correctly against zero-player campaigns via `agg.freeCount === 0 && agg.totalPlayers > 0`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add DM unavailable legend swatch, panel indicator, and empty-state message** - `f939b87` (feat)
2. **Fix: Replace CLAR-02 panel indicator square with exclamation-circle SVG** - `d10befe` (fix, applied during Task 2 verification)

**Plan metadata:** committed with docs commit below

## Files Created/Modified

- `src/components/CampaignTabs.tsx` - Added three conditional UI blocks: legend swatch (line ~274), panel DM indicator (line ~134), empty-state message (line ~142)

## Decisions Made

- Used an inline exclamation-circle SVG for the CLAR-02 panel indicator instead of a bordered `<span>` — the bordered square read as a checkbox in context. The SVG follows the existing app convention (`viewBox="0 0 16 16"`, `fill="none"`, `stroke="currentColor"`, explicit `width`/`height`).
- Legend swatch is a square (`rounded border border-amber-400/60`) not a dot — deliberately differentiates DM status from player-status dots and mirrors the calendar cell ring treatment.
- Empty-state message appears above the player list rather than replacing it, so the DM can still see who has not responded.

## Deviations from Plan

### User-directed fix during checkpoint

**1. [Checkpoint feedback] CLAR-02 icon replaced from bordered square to exclamation-circle SVG**
- **Found during:** Task 2 (human-verify checkpoint)
- **Issue:** Amber-bordered square in panel indicator was visually ambiguous — users read it as a checkbox
- **Fix:** Replaced `<span className="w-3 h-3 rounded border border-amber-400/60" />` with a 14×14 SVG circle-with-exclamation matching the app's existing icon conventions
- **Files modified:** src/components/CampaignTabs.tsx
- **Verification:** TypeScript passes, user approved
- **Committed in:** d10befe

---

**Total deviations:** 1 (user-directed visual fix at checkpoint)
**Impact on plan:** Purely cosmetic icon replacement; no logic or prop changes. No scope creep.

## Issues Encountered

None — TypeScript passed on first attempt for both the initial implementation and the icon fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three CLAR requirements satisfied and visually verified
- No new components or imports introduced; changes are isolated to CampaignTabs.tsx
- Ready for phase 17 plan 02 if defined

---
*Phase: 17-calendar-panel-clarity*
*Completed: 2026-03-13*
