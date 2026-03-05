# Roadmap: D&D Session Planner

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-02-26)
- ✅ **v1.1 Simplified Onboarding** — Phases 5-7 (shipped 2026-03-02)
- **v1.2 Multi-Campaign DM** — Phases 8-10 (in progress)

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

### v1.2 Multi-Campaign DM (Phases 8-10)

- [x] **Phase 8: DM Auth** — DM can create an account and log in with email and password, with session persisting across browser refreshes (completed 2026-03-04)
- [x] **Phase 9: Campaign Fields and Join Cap** — Campaign creation captures name, description, and max players; join link enforces the player cap (completed 2026-03-04)
- [x] **Phase 10: Multi-Campaign Dashboard** — DM home page shows all their campaigns as cards with a button to create a new one (completed 2026-03-05)

## Phase Details

### Phase 8: DM Auth
**Goal**: DM can securely create an account and maintain a persistent login session
**Depends on**: Phase 7 (existing app with cookie-based identity)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. DM can sign up with an email address and password and is immediately logged in
  2. DM can log in with their email and password from any device
  3. DM remains logged in after closing and reopening the browser (session persists across refresh)
  4. DM can log out and is redirected away from authenticated pages; returning to those pages redirects to login
**Plans**: 4 plans

Plans:
- [x] 08-01-PLAN.md — Schema + auth utility lib (DM model, Session model, bcrypt, session utilities)
- [x] 08-02-PLAN.md — Auth server actions (signUp, logIn, logOut) + Next.js middleware
- [ ] 08-03-PLAN.md — Sign-up and login pages + home page update
- [ ] 08-04-PLAN.md — Logout button on campaign dashboard + end-to-end verification checkpoint

### Phase 9: Campaign Fields and Join Cap
**Goal**: DM can create richly described campaigns and the join link enforces a player cap
**Depends on**: Phase 8 (DM auth — campaigns must be owned by an authenticated DM)
**Requirements**: CAMP-01, CAMP-02, CAMP-03, JOIN-01
**Success Criteria** (what must be TRUE):
  1. DM can create a campaign by entering a required name (creation fails without one)
  2. DM can optionally enter a description and it appears on the campaign dashboard
  3. DM can optionally set a max players number and it is saved with the campaign
  4. A player attempting to join a full campaign (at max players limit) sees a "campaign full" message and cannot join
**Plans**: 2 plans

Plans:
- [x] 09-01-PLAN.md — Schema fields (name, description, maxPlayers, dmId), updated createCampaign action, join cap enforcement in registerPlayer
- [x] 09-02-PLAN.md — CampaignForm UI fields, campaign dashboard display, join page cap gate + human verification

### Phase 10: Multi-Campaign Dashboard
**Goal**: DM can see and navigate all their campaigns from a single home page
**Depends on**: Phase 9 (campaigns have name and description fields to display on cards)
**Requirements**: CAMP-04, CAMP-05
**Success Criteria** (what must be TRUE):
  1. DM's home page shows a card for each of their campaigns, displaying the campaign name
  2. DM can click a campaign card to navigate to that campaign's dashboard
  3. DM home page has a "Create new campaign" button that opens the campaign creation flow
  4. A DM with no campaigns sees an empty state with only the "Create new campaign" button
**Plans**: 1 plan

Plans:
- [x] 10-01-PLAN.md — DM home dashboard: campaign cards, empty state, create button + human verification

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
| 9. Campaign Fields and Join Cap | v1.2 | Complete    | 2026-03-04 | 2026-03-04 |
| 10. Multi-Campaign Dashboard | 1/1 | Complete    | 2026-03-05 | - |
