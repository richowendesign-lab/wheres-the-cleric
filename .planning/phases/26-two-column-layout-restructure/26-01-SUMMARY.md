---
phase: 26-two-column-layout-restructure
plan: 01
subsystem: ui
tags: [react, nextjs, tailwind, css-grid, layout]

# Dependency graph
requires: []
provides:
  - "Two-column CSS Grid layout on Availability tab (calendar left, sidebar right) at lg+ breakpoints"
  - "Inline sidebar content swap: Best Days + join link by default, player breakdown on date select"
  - "Join link removed from Settings tab; single CopyLinkButton instance in availability sidebar"
affects: [27-dm-sync-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "lg:col-start / lg:row-start for desktop column reordering without CSS order property"
    - "DOM source-order determines mobile stack; grid placement determines desktop layout"
    - "Sidebar sticky positioning via lg:sticky lg:top-20 for persistent right-column visibility"

key-files:
  created: []
  modified:
    - src/components/CampaignTabs.tsx

key-decisions:
  - "Sidebar rendered first in DOM source order so it stacks above calendar on mobile without CSS order"
  - "selectedDate ternary in sidebar renders either date detail card or BestDaysList+join link — no separate drawer"
  - "Fixed backdrop and fixed panel fully removed; date detail is now inline within the grid sidebar"
  - "Join link lives only in the availability sidebar; Settings Join Link section deleted entirely"

patterns-established:
  - "Two-column grid: lg:grid-cols-[1fr_320px] with aside lg:col-start-2 and main div lg:col-start-1"
  - "Inline content swap: selectedDate ? <detail> : <default> inside sidebar aside"

requirements-completed: [LAYOUT-01, LAYOUT-02, LAYOUT-03, SET-02]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 26 Plan 01: Two-Column Layout Restructure Summary

**CSS Grid two-column availability layout with inline sidebar content swap, replacing fixed slide-in drawer; join link moved from Settings to availability sidebar**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T19:01:33Z
- **Completed:** 2026-03-17T19:04:33Z
- **Tasks:** 2 (Task 3 is human-verify checkpoint — paused for browser verification)
- **Files modified:** 1

## Accomplishments

- Removed fixed backdrop (`fixed inset-0 z-10`) and fixed panel (`fixed inset-y-0 right-0 w-80`) entirely
- Added `lg:grid-cols-[1fr_320px]` two-column grid: calendar in left column, persistent sidebar in right column
- Sidebar swaps between Best Days + join link (default) and player date breakdown (on date select) via `selectedDate` ternary
- Mobile layout: sidebar stacks above calendar using DOM source order + `lg:col-start` grid placement
- Deleted "Join Link" section from Settings tab; `CopyLinkButton` now has exactly one JSX instance

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove fixed panel + backdrop, restructure availability tab into two-column grid** - `2763d5e` (feat)
2. **Task 2: Remove Join Link section from Settings tab** - `4c59db6` (feat)

## Files Created/Modified

- `src/components/CampaignTabs.tsx` - Two-column grid layout with inline sidebar content swap; Settings Join Link section removed

## Decisions Made

- DOM source-order placement (sidebar first, calendar second) used for mobile stacking instead of CSS `order` property — as specified by plan
- `selectedDate` ternary drives sidebar content swap at the `<aside>` level — cleaner than a separate state variable for "panel mode"
- The `aggMap` construction and Escape key `useEffect` carried forward unchanged from the removed fixed panel

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Two-column layout is complete and compiles cleanly
- Task 3 (human-verify checkpoint) is pending — user must verify in browser at http://localhost:3000/campaigns/[id]
- After verification, ready for Phase 27 (DM sync UI)

---
*Phase: 26-two-column-layout-restructure*
*Completed: 2026-03-17*
