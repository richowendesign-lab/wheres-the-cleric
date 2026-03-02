# Roadmap: D&D Session Planner

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-02-26)
- 🚧 **v1.1 Simplified Onboarding** — Phases 5-7 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-02-26</summary>

- [x] **Phase 1: Foundation** — App skeleton, data models, routing, and deployment pipeline (3/3 plans) — completed 2026-02-24
- [x] **Phase 2: Campaign** — DM creates a campaign and generates unique persistent invite links per player (3/3 plans) — completed 2026-02-24
- [x] **Phase 3: Availability** — Players access their invite link and submit their availability (4/4 plans) — completed 2026-02-26
- [x] **Phase 4: Dashboard** — DM sees group availability, highlights, missing players, and best-day recommendations (4/4 plans) — completed 2026-02-26

Full phase details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Simplified Onboarding (In Progress)

**Milestone Goal:** Replace per-player invite links with a single shared join link and self-registration flow. DM enters only a date range to create a campaign. Players arrive at the join link, enter their name once, and are remembered on return. Cookie-based routing means the same URL sends each visitor to the right place.

- [x] **Phase 5: Schema Migration** — Wipe v1.0 schema and apply new data model that supports single join link and self-registration (4/4 plans) — completed 2026-03-02
- [ ] **Phase 6: Campaign Creation** — DM creates a campaign with only a date range, receives a single shareable join link, and is remembered as campaign owner
- [ ] **Phase 7: Join Flow** — Smart join link routes new visitors to name entry, returning players to their availability page, and returning DMs to the dashboard

## Phase Details

### Phase 5: Schema Migration
**Goal**: The database schema supports the v1.1 access model — join token, DM secret, and player self-registration — with all v1.0 data cleared
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: MIGR-01
**Success Criteria** (what must be TRUE):
  1. Campaign table has joinToken and dmSecret fields; name and dmName fields are removed
  2. PlayerSlot table has no inviteToken field; player name is stored after self-registration
  3. All v1.0 campaign and player data is gone from the database
  4. App runs against the new schema without errors (local and production)
**Plans**: 4 plans

Plans:
- [x] 05-01-PLAN.md — Rewrite schema.prisma to v1.1 model and wipe database
- [x] 05-02-PLAN.md — Fix server-side code (seed.ts + campaign action)
- [x] 05-03-PLAN.md — Fix UI/pages (campaign detail, invite stub, CampaignForm)
- [x] 05-04-PLAN.md — Full build verification and human smoke test

### Phase 6: Campaign Creation
**Goal**: DM can create a campaign by entering only a date range, immediately sees a single shareable join link, and is recognised as the campaign owner on return visits
**Depends on**: Phase 5
**Requirements**: CAMP-11, CAMP-12, CAMP-13
**Success Criteria** (what must be TRUE):
  1. DM can submit the campaign creation form with only start and end dates — no name or player name fields present
  2. After creation, DM sees a single join link they can copy and share
  3. DM's browser receives a cookie marking them as campaign owner
  4. DM can close and reopen the browser, visit the app, and land on their dashboard without re-entering anything
**Plans**: TBD

### Phase 7: Join Flow
**Goal**: The join link is smart — new visitors see a name entry form, returning players go straight to their availability page, and the DM goes straight to the dashboard
**Depends on**: Phase 6
**Requirements**: JOIN-01, JOIN-02, JOIN-03, JOIN-04
**Success Criteria** (what must be TRUE):
  1. New visitor who opens the join link sees a name entry form with no other navigation
  2. After entering their name and submitting, player lands on their personal availability page
  3. Returning player who revisits the join link is automatically sent to their availability page without seeing the name form
  4. DM who revisits the join link is automatically sent to the dashboard without seeing the name form
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-02-24 |
| 2. Campaign | v1.0 | 3/3 | Complete | 2026-02-24 |
| 3. Availability | v1.0 | 4/4 | Complete | 2026-02-26 |
| 4. Dashboard | v1.0 | 4/4 | Complete | 2026-02-26 |
| 5. Schema Migration | v1.1 | 4/4 | Complete | 2026-03-02 |
| 6. Campaign Creation | v1.1 | 0/? | Not started | - |
| 7. Join Flow | v1.1 | 0/? | Not started | - |
