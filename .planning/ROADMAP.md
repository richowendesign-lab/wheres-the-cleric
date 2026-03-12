# Roadmap: D&D Session Planner

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-02-26)
- ✅ **v1.1 Simplified Onboarding** — Phases 5-7 (shipped 2026-03-02)
- ✅ **v1.2 Multi-Campaign DM** — Phases 8-10 (shipped 2026-03-05)
- ✅ **v1.3 DM Experience & Scheduling Flow** — Phases 11-16 (shipped 2026-03-12)
- 🚧 **v1.4 Clarity & Polish** — Phases 17-19 (in progress)

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

### 🚧 v1.4 Clarity & Polish (In Progress)

**Milestone Goal:** Surface information the calendar already has (DM unavailability, empty date states) and give every user a way to understand the app without reading documentation.

- [ ] **Phase 17: Calendar & Panel Clarity** — Legend shows DM unavailable swatch; date panel shows DM blocked indicator and a clear empty state when no players are free
- [ ] **Phase 18: How It Works Modal** — Standalone HowItWorksModal and HowItWorksButton components built and verified in isolation; native dialog with focus trap
- [ ] **Phase 19: How It Works Page Integration** — HowItWorksButton wired into all four pages (home, campaigns, join, availability)

## Phase Details

### Phase 17: Calendar & Panel Clarity
**Goal**: The Group Availability calendar and date panel accurately communicate all availability state — including DM unavailability and the absence of any free players — so the DM never misreads a date.
**Depends on**: Phase 16 (CampaignTabs.tsx is the target file; no data changes needed)
**Requirements**: CLAR-01, CLAR-02, CLAR-03
**Success Criteria** (what must be TRUE):
  1. When the DM has marked at least one unavailable date, a DM unavailable colour swatch appears in the calendar legend; when no dates are marked the swatch is absent
  2. Clicking a DM-marked date in the Group Availability calendar shows a DM unavailable indicator in the date side panel alongside normal player rows
  3. When a date has zero free players, the date panel shows a single clear "No players available" message rather than listing every player as "no response"
**Plans**: TBD

Plans:
- [ ] 17-01: TBD

### Phase 18: How It Works Modal
**Goal**: A self-contained, accessible "How it works" modal component exists and works correctly in isolation — with proper focus trap, keyboard dismiss, and step-card content for both DM and player perspectives — before being added to any page.
**Depends on**: Nothing (new component, no page wiring yet)
**Requirements**: HOW-03, HOW-04
**Success Criteria** (what must be TRUE):
  1. The modal displays numbered step cards covering the DM workflow and the player workflow in a single scrollable view
  2. Pressing Escape closes the modal from any focused element inside it
  3. Clicking the backdrop closes the modal
  4. Focus is trapped inside the modal while open — tabbing does not reach elements behind it
  5. Opening and closing the modal does not change the URL or browser history
**Plans**: TBD

Plans:
- [ ] 18-01: TBD

### Phase 19: How It Works Page Integration
**Goal**: Every user — whether a prospective DM on the home page, an active DM on the campaigns page, or a player on the join or availability page — can open the "How it works" explainer from the page they are currently on.
**Depends on**: Phase 18 (HowItWorksButton and HowItWorksModal must be complete)
**Requirements**: HOW-01, HOW-02
**Success Criteria** (what must be TRUE):
  1. A "How it works" trigger is visible on the logged-out home page (/) and opens the modal
  2. A small "?" icon button in the campaigns page heading (/campaigns) opens the modal without navigating away
  3. A "How it works" trigger is present on the player join page (/join/[joinToken]) and opens the modal
  4. A "How it works" trigger is present on the player availability page (/join/[joinToken]/availability) and opens the modal
  5. None of the four pages gain a "use client" directive as a result of adding the trigger
**Plans**: TBD

Plans:
- [ ] 19-01: TBD

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
| 17. Calendar & Panel Clarity | v1.4 | 0/TBD | Not started | - |
| 18. How It Works Modal | v1.4 | 0/TBD | Not started | - |
| 19. How It Works Page Integration | v1.4 | 0/TBD | Not started | - |
