---
phase: 19-how-it-works-page-integration
plan: 01
subsystem: ui
tags: [nextjs, react, client-island, server-component]

# Dependency graph
requires:
  - phase: 18-how-it-works-modal
    provides: HowItWorksModal and HowItWorksButton components built and verified in isolation
provides:
  - HowItWorksButton wired into home, campaigns, join, and availability pages
  - iconOnly prop on HowItWorksButton for compact icon-only rendering
  - defaultRole prop on HowItWorksButton threading player/dm context to the modal
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [Client island imported by Server Component pages (no use client on page files)]

key-files:
  created: []
  modified:
    - src/components/HowItWorksButton.tsx
    - src/app/page.tsx
    - src/app/campaigns/page.tsx
    - src/app/join/[joinToken]/page.tsx
    - src/app/join/[joinToken]/availability/page.tsx

key-decisions:
  - "iconOnly prop added to HowItWorksButton post-verification — renders a 32px circled ? icon so the campaigns heading row stays compact alongside the matching log-out icon button"
  - "HowItWorksButton placed between heading block and log-out form in campaigns flex row — natural reading order (title | how-it-works | log out)"
  - "Player pages (join, availability) pass defaultRole='player' so modal opens pre-selected on the player perspective"

patterns-established:
  - "Client island pattern: 'use client' lives only in the leaf component (HowItWorksButton), Server Component pages import it without acquiring use client themselves"

requirements-completed: [HOW-01, HOW-02]

# Metrics
duration: 13min
completed: 2026-03-13
---

# Phase 19 Plan 01: How It Works Page Integration Summary

**HowItWorksButton wired into all four pages with defaultRole and iconOnly props, opening the modal pre-selected on the correct perspective per page**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-13T10:28:46Z
- **Completed:** 2026-03-13T10:42:28Z
- **Tasks:** 2 (1 auto + 1 human-verify)
- **Files modified:** 5

## Accomplishments

- Added `defaultRole?: 'dm' | 'player'` prop to HowItWorksButton, threaded through to HowItWorksModal so player-facing pages open the modal pre-selected on the player tab
- Wired HowItWorksButton into all four pages (home, campaigns, join, availability) with zero `use client` directives added to any page file — Client island pattern preserved
- Post-verification: added `iconOnly` prop to HowItWorksButton for a compact 32px circled `?` icon; refactored campaigns page heading row to use icon-only buttons for both How It Works and Log Out

## Task Commits

Each task was committed atomically:

1. **Task 1: Add defaultRole prop to HowItWorksButton and wire into all four pages** - `2894394` (feat)
2. **Post-verification refinement: Icon-only buttons for campaigns page** - `8c85221` (fix)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src/components/HowItWorksButton.tsx` - Added `defaultRole` and `iconOnly` props; iconOnly renders compact 32px circled ? icon
- `src/app/page.tsx` - HowItWorksButton added below Log In / Sign Up buttons with mt-6 spacing
- `src/app/campaigns/page.tsx` - HowItWorksButton (iconOnly) added in heading row between title and log-out icon
- `src/app/join/[joinToken]/page.tsx` - HowItWorksButton (defaultRole="player") added below JoinForm with mt-4 wrapper
- `src/app/join/[joinToken]/availability/page.tsx` - HowItWorksButton (defaultRole="player") added below AvailabilityForm with mt-6 wrapper

## Decisions Made

- **iconOnly prop:** Post-checkpoint human review found the text+icon button looked out of place in the campaigns heading row alongside other controls. Added `iconOnly` prop so the campaigns page renders a minimal 32px circled `?` that visually matches the log-out icon button — consistent icon-button language in the heading area.
- **Log-out also converted to icon:** To match the new iconOnly How It Works button, the campaigns log-out text link was replaced with a matching 32px circled arrow-right SVG icon. Both sit in a `flex gap-4` group on the right side of the header.
- **Client island pattern confirmed:** No page files gained `use client` — importing a Client Component (`'use client'`) from a Server Component page is the correct Next.js App Router boundary pattern.

## Deviations from Plan

### Post-checkpoint Refinements

**1. iconOnly prop added to HowItWorksButton**
- **Found during:** Human verification (Task 2)
- **Issue:** Text+icon button on campaigns page heading looked visually heavy alongside other heading controls
- **Fix:** Added `iconOnly` prop rendering a compact 32px circled ? button; updated campaigns page to use `<HowItWorksButton iconOnly />`; converted log-out to matching icon button for visual consistency
- **Files modified:** `src/components/HowItWorksButton.tsx`, `src/app/campaigns/page.tsx`
- **Committed in:** `8c85221` (separate user-driven commit post-verification)

---

**Total deviations:** 1 post-checkpoint refinement (user-driven UI polish, not an auto-fix)
**Impact on plan:** Positive — campaigns heading is now visually cleaner. HOW-02 requirement for a small `?` icon button is more precisely satisfied.

## Issues Encountered

None — TypeScript compiled without errors on first pass. All grep checks passed immediately.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- HOW-01 and HOW-02 fully satisfied — every user type can access the How It Works explainer from their landing page
- v1.4 Clarity & Polish milestone complete (Phases 17, 18, 19 all done)
- No open blockers

---
*Phase: 19-how-it-works-page-integration*
*Completed: 2026-03-13*
