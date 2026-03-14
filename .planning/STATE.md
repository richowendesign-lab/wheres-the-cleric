---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Marketing Home Page
status: in_progress
last_updated: "2026-03-13T00:10:00Z"
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.
**Current focus:** Phase 24 — Sticky Nav Scroll Behaviour

## Current Position

Phase: 24 of 24 (Sticky Nav Scroll Behaviour)
Plan: 0 of 2 in current phase
Status: In progress
Last activity: 2026-03-14 — Completed Phase 23 (Availability Demo — HERO-02 and PLAY-02 satisfied, human verified interactive demos and scroll zoom)

Progress: [████████████░░░░░░░░] 0/5 v1.5 phases complete (Phase 21 complete — 2/2 plans done)

## Pending Todos

None.

## Blockers/Concerns

- [Phase 22 prerequisite]: Screenshot assets for 4 FeaturesBlock steps must be captured from the live app before Phase 22 (Features Step-Selector) implementation begins.

## Accumulated Context

- Phases 1–19 completed across v1.0–v1.4 milestones
- v1.5 phases 20-24 defined; roadmap written
- Zero new dependencies for v1.5 — animations via IntersectionObserver + Tailwind CSS transitions only
- AvailabilityDemoWidget must use hardcoded placeholder dates, not new Date(), to avoid SSR hydration mismatch
- page.tsx must never gain 'use client' — auth redirect guard stays as first lines of default export
- Logo asset is Logo.svg (capital L) in /public — reference as /Logo.svg in src
- Nav CTA buttons present in DOM but hidden via opacity-0 pointer-events-none — Phase 24 reveals on scroll
- FeaturesBlock is now a fully interactive step-selector (useState(1), steps.map(), dynamic img src) — FEAT-02 satisfied
- Landing sub-components split into src/components/landing/ directory (one file per section)
- useInView hook at src/hooks/useInView.ts — native IntersectionObserver, fires once via disconnect(), reusable across phases
- All four landing sections use 'use client' + useInView; HeroSection threshold 0 (above fold), others 0.1/0.15
- Decisions: threshold 0 for HeroSection (fires on mount); observer.disconnect() for one-shot animation; no animation library added
- Phase 22: useState(1) (1-indexed to match image filenames); steps array at module scope; plain <img> kept (not Next.js Image); opacity-60 on inactive cards without pointer-events-none
- Phase 23-01: useScrollInView hook created — continuous bidirectional IntersectionObserver, no disconnect() in callback; HeroDemoWidget + PlayerDemoWidget self-contained with hardcoded mock data; DAY_AGGREGATIONS at module scope; PlayerDemoWidget Fri+Sat pre-selected
- Phase 23-02: HeroDemoWidget wired into HeroSection and PlayerDemoWidget into PlayersSection (replaced static screenshots); useScrollInView returns 0-1 progress value; demos scale 1.0→1.5 and fade 0.5→1.0 on scroll; human verified calendar clicks, day toggles, scroll zoom, bidirectional reversal — HERO-02 and PLAY-02 complete
