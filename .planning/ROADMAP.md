# Roadmap: D&D Session Planner

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-02-26)
- ✅ **v1.1 Simplified Onboarding** — Phases 5-7 (shipped 2026-03-02)
- ✅ **v1.2 Multi-Campaign DM** — Phases 8-10 (shipped 2026-03-05)
- ✅ **v1.3 DM Experience & Scheduling Flow** — Phases 11-16 (shipped 2026-03-12)
- ✅ **v1.4 Clarity & Polish** — Phases 17-19 (shipped 2026-03-13)
- 🚧 **v1.5 Marketing Home Page** — Phases 20-24 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-02-26</summary>

- [x] **Phase 1: Foundation** — App skeleton, data models, routing, and deployment pipeline (3/3 plans) — completed 2026-02-24
- [x] **Phase 2: Campaign** — DM creates a campaign and generates unique persistent invite links per player (3/3 plans) — completed 2026-02-24
- [x] **Phase 3: Availability** — Players access their invite link and submit their availability (4/4 plans) — completed 2026-02-26
- [x] **Phase 4: Dashboard** — DM sees group availability, highlights, missing players, and best-day recommendations (4/4 plans) — completed 2026-02-26

Full phase details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Simplified Onboarding (Phases 5-7) — SHIPPED 2026-03-02</summary>

- [x] **Phase 5: Schema Migration** — Wipe v1.0 schema and apply new data model supporting single join link and self-registration (4/4 plans) — completed 2026-03-02
- [x] **Phase 6: Campaign Creation** — DM creates campaign with only a date range, receives single shareable join link, remembered as owner (2/2 plans) — completed 2026-03-02
- [x] **Phase 7: Join Flow** — Smart join link routes new visitors to name entry, returning players to availability, returning DMs to dashboard (2/2 plans) — completed 2026-03-02

Full phase details: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 Multi-Campaign DM (Phases 8-10) — SHIPPED 2026-03-05</summary>

- [x] **Phase 8: DM Auth** — DM can create an account and log in with email and password, with session persisting across browser refreshes (4/4 plans) — completed 2026-03-04
- [x] **Phase 9: Campaign Fields and Join Cap** — Campaign creation captures name, description, and max players; join link enforces the player cap (2/2 plans) — completed 2026-03-04
- [x] **Phase 10: Multi-Campaign Dashboard** — DM home page shows all their campaigns as cards with a button to create a new one (1/1 plan) — completed 2026-03-05

Full phase details: `.planning/milestones/v1.2-ROADMAP.md`

</details>

<details>
<summary>✅ v1.3 DM Experience & Scheduling Flow (Phases 11-16) — SHIPPED 2026-03-12</summary>

- [x] **Phase 11: Schema Foundation + Calendar Utilities** — Add DmAvailabilityException model and dmExceptionMode to Campaign; extract buildMonthGrid/formatDateKey to calendarUtils.ts (2/2 plans) — completed 2026-03-09
- [x] **Phase 12: Share Modal** — Post-creation modal with one-click join link copy and pre-written invite message; ?share=1 URL param trigger pattern (2/2 plans) — completed 2026-03-09
- [x] **Phase 13: DM Availability Exceptions** — Click-to-toggle calendar for marking DM-unavailable dates; block/flag mode toggle; dmBlocked in DayAggregation (2/2 plans) — completed 2026-03-10
- [x] **Phase 14: Dashboard Redesign** — Adaptive calendar with prev/next navigation, ranked best-day list alongside, campaign details de-emphasised in Settings tab (4/4 plans) — completed 2026-03-11
- [x] **Phase 15: Shareable Best Dates** — CopyBestDatesButton icon adjacent to Best Days title; formatted top-3 best-dates message (2/2 plans) — completed 2026-03-11
- [x] **Phase 16: Custom Date Picker** — Hand-rolled themed picker using hidden input pattern; typed date entry and keyboard month navigation (2/2 plans) — completed 2026-03-11

Full phase details: `.planning/milestones/v1.3-ROADMAP.md`

</details>

<details>
<summary>✅ v1.4 Clarity & Polish (Phases 17-19) — SHIPPED 2026-03-13</summary>

- [x] **Phase 17: Calendar & Panel Clarity** — DM unavailable legend swatch, exclamation-circle panel indicator, and "No players available" empty state in CampaignTabs.tsx (1/1 plan) — completed 2026-03-13
- [x] **Phase 18: How It Works Modal** — Standalone HowItWorksModal + HowItWorksButton with native dialog focus trap and step cards for DM and player workflows (1/1 plan) — completed 2026-03-13
- [x] **Phase 19: How It Works Page Integration** — HowItWorksButton wired into home, campaigns, join, and availability pages; icon-only button grouped with logout on campaigns page (1/1 plan) — completed 2026-03-13

Full phase details: `.planning/milestones/v1.4-ROADMAP.md`

</details>

### 🚧 v1.5 Marketing Home Page (In Progress)

**Milestone Goal:** Redesign the logged-out home page into a marketing landing page that converts first-time visitors into DM sign-ups.

- [x] **Phase 20: Static Page Shell** - Full-page layout with sticky nav, hero, features section, player section, CTA, and footer; auth redirect preserved (completed 2026-03-13)
- [ ] **Phase 21: Scroll Animations** - All sections fade and slide up on viewport entry; reduced-motion respected
- [ ] **Phase 22: Features Step-Selector** - Interactive 4-step FeaturesBlock with click-to-highlight and image swap
- [ ] **Phase 23: Availability Demo** - Self-contained interactive player availability demo embedded in hero and player sections
- [ ] **Phase 24: Sticky Nav Scroll Behaviour** - Nav background transitions from transparent to dark opaque on scroll

