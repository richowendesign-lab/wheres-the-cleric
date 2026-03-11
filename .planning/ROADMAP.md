# Roadmap: D&D Session Planner

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-02-26)
- ✅ **v1.1 Simplified Onboarding** — Phases 5-7 (shipped 2026-03-02)
- ✅ **v1.2 Multi-Campaign DM** — Phases 8-10 (shipped 2026-03-05)
- 🚧 **v1.3 DM Experience & Scheduling Flow** — Phases 11-16 (in progress)

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

### 🚧 v1.3 DM Experience & Scheduling Flow (In Progress)

**Milestone Goal:** Improve the DM's post-creation flow and campaign dashboard so sharing the link and acting on availability are fast and obvious.

- [x] **Phase 11: Schema Foundation + Calendar Utilities** — Add DmAvailabilityException model and dmExceptionMode to Campaign; extract buildMonthGrid/formatDateKey to calendarUtils.ts (completed 2026-03-09)
- [x] **Phase 12: Share Modal** — Post-creation modal with one-click join link copy and pre-written invite message; ?share=1 URL param trigger pattern (completed 2026-03-09)
- [x] **Phase 13: DM Availability Exceptions** — Click-to-toggle calendar for marking DM-unavailable dates; block/flag mode toggle; dmBlocked in DayAggregation (completed 2026-03-10)
- [x] **Phase 14: Dashboard Redesign** — Adaptive calendar with prev/next navigation, ranked best-day list alongside, campaign details de-emphasised (completed 2026-03-11)
- [x] **Phase 15: Shareable Best Dates** — CopyBestDaysButton client island; formatted top-3 best-dates message from the campaign dashboard (completed 2026-03-11)
- [ ] **Phase 16: Custom Date Picker** — Hand-rolled themed picker using hidden input pattern; replaces native date inputs in campaign forms

## Phase Details

### Phase 11: Schema Foundation + Calendar Utilities
**Goal**: The data model for DM availability exceptions exists in the database and calendar grid logic lives in one shared location, unblocking all downstream feature phases.
**Depends on**: Phase 10
**Requirements**: None (structural prerequisite — unblocks Phases 12-16)
**Success Criteria** (what must be TRUE):
  1. `DmAvailabilityException` table exists in the Prisma schema with `@@unique([campaignId, date])` and can be pushed to both SQLite and Neon without error
  2. `Campaign` model has a `dmExceptionMode` string field (nullable) that persists "block" or "flag" values
  3. `src/lib/calendarUtils.ts` exports `buildMonthGrid` and `formatDateKey`; existing `AvailabilityCalendar` and `DashboardCalendar` import from there with no behaviour change
**Plans**: 2 plans
Plans:
- [ ] 11-01-PLAN.md — Schema migration: add DmAvailabilityException model and dmExceptionMode to Campaign, push to Neon
- [ ] 11-02-PLAN.md — calendarUtils extraction: create src/lib/calendarUtils.ts, update DashboardCalendar, AvailabilityCalendar, and availability.ts imports

### Phase 12: Share Modal
**Goal**: After creating a campaign, the DM immediately sees a modal with everything needed to share the join link — no extra navigation required.
**Depends on**: Phase 11
**Requirements**: SHARE-01, SHARE-02, SHARE-03, SHARE-04, SHARE-05
**Success Criteria** (what must be TRUE):
  1. After submitting the campaign creation form, the campaign dashboard opens with a share modal already visible — no extra click required
  2. DM can click "Copy link" and the button changes to "Copied!" giving clear confirmation; the join link is also visible in a read-only field in the modal
  3. DM can click "Copy invite message" and a pre-written message (including the link and player instructions) is placed on the clipboard
  4. DM can dismiss the modal and land on the campaign dashboard with the modal gone and the URL cleaned of the ?share=1 param
**Plans**: 2 plans
Plans:
- [ ] 12-01-PLAN.md — Modify createCampaign redirect (?share=1) and create ShareModal component with two copy buttons
- [ ] 12-02-PLAN.md — Wire ShareModal into CampaignDetailPage via searchParams prop; human verification of full flow

