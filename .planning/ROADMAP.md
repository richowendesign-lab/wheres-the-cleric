# Roadmap: D&D Session Planner

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-02-26)
- ✅ **v1.1 Simplified Onboarding** — Phases 5-7 (shipped 2026-03-02)
- ✅ **v1.2 Multi-Campaign DM** — Phases 8-10 (shipped 2026-03-05)
- ✅ **v1.3 DM Experience & Scheduling Flow** — Phases 11-16 (shipped 2026-03-12)
- ✅ **v1.4 Clarity & Polish** — Phases 17-19 (shipped 2026-03-13)
- ✅ **v1.5 Marketing Home Page** — Phases 20-24 (shipped 2026-03-14)
- 🚧 **v1.6 Campaign Detail Rework** — Phases 25-27 (in progress)

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

<details>
<summary>✅ v1.5 Marketing Home Page (Phases 20-24) — SHIPPED 2026-03-14</summary>

- [x] **Phase 20: Static Page Shell** (2/2 plans) — completed 2026-03-13
- [x] **Phase 21: Scroll Animations** (2/2 plans) — completed 2026-03-13
- [x] **Phase 22: Features Step-Selector** (2/2 plans) — completed 2026-03-13
- [x] **Phase 23: Availability Demo** (2/2 plans) — completed 2026-03-14
- [x] **Phase 24: Sticky Nav Scroll Behaviour** (1/1 plan) — completed 2026-03-14

Full phase details: `.planning/milestones/v1.5-ROADMAP.md`

</details>

### 🚧 v1.6 Campaign Detail Rework (In Progress)

**Milestone Goal:** Improve the campaign detail page with a better layout, cleaner settings, and synced DM availability.

- [x] **Phase 25: Sync Schema and Server Layer** — Add dmSyncEnabled to Campaign schema; extend toggleDmException to propagate to sync-enabled sibling campaigns (completed 2026-03-17)
- [ ] **Phase 26: Two-Column Layout Restructure** — Restructure CampaignTabs to own a two-column availability layout; sidebar shows Best Days and join link; date panel becomes a sidebar content swap
- [ ] **Phase 27: Flat Settings and Sync Toggle** — Remove accordion wrappers from Settings; add DmSyncToggle component to Settings tab

## Phase Details

### Phase 25: Sync Schema and Server Layer
**Goal**: DM availability exceptions automatically propagate to all their sync-enabled campaigns when they mark or unmark a date
**Depends on**: Phase 24
**Requirements**: SYNC-01, SYNC-02, SYNC-04
**Success Criteria** (what must be TRUE):
  1. Marking a date unavailable in one campaign causes that date to appear as DM-unavailable in all other campaigns with sync enabled
  2. Removing an unavailable date in one campaign removes it from all other sync-enabled campaigns
  3. Sync respects each sibling campaign's own planning window — dates outside a sibling's window are not written
  4. Re-enabling sync after opting out does not retroactively populate past exceptions — only future toggles propagate
**Plans**: 2 plans

Plans:
- [x] 25-01-PLAN.md — Add dmSyncEnabled to schema and apply prisma db push
- [ ] 25-02-PLAN.md — Extend toggleDmException with sibling propagation; add setDmSyncEnabled action

### Phase 26: Two-Column Layout Restructure
**Goal**: The Availability tab presents a large calendar alongside a persistent sidebar so DM has constant access to Best Days and the join link without scrolling or tab-switching
**Depends on**: Phase 25
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, SET-02
**Success Criteria** (what must be TRUE):
  1. On the Availability tab, the calendar fills the left column and a sidebar is always visible on the right without scrolling
  2. The sidebar shows the Best Days list and a one-click copy join link at all times while the Availability tab is active
  3. Clicking a calendar date swaps the sidebar content to show player breakdown for that date; the calendar remains fully visible (no full-screen overlay)
  4. Closing the date detail returns the sidebar to showing Best Days and the join link
  5. The join link no longer appears in the Settings tab
**Plans**: TBD

### Phase 27: Flat Settings and Sync Toggle
**Goal**: Settings tab is fully scannable in one pass and exposes a per-campaign sync opt-out toggle
**Depends on**: Phase 26
**Requirements**: SET-01, SYNC-03
**Success Criteria** (what must be TRUE):
  1. All Settings sections are visible immediately without expanding any accordions or clicking to reveal content
  2. A "Sync DM availability" toggle is visible in Settings, on by default, and can be turned off per campaign
  3. Turning sync off for a campaign makes its DM exceptions independent — subsequent toggles in other campaigns do not affect it
  4. The toggle label communicates that re-enabling sync applies to future exceptions only
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
| 20. Static Page Shell | v1.5 | 2/2 | Complete | 2026-03-13 |
| 21. Scroll Animations | v1.5 | 2/2 | Complete | 2026-03-13 |
| 22. Features Step-Selector | v1.5 | 2/2 | Complete | 2026-03-13 |
| 23. Availability Demo | v1.5 | 2/2 | Complete | 2026-03-14 |
| 24. Sticky Nav Scroll Behaviour | v1.5 | 1/1 | Complete | 2026-03-14 |
| 25. Sync Schema and Server Layer | 2/2 | Complete   | 2026-03-17 | - |
| 26. Two-Column Layout Restructure | v1.6 | 0/? | Not started | - |
| 27. Flat Settings and Sync Toggle | v1.6 | 0/? | Not started | - |