## Phase Details

### Phase 20: Static Page Shell
**Goal**: Logged-out visitors see a complete, readable marketing landing page with all content sections and working CTAs; logged-in DMs are still redirected to /campaigns
**Depends on**: Phase 19
**Requirements**: NAV-01, HERO-01, FEAT-01, FEAT-03, PLAY-01, CTA-01, CTA-02, INT-01
**Success Criteria** (what must be TRUE):
  1. Logged-out visitor sees sticky nav with logo, "Beta" badge, Sign up and Log in buttons on every scroll position
  2. Visitor sees hero section with app icon, heading, subtitle, and Sign up / Log in CTA buttons
  3. Visitor sees a "Simple scheduling for your next game" features section with Step 1 active by default
  4. Visitor sees an "Easy for players" section with a 3-card onboarding grid
  5. Visitor sees a final CTA section and footer; logged-in DM visiting / is redirected to /campaigns
**Plans**: 2 plans
Plans:
- [ ] 20-01-PLAN.md — Save static assets + build LandingPage client component with all sections
- [ ] 20-02-PLAN.md — Rewire page.tsx: auth guard + LandingPage render + human verify

### Phase 21: Scroll Animations
**Goal**: Every major section animates smoothly into view as the visitor scrolls, with no motion for users who have requested it
**Depends on**: Phase 20
**Requirements**: ANIM-01, ANIM-02
**Success Criteria** (what must be TRUE):
  1. Each section (Hero, Features, Easy for Players, CTA) fades and slides up when it enters the viewport
  2. Visitor with prefers-reduced-motion enabled sees sections appear without animation
**Plans**: TBD

### Phase 22: Features Step-Selector
**Goal**: Visitors can explore the four scheduling steps interactively, seeing an expanded description and paired illustration for each step
**Depends on**: Phase 20
**Requirements**: FEAT-02
**Success Criteria** (what must be TRUE):
  1. Clicking any step card highlights it and expands its description text
  2. Clicking a step swaps the accompanying illustration image to match that step
  3. Only one step is active at a time; switching to a new step deactivates the previous one
**Plans**: TBD

### Phase 23: Availability Demo
**Goal**: Visitors can interact with a live-feeling player availability demo that shows what filling in availability looks like — with no auth, no DB, and no navigation required
**Depends on**: Phase 20
**Requirements**: HERO-02, PLAY-02
**Success Criteria** (what must be TRUE):
  1. Visitor can interact with a demo embed in the hero area showing a mock campaign with placeholder player data and best-day recommendations
  2. Visitor can interact with a demo embed in the "Easy for players" section showing the player availability view with a planning window based on placeholder dates
  3. Both demo embeds function without requiring login, creating a session, or making any server requests
**Plans**: TBD

### Phase 24: Sticky Nav Scroll Behaviour
**Goal**: The nav feels polished and always legible — transparent over the hero image, then solidly dark once the visitor scrolls into content
**Depends on**: Phase 20
**Requirements**: NAV-02
**Success Criteria** (what must be TRUE):
  1. Nav background is transparent when the visitor is at the top of the page
  2. Nav background transitions to dark opaque when the visitor scrolls past the hero
  3. Nav remains readable and above all other page content at all scroll positions
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-02-24 |
| 2. Campaign | v1.0 | 3/3 | Complete | 2026-02-24 |
| 3. Availability | v1.0 | 4/4 | Complete | 2026-02-26 |
| 4. Dashboard | v1.0 | 4/4 | Complete | 2026-02-26 |
| 5. Schema Migration | v1.1 | 4/4 | Complete | 2026-03-02 |
| 6. Campaign Creation | v1.1 | 2/2 | Complete | 2026-03-02 |
| 7. Join Flow | v1.1 | 2/2 | Complete | 2026-03-02 |
| 8. DM Auth | v1.2 | 4/4 | Complete | 2026-03-04 |
| 9. Campaign Fields and Join Cap | v1.2 | 2/2 | Complete | 2026-03-04 |
| 10. Multi-Campaign Dashboard | v1.2 | 1/1 | Complete | 2026-03-05 |
| 11. Schema Foundation + Calendar Utilities | v1.3 | 2/2 | Complete | 2026-03-09 |
| 12. Share Modal | v1.3 | 2/2 | Complete | 2026-03-09 |
| 13. DM Availability Exceptions | v1.3 | 2/2 | Complete | 2026-03-10 |
| 14. Dashboard Redesign | v1.3 | 4/4 | Complete | 2026-03-11 |
| 15. Shareable Best Dates | v1.3 | 2/2 | Complete | 2026-03-11 |
| 16. Custom Date Picker | v1.3 | 2/2 | Complete | 2026-03-11 |
| 17. Calendar & Panel Clarity | v1.4 | 1/1 | Complete | 2026-03-13 |
| 18. How It Works Modal | v1.4 | 1/1 | Complete | 2026-03-13 |
| 19. How It Works Page Integration | v1.4 | 1/1 | Complete | 2026-03-13 |
| 20. Static Page Shell | 2/2 | Complete   | 2026-03-13 | - |
| 21. Scroll Animations | v1.5 | 0/? | Not started | - |
| 22. Features Step-Selector | v1.5 | 0/? | Not started | - |
| 23. Availability Demo | v1.5 | 0/? | Not started | - |
| 24. Sticky Nav Scroll Behaviour | v1.5 | 0/? | Not started | - |
