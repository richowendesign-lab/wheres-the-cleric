---
phase: 22-features-step-selector
plan: 01
subsystem: ui
tags: [react, nextjs, useState, tailwindcss, landing-page, interactive]

# Dependency graph
requires:
  - phase: 21-scroll-animations
    provides: useInView hook and scroll fade+slide-up animation on FeaturesBlock section
  - phase: 20-static-page-shell
    provides: FeaturesBlock.tsx static HTML/CSS shell with four hard-coded step cards
provides:
  - FeaturesBlock interactive step-selector with useState click interactivity
  - steps array (data-driven, 1-indexed) replacing four static card divs
  - Dynamic illustration src (/features-step-${activeStep}.png) derived from state
affects: [23-players-screenshot, 24-nav-cta-reveal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useState for UI selection state: single integer (1-indexed) drives all conditional rendering"
    - "Data-driven card map: steps array defined above component, .map() inside JSX with derived isActive boolean"
    - "Conditional Tailwind classes via array.join(' '): avoids template literal noise for multi-class toggling"

key-files:
  created: []
  modified:
    - src/components/landing/FeaturesBlock.tsx

key-decisions:
  - "useState(1) not useState(0) — step ids are 1-indexed to match image filenames (features-step-1.png etc.)"
  - "steps array defined above component (module scope) not inside — avoids recreation on every render"
  - "Plain <img> kept (not Next.js <Image>) — consistent with Phase 20 decision; dynamic src requires no additional config"
  - "opacity-60 on inactive cards without pointer-events-none — inactive cards must remain clickable"

patterns-established:
  - "Interactive step-selector: one useState integer drives badge colour, card opacity, description visibility, and image src"

requirements-completed: [FEAT-02]

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 22 Plan 01: Features Step-Selector Summary

**FeaturesBlock converted from static four-card shell to fully interactive useState step-selector with dynamic badge colours, description toggling, and illustration swap on click**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-13T18:27:36Z
- **Completed:** 2026-03-13T18:32:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced four hard-coded static card divs with a data-driven `steps.map()` driven by a `steps` array defined above the component
- Added `useState(1)` to track active step — clicking any card calls `setActiveStep(step.id)`
- Active card renders dark purple badge (`bg-[#572182] text-white`), full opacity, and description paragraph; inactive cards render light badge (`bg-[#ba7df6] text-black`), `opacity-60`, no description
- Dynamic image src `features-step-${activeStep}.png` replaces hard-coded `/features-step-1.png`
- Phase 21 scroll animation (`useInView`, `transition-all`, `translate-y-6` → `translate-y-0`) preserved intact and unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite FeaturesBlock.tsx with useState step-selector** - `0d829ef` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `src/components/landing/FeaturesBlock.tsx` - Rewritten with useState step-selector; steps array above component; steps.map() with conditional isActive rendering; dynamic img src

## Decisions Made
- `useState(1)` (not `useState(0)`) because step IDs are 1-indexed to match `/features-step-1.png` through `/features-step-4.png`
- `steps` array placed at module scope above the component to avoid recreation on every render
- Plain `<img>` tag kept (not Next.js `<Image>`) — consistent with Phase 20 decision for landing page illustrations
- `opacity-60` applied to inactive cards without `pointer-events-none` — inactive cards must stay clickable

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — TypeScript compiled clean on first attempt with no errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- FeaturesBlock is now fully interactive; FEAT-02 satisfied
- Phase 23 (players screenshot) and Phase 24 (nav CTA reveal) can proceed independently
- The four `/features-step-N.png` images in `/public/` were already present from Phase 20

---
*Phase: 22-features-step-selector*
*Completed: 2026-03-13*

## Self-Check: PASSED

- [x] `src/components/landing/FeaturesBlock.tsx` — exists
- [x] `22-01-SUMMARY.md` — exists
- [x] Commit `0d829ef` — found in git log
