---
phase: 20-static-page-shell
plan: "02"
subsystem: ui
tags: [next.js, react, server-component, auth, landing-page]

# Dependency graph
requires:
  - phase: 20-01
    provides: LandingPage component (src/components/LandingPage.tsx) with all marketing sections
provides:
  - src/app/page.tsx wired to render LandingPage for logged-out visitors
  - Auth guard preserved — logged-in DMs redirected to /campaigns
  - Full marketing landing page live at /
affects: [20-static-page-shell, 22-features-step-selector, 24-nav-scroll-reveal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component auth guard: getSessionDM() → redirect('/campaigns') as first two lines of default export"
    - "page.tsx as thin Server Component — imports Client Component for rendering, never gains 'use client'"

key-files:
  created: []
  modified:
    - src/app/page.tsx

key-decisions:
  - "page.tsx must never gain 'use client' — auth redirect guard stays as first lines of default export"
  - "All prior page content (HowItWorksButton, centered layout, dnd-icon) removed — rendering delegated entirely to LandingPage component"

patterns-established:
  - "Server Component boundary: page.tsx handles auth + redirect, delegates all rendering to a Client Component"

requirements-completed: [INT-01]

# Metrics
duration: 15min
completed: 2026-03-13
---

# Phase 20 Plan 02: Rewire page.tsx — Auth Guard + LandingPage Summary

**page.tsx replaced with a 9-line Server Component that runs auth guard then renders LandingPage, putting the full marketing landing page live at / for logged-out visitors**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-13T00:00:00Z
- **Completed:** 2026-03-13T00:00:00Z
- **Tasks:** 2 (1 auto + 1 human-verify)
- **Files modified:** 1

## Accomplishments

- Rewired `src/app/page.tsx` to delegate all rendering to the `LandingPage` component
- Auth guard preserved verbatim — `getSessionDM()` + `redirect('/campaigns')` as first two lines of the function body
- All prior page content removed: `HowItWorksButton`, centered layout, `dnd-icon` Image, `Link` imports
- Human verification confirmed all six sections render correctly: sticky nav, hero, features, easy for players, CTA, footer
- TypeScript compiled without errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewire page.tsx — auth guard + LandingPage** - `42f3ffa` (feat)
2. **Task 2: Verify landing page renders correctly at /** - human-verify (approved, no commit)

## Files Created/Modified

- `src/app/page.tsx` — Replaced old centered layout with auth guard + `<LandingPage />` render; 9 lines total, no `'use client'`

## Decisions Made

- Removed all prior content from `page.tsx` (HowItWorksButton, centered `<main>`, dnd-icon Image, Link imports) — all rendering responsibility now lives inside the LandingPage component
- Kept `page.tsx` as a pure async Server Component to preserve auth redirect correctness

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full marketing landing page is live at `/` — Phase 20 complete
- Phase 21 (Availability Demo Widget) can begin; it will add the interactive availability demo into the hero or features section
- Phase 22 (Features Step-Selector) will add interactivity to FeaturesBlock — screenshot assets for steps 2–4 must be captured from the live app first (existing blocker in STATE.md)
- Phase 24 (Nav Scroll Reveal) will reveal the nav CTA buttons currently hidden via `opacity-0 pointer-events-none`

## Self-Check: PASSED

- FOUND: `.planning/phases/20-static-page-shell/20-02-SUMMARY.md`
- FOUND: commit `42f3ffa` (feat(20-02): rewire page.tsx — auth guard + LandingPage)

---
*Phase: 20-static-page-shell*
*Completed: 2026-03-13*
