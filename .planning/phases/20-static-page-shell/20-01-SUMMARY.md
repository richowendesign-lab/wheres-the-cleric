---
phase: 20-static-page-shell
plan: 01
subsystem: ui
tags: [react, nextjs, tailwind, landing-page, components]

# Dependency graph
requires: []
provides:
  - src/components/LandingPage.tsx — 'use client' component composing all landing sections
  - src/components/landing/StickyNav.tsx — sticky nav with logo, Beta badge, hidden CTA buttons
  - src/components/landing/HeroSection.tsx — hero with icon, heading, subtitle, CTAs, screenshot
  - src/components/landing/FeaturesBlock.tsx — 4-step block, step 1 active (static, no useState)
  - src/components/landing/PlayersSection.tsx — 3-card grid with players screenshot
  - src/components/landing/CtaSection.tsx — bottom CTA with icon, heading, buttons
  - src/components/landing/Footer.tsx — copyright footer
  - public/Logo.svg, features-step-{1-4}.png, hero-screenshot.png, players-screenshot.png
affects: [20-02-page-wiring, 22-features-step-selector, 24-scroll-animations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Landing sub-components split into src/components/landing/ to keep files under 200 lines
    - Plain <img> for static public assets (logo, features PNGs, screenshots); next/image only for dnd-icon.png
    - Nav CTA buttons present in DOM but hidden via opacity-0 pointer-events-none (Phase 24 reveals on scroll)
    - No useState in FeaturesBlock — Phase 20 is fully static; Phase 22 adds step-click interactivity

key-files:
  created:
    - src/components/LandingPage.tsx
    - src/components/landing/StickyNav.tsx
    - src/components/landing/HeroSection.tsx
    - src/components/landing/FeaturesBlock.tsx
    - src/components/landing/PlayersSection.tsx
    - src/components/landing/CtaSection.tsx
    - src/components/landing/Footer.tsx
  modified: []

key-decisions:
  - "Used /Logo.svg (capital L) to match actual filename in /public — plan spec used lowercase"
  - "hero-screenshot.png and players-screenshot.png were available so rendered as real images, not styled placeholders"
  - "FeaturesBlock hard-codes step 1 active state with no useState — interactivity deferred to Phase 22"

patterns-established:
  - "Landing sub-component split: one file per section in src/components/landing/"
  - "Nav scroll-reveal pattern: buttons present in DOM with opacity-0 pointer-events-none, Phase 24 removes those classes on scroll"

requirements-completed: [NAV-01, HERO-01, FEAT-01, FEAT-03, PLAY-01, CTA-01, CTA-02]

# Metrics
duration: 2min
completed: 2026-03-13
---

# Phase 20 Plan 01: Static Page Shell Summary

**Full LandingPage client component with StickyNav, HeroSection, FeaturesBlock (step 1 hard-coded active), PlayersSection, CtaSection, and Footer — 7 files, zero TypeScript errors**

## Performance

- **Duration:** ~2 min (Task 1 was human-action checkpoint; Task 2 automated)
- **Started:** 2026-03-13T16:14:37Z
- **Completed:** 2026-03-13T16:16:48Z
- **Tasks:** 2 (1 human-action + 1 auto)
- **Files modified:** 7 created

## Accomplishments
- All 6 landing section components created in src/components/landing/
- LandingPage.tsx composes them as a 'use client' boundary ready for page.tsx wiring in Plan 02
- All 7 public assets confirmed present (Logo.svg, features-step-1..4.png, hero-screenshot.png, players-screenshot.png)
- TypeScript compiles clean with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Provide asset files** - `(human-action checkpoint — user placed files in /public)`
2. **Task 2: Build LandingPage client component** - `1c009f7` (feat)

**Plan metadata:** *(docs commit follows)*

## Files Created/Modified
- `src/components/LandingPage.tsx` - 'use client' root component composing all sections
- `src/components/landing/StickyNav.tsx` - Sticky header with Logo.svg, Beta badge, hidden nav buttons
- `src/components/landing/HeroSection.tsx` - Hero section with dnd-icon, heading, subtitle, CTAs, hero screenshot
- `src/components/landing/FeaturesBlock.tsx` - 4-step features section, step 1 active (no useState)
- `src/components/landing/PlayersSection.tsx` - Player benefits section with 3-card grid and players screenshot
- `src/components/landing/CtaSection.tsx` - Bottom CTA section with dnd-icon, heading, buttons
- `src/components/landing/Footer.tsx` - Copyright footer text

## Decisions Made
- Logo filename is `Logo.svg` (capital L) in /public — referenced as `/Logo.svg` in src. Plan spec used lowercase but actual asset has capital L.
- Both screenshot assets (hero-screenshot.png and players-screenshot.png) were available so rendered as real `<img>` elements rather than styled placeholder divs.
- FeaturesBlock has no useState — step 1 active state is fully hard-coded HTML/CSS. Phase 22 will add click interactivity.

## Deviations from Plan

None - plan executed exactly as written (aside from capital-L logo filename which matched the actual file).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- LandingPage component is complete and ready for Plan 02 to import into src/app/page.tsx
- page.tsx currently contains the auth redirect guard (getSessionDM + redirect to /campaigns) — Plan 02 wires LandingPage below that guard
- Phase 22 (FeaturesBlock step-click interactivity) can proceed once page is live
- Phase 24 (scroll animations + nav reveal) depends on LandingPage being rendered in production

---
*Phase: 20-static-page-shell*
*Completed: 2026-03-13*
