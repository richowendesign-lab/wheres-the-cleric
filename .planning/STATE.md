---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Marketing Home Page
status: in_progress
last_updated: "2026-03-13"
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
**Current focus:** Phase 20 — Static Page Shell

## Current Position

Phase: 20 of 24 (Static Page Shell)
Plan: 2 of 2 in current phase (20-02 complete — phase 20 done)
Status: In progress
Last activity: 2026-03-13 — Completed 20-02 (page.tsx rewired — landing page live at /)

Progress: [████████████░░░░░░░░] 0/5 v1.5 phases complete (Phase 20 complete — 2/2 plans done)

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
- FeaturesBlock step 1 active state is hard-coded HTML/CSS (no useState) — Phase 22 adds interactivity
- Landing sub-components split into src/components/landing/ directory (one file per section)