### Phase 13: DM Availability Exceptions
**Goal**: The DM can mark their own unavailable dates on a per-campaign calendar, and those blocks or flags are reflected in the best-day data.
**Depends on**: Phase 11
**Requirements**: DMEX-01, DMEX-02, DMEX-03, DMEX-04
**Success Criteria** (what must be TRUE):
  1. DM can click any date in their campaign calendar to mark it as DM-unavailable; the date is visually distinct from player-unavailable dates
  2. DM can click a marked date again to remove the exception; the date returns to its normal appearance immediately
  3. DM can switch between "block" mode (date removed from best-day rankings) and "flag" mode (date stays ranked but shows a warning badge); the selected mode persists on save
  4. The `DayAggregation` type carries a `dmBlocked` boolean that downstream rendering components (BestDaysList, DashboardCalendar) use to hide or badge blocked days
**Plans**: 2 plans
Plans:
- [ ] 13-01-PLAN.md — Data layer: extract Toast, extend DayAggregation with dmBlocked, add toggleDmException + setDmExceptionMode Server Actions, update CampaignDetailPage data fetch
- [ ] 13-02-PLAN.md — UI layer: build DmExceptionCalendar component, wire into page, add dmBlocked visual treatment to DashboardCalendar and BestDaysList; human verification

### Phase 14: Dashboard Redesign
**Goal**: The campaign dashboard calendar adapts to the planning window width with navigation arrows, and the ranked best-day list is visible alongside it — making the DM's primary question ("when can we play?") answerable at a glance.
**Depends on**: Phase 13
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. The calendar shows one or two months at a time based on available space, with prev/next arrows to paginate through the full planning window — no hardcoded two-month side-by-side layout
  2. Days outside the planning window are visually muted on the calendar so the DM's attention stays on the schedulable range
  3. A ranked best-day list appears alongside the calendar; each entry shows the date, the player count available, and the names of any unavailable players
  4. Share link, planning window dates, and delete campaign controls remain accessible on the dashboard but are visually de-emphasised (secondary section, collapsible, or tab) so they do not compete with the availability view
**Plans**: 4 plans
Plans:
- [ ] 14-01-PLAN.md — UpdatePlanningWindowForm string props fix + BestDaysList unavailable names (DASH-04)
- [ ] 14-02-PLAN.md — DashboardCalendar prev/next navigation and responsive 2-up (DASH-01, DASH-02)
- [ ] 14-03-PLAN.md — CampaignTabs Client Component + CampaignDetailPage refactor (DASH-03, DASH-05)
- [ ] 14-04-PLAN.md — Human verification of all five DASH requirements

### Phase 15: Shareable Best Dates
**Goal**: The DM can copy a formatted best-dates message from the dashboard and paste it directly into group chat to communicate the top scheduling options.
**Depends on**: Phase 14
**Requirements**: COPY-01, COPY-02
**Success Criteria** (what must be TRUE):
  1. A "Copy best dates" button is present on the campaign dashboard and clicking it places a formatted message on the clipboard with one-click "Copied!" feedback
  2. The copied message lists the top 3 dates with the day name, full date, and plain-English availability summary ("everyone free" or "3/4 free, Alex busy") — exactly 3 dates, no more
**Plans**: 2 plans
Plans:
- [ ] 15-01-PLAN.md — formatBestDatesMessage utility + CopyBestDatesButton component (availability.ts, new component)
- [ ] 15-02-PLAN.md — Wire CopyBestDatesButton into BestDaysList + human verification

### Phase 16: Custom Date Picker
**Goal**: Planning window date fields use a styled date picker that matches the app's purple theme, replacing native browser date inputs in all campaign forms.
**Depends on**: Phase 11
**Requirements**: PICK-01, PICK-02
**Success Criteria** (what must be TRUE):
  1. The campaign creation form and planning window update form display a custom date picker that matches the app's purple/dark visual style — no native browser date popup appears
  2. The custom picker emits a hidden input, so all existing Server Actions read date values from FormData unchanged; form validation errors do not reset the picked date
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
| 12. Share Modal | 2/2 | Complete    | 2026-03-10 | - |
| 13. DM Availability Exceptions | 2/2 | Complete    | 2026-03-10 | - |
| 14. Dashboard Redesign | v1.3 | 4/4 | Complete | 2026-03-11 |
| 15. Shareable Best Dates | 2/2 | Complete   | 2026-03-11 | 2026-03-11 |
| 16. Custom Date Picker | v1.3 | 0/? | Not started | - |
