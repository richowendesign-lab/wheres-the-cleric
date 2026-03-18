---
phase: 26-two-column-layout-restructure
plan: 01
subsystem: ui
tags: [react, nextjs, tailwind, css-grid, layout]

# Dependency graph
requires: []
provides:
  - "Two-column CSS Grid layout on Availability tab (calendar left, Best Days sidebar right) at lg+ breakpoints"
  - "Fixed slide-in date detail panel restored with z-[52] to sit above AppNav (z-50)"
  - "Sidebar permanently shows BestDaysList only; join link remains in Settings tab"
  - "Mobile layout: single column, Best Days stacked above calendar via DOM source order"
affects: [27-flat-settings-and-sync-toggle]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "lg:col-start / lg:row-start for desktop column reordering without CSS order property"
    - "DOM source-order determines mobile stack; grid placement determines desktop layout"
    - "Sidebar sticky positioning via lg:sticky lg:top-20 for persistent right-column visibility"
    - "fixed top-0 right-0 w-80 h-[100dvh] panel with z-[52] to layer above z-50 sticky nav"

key-files:
  created: []
  modified:
    - src/components/CampaignTabs.tsx

key-decisions:
  - "Sidebar rendered first in DOM source order so it stacks above calendar on mobile without CSS order"
  - "Inline sidebar content swap reverted during verification — fixed slide-in panel restored as original behaviour"
  - "Sidebar permanently shows BestDaysList; date detail remains a fixed overlay panel"
  - "Backdrop z-[51], panel z-[52] to ensure date panel renders above sticky AppNav (z-50)"
  - "h-[100dvh] used instead of inset-y-0 / 100vh to fill dynamic viewport on mobile browsers"

patterns-established:
  - "Two-column grid: lg:grid-cols-[1fr_320px] with aside lg:col-start-2 and main div lg:col-start-1"
  - "Fixed overlay panel layering: backdrop z-[51], panel z-[52], nav z-50"

requirements-completed: [LAYOUT-01, LAYOUT-02, LAYOUT-03, SET-02]

# Metrics
duration: ~15min
completed: 2026-03-18
---

# Phase 26 Plan 01: Two-Column Layout Restructure Summary

**CSS Grid two-column availability layout with calendar left and persistent Best Days sidebar right; fixed slide-in date panel restored with corrected z-index above AppNav**

## Performance

- **Duration:** ~15 min (including browser verification and post-checkpoint fixes)
- **Started:** 2026-03-17T19:01:33Z
- **Completed:** 2026-03-18T17:51:51Z
- **Tasks:** 3 (Task 3 = human-verify, PASSED)
- **Files modified:** 1

## Accomplishments

- Added `lg:grid-cols-[1fr_320px]` two-column grid: calendar in left column, Best Days sidebar in right column at desktop width
- Mobile layout: sidebar stacks above calendar using DOM source order + `lg:col-start` grid placement — no CSS `order` property
- Fixed slide-in date detail panel restored: `fixed top-0 right-0 w-80 h-[100dvh]` with `z-[52]` to sit above sticky AppNav (`z-50`)
- Backdrop z-index raised to `z-[51]` so click-to-dismiss works correctly above nav
- `h-[100dvh]` applied to date panel to fill dynamic viewport correctly on mobile browsers
- Sidebar permanently shows `BestDaysList` only; join link retained in Settings tab

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove fixed panel + backdrop, restructure availability tab into two-column grid** - `2763d5e` (feat)
2. **Task 2: Remove Join Link section from Settings tab** - `4c59db6` (feat)
3. **Task 3: Human-verify checkpoint — PASSED** (no direct commit; verified in browser)

Post-checkpoint fix commits (corrections made after human verification):

4. **Restore fixed date panel and join link in Settings** - `989fb2a` (fix)
5. **Raise date panel z-index above AppNav** - `6ec90e0` (fix)
6. **Use h-[100dvh] on date panel** - `900d8b3` (fix)

## Files Created/Modified

- `src/components/CampaignTabs.tsx` - Two-column CSS Grid layout; fixed slide-in date panel restored with corrected z-index; sidebar shows Best Days permanently

## Decisions Made

- DOM source-order placement (sidebar first, calendar second) used for mobile stacking instead of CSS `order` property
- Inline sidebar content swap (planned) was reverted after browser verification — the fixed slide-in panel provides better UX and is kept as original behaviour
- Join link retained in Settings tab (sidebar holds Best Days list only)
- Backdrop/panel z-index raised to z-[51]/z-[52] to layer correctly above sticky AppNav at z-50
- `h-[100dvh]` used on panel instead of `inset-y-0` to handle dynamic viewport on mobile browsers

## Deviations from Plan

### Auto-fixed Issues (post-verification corrections)

**1. [Rule 1 - Bug] Fixed date panel hidden behind AppNav**
- **Found during:** Task 3 (human-verify — browser testing)
- **Issue:** Date panel z-index (z-10 backdrop, z-20 panel) was lower than sticky AppNav (z-50), causing panel to render behind the nav
- **Fix:** Raised backdrop to `z-[51]` and panel to `z-[52]`
- **Files modified:** src/components/CampaignTabs.tsx
- **Verification:** Panel correctly layers above AppNav in browser
- **Committed in:** `6ec90e0`

**2. [Rule 1 - Bug] Fixed date panel viewport gap on mobile browsers**
- **Found during:** Task 3 (human-verify — browser testing)
- **Issue:** `inset-y-0` (equivalent to `100vh`) left a gap at the bottom on mobile browsers where browser chrome reduces the visible viewport
- **Fix:** Replaced with `h-[100dvh]` which uses the dynamic viewport height unit
- **Files modified:** src/components/CampaignTabs.tsx
- **Verification:** Panel fills full visible viewport on mobile
- **Committed in:** `900d8b3`

**3. [Rule 4 - Scope change] Reverted inline sidebar swap; restored fixed panel + Settings join link**
- **Found during:** Task 3 (human-verify — browser testing)
- **Issue:** The original plan called for an inline sidebar content swap (date detail replaces Best Days in the sidebar), but browser testing showed this approach was unwanted — the fixed slide-in panel behaviour was preferred
- **Fix:** Reverted inline sidebar content swap; restored fixed slide-in panel and join link in Settings tab; sidebar permanently shows BestDaysList only
- **Files modified:** src/components/CampaignTabs.tsx
- **Human approved:** Yes — layout confirmed working by user
- **Committed in:** `989fb2a`

---

**Total deviations:** 3 (2 auto-fixed bugs, 1 human-approved scope correction)
**Impact on plan:** Scope correction required reverting the inline sidebar swap and restoring the fixed panel — user preferred original panel UX. Two-column grid layout objective (LAYOUT-01) still satisfied.

## Issues Encountered

None beyond the post-verification scope correction documented above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Two-column grid layout is complete and verified in browser
- Fixed slide-in date panel is restored and correctly layered above AppNav
- Ready for Phase 27 (Flat Settings and Sync Toggle)

---
*Phase: 26-two-column-layout-restructure*
*Completed: 2026-03-18*
