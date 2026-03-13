---
phase: 21-scroll-animations
plan: 01
subsystem: ui
tags: [react, tailwind, intersection-observer, animation, hooks]

# Dependency graph
requires:
  - phase: 20-static-page-shell
    provides: Four landing section components (HeroSection, FeaturesBlock, PlayersSection, CtaSection)
provides:
  - useInView hook using native IntersectionObserver (src/hooks/useInView.ts)
  - Scroll-triggered fade+slide-up animation on all four landing page sections
  - prefers-reduced-motion support via motion-reduce:transition-none
affects: [22-features-step-selector, 23-availability-demo-widget, 24-sticky-nav-reveal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useInView pattern: generic IntersectionObserver hook that fires once via disconnect()"
    - "Animation pattern: opacity-0/translate-y-6 → opacity-100/translate-y-0 on section element using Tailwind transition classes"
    - "motion-reduce:transition-none on same element as transition — sections still appear, transitions disabled"

key-files:
  created:
    - src/hooks/useInView.ts
  modified:
    - src/components/landing/HeroSection.tsx
    - src/components/landing/FeaturesBlock.tsx
    - src/components/landing/PlayersSection.tsx
    - src/components/landing/CtaSection.tsx

key-decisions:
  - "threshold: 0 for HeroSection — above the fold, IO fires on mount so hero appears immediately"
  - "observer.disconnect() after first intersection — animations fire once only, no re-trigger on scroll back"
  - "No animation library added — native IntersectionObserver + Tailwind CSS transitions only, zero new dependencies"

patterns-established:
  - "useInView hook in src/hooks/ — reusable generic pattern for any future scroll-triggered feature"
  - "Section-level animation only — child elements untouched, animation lives on outermost section element"

requirements-completed: [ANIM-01, ANIM-02]

# Metrics
duration: 8min
completed: 2026-03-13
---

# Phase 21 Plan 01: Scroll Animations Summary

**Native IntersectionObserver hook + Tailwind fade/slide-up wired into all four landing sections with prefers-reduced-motion support and zero new dependencies**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-13T00:00:00Z
- **Completed:** 2026-03-13T00:08:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created generic `useInView` hook using native IntersectionObserver — fires once, cleans up on unmount
- Wired scroll-triggered fade+slide-up (opacity-0 → opacity-100, translate-y-6 → translate-y-0) into HeroSection, FeaturesBlock, PlayersSection, and CtaSection
- prefers-reduced-motion users see sections appear instantly with no animation via `motion-reduce:transition-none`
- Build passes with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useInView hook** - `111e93d` (feat)
2. **Task 2: Wire animations into all four section components** - `3937c1b` (feat)

## Files Created/Modified

- `src/hooks/useInView.ts` - Generic IntersectionObserver hook, exports useInView, fires once via disconnect()
- `src/components/landing/HeroSection.tsx` - Added 'use client', useInView (threshold 0), animation classes on section
- `src/components/landing/FeaturesBlock.tsx` - Added 'use client', useInView (threshold 0.1), animation classes on section
- `src/components/landing/PlayersSection.tsx` - Added 'use client', useInView (threshold 0.1), animation classes on section
- `src/components/landing/CtaSection.tsx` - Added 'use client', useInView (threshold 0.15), animation classes on section

## Decisions Made

- HeroSection uses threshold 0 so the IntersectionObserver fires immediately on mount — hero is above the fold and should appear right away, not wait for a scroll event
- `observer.disconnect()` called inside the intersection callback — animations are one-shot, sections don't flicker if user scrolls up and back down
- Zero new npm dependencies — Tailwind's transition utilities handle the CSS animation, native browser API handles the observation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four landing sections animate in correctly on scroll
- useInView hook is available for reuse in any future phase
- Phase 22 (Features Step-Selector) can use useInView if needed; FeaturesBlock already has 'use client' in place

---
*Phase: 21-scroll-animations*
*Completed: 2026-03-13*
