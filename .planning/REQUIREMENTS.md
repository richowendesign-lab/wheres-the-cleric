# Requirements: D&D Session Planner

**Defined:** 2026-03-13
**Core Value:** The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.

## v1.5 Requirements

Requirements for the Marketing Home Page milestone. Each maps to roadmap phases.

### Navigation

- [x] **NAV-01**: Visitor sees a sticky nav with the app logo, "Beta" badge, and Sign up / Log in buttons on every page scroll position
- [ ] **NAV-02**: Nav background transitions from transparent to dark opaque when visitor scrolls past the hero

### Hero

- [x] **HERO-01**: Visitor sees a hero section with the app icon, large heading, subtitle copy, and Sign up / Log in CTA buttons
- [ ] **HERO-02**: Visitor can interact with an embedded DM dashboard demo showing a mock campaign with placeholder player data and best-day recommendations

### Features Section

- [x] **FEAT-01**: Visitor sees a "Simple scheduling for your next game" section with descriptive copy
- [ ] **FEAT-02**: Visitor can click any of the 4 step cards; the selected step is highlighted, its description text expands, and a paired illustration image is shown
- [x] **FEAT-03**: Step 1 is active by default on page load

### Easy for Players Section

- [x] **PLAY-01**: Visitor sees an "Easy for players" section with a 3-card grid explaining the player onboarding flow
- [ ] **PLAY-02**: Visitor can interact with an embedded player availability demo using placeholder data, with a planning window computed from the current date

### CTA & Footer

- [x] **CTA-01**: Visitor sees a final "Ready to plan your next adventure?" section with Sign up / Log in buttons
- [x] **CTA-02**: Visitor sees a footer with copyright text

### Animations

- [x] **ANIM-01**: Each page section (Hero, Features, Easy for Players, CTA) animates in with a fade + slide-up as it enters the viewport
- [x] **ANIM-02**: Animations are suppressed for visitors with `prefers-reduced-motion` enabled

### Integrity

- [x] **INT-01**: Logged-in DMs visiting `/` are still redirected to `/campaigns` — landing page renders only for logged-out visitors

## Future Requirements

### Possible v1.6+

- **DEMO-01**: Demo embed allows DM to see live player count update as demo players respond
- **SEO-01**: Landing page has structured metadata, og:image, and canonical URL
- **RESP-01**: Landing page is fully responsive for mobile and tablet viewports

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real demo campaign with live data | Requires auth and DB — demo is self-contained with mock data only |
| Video walkthrough / screen recording | High production effort, static demo serves the same purpose |
| A/B testing on hero copy | No analytics infrastructure in place |
| Mobile-responsive landing page | Defer to v1.6 — desktop-first for now |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 20 | Complete |
| NAV-02 | Phase 24 | Pending |
| HERO-01 | Phase 20 | Complete |
| HERO-02 | Phase 23 | Pending |
| FEAT-01 | Phase 20 | Complete |
| FEAT-02 | Phase 22 | Pending |
| FEAT-03 | Phase 20 | Complete |
| PLAY-01 | Phase 20 | Complete |
| PLAY-02 | Phase 23 | Pending |
| CTA-01 | Phase 20 | Complete |
| CTA-02 | Phase 20 | Complete |
| ANIM-01 | Phase 21 | Complete |
| ANIM-02 | Phase 21 | Complete |
| INT-01 | Phase 20 | Complete |

**Coverage:**
- v1.5 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap creation*
