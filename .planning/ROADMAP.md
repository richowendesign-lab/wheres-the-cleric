# Roadmap: D&D Session Planner

## Overview

Four phases from foundation to a working scheduling app. Phase 1 sets up the project skeleton. Phase 2 enables the DM to create a campaign and generate invite links. Phase 3 gives players a way to express their availability. Phase 4 closes the loop with the DM dashboard that shows who's free and recommends the best session days.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - App skeleton, data models, routing, and deployment pipeline
- [ ] **Phase 2: Campaign** - DM creates a campaign and generates unique persistent invite links per player
- [ ] **Phase 3: Availability** - Players access their invite link and submit their availability
- [ ] **Phase 4: Dashboard** - DM sees group availability, highlights, missing players, and best-day recommendations

## Phase Details

### Phase 1: Foundation
**Goal**: The project runs locally and can be deployed — ready for feature work
**Depends on**: Nothing (first phase)
**Requirements**: None (scaffolding only — all v1 requirements are covered in Phases 2-4)
**Success Criteria** (what must be TRUE):
  1. The app starts locally with a single command
  2. The data model supports campaigns, player slots, invite links, and availability entries
  3. The app is deployable to production (or a staging environment) with a working URL
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js + TypeScript + Tailwind, install Prisma, define full domain schema (Campaign, PlayerSlot, AvailabilityEntry), push SQLite DB
- [ ] 01-02-PLAN.md — Seed demo campaign data (4 players, planning window), write designer-friendly README
- [ ] 01-03-PLAN.md — Configure Vercel deployment, deploy to production, verify live URL

### Phase 2: Campaign
**Goal**: The DM can create a campaign and hand out invite links to each player
**Depends on**: Phase 1
**Requirements**: CAMP-01, CAMP-02, CAMP-03, ACCESS-01
**Success Criteria** (what must be TRUE):
  1. DM can create a campaign by entering a name and adding named player slots
  2. Each player slot has a unique persistent invite link the DM can copy and share
  3. DM can set a planning window (start and end date) that scopes the scheduling period
  4. A player can open their invite link in a browser with no login or account required and see their slot
**Plans**: TBD

Plans:
- (TBD during planning)

### Phase 3: Availability
**Goal**: Players can express when they're generally free and flag specific date exceptions
**Depends on**: Phase 2
**Requirements**: AVAIL-01, AVAIL-02, AVAIL-03, AVAIL-04
**Success Criteria** (what must be TRUE):
  1. Player can select which days of the week they are generally free
  2. Player can specify a time-of-day preference (morning, afternoon, or evening) for each free day
  3. Player can mark a specific date as busy or free, overriding their weekly pattern for that day
  4. Player can return to their invite link later, see their existing availability, and update it
**Plans**: TBD

Plans:
- (TBD during planning)

### Phase 4: Dashboard
**Goal**: The DM has a clear view of group availability and knows when to schedule the next session
**Depends on**: Phase 3
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. DM can view a calendar grid showing each player's availability status for every day in the planning window
  2. Days where all players are available are visually highlighted and distinguishable at a glance
  3. DM can see a list of players who have not yet submitted any availability
  4. DM can see a ranked list of best session days ordered by how many (and which) players are free
**Plans**: TBD

Plans:
- (TBD during planning)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/3 | In Progress|  |
| 2. Campaign | 0/TBD | Not started | - |
| 3. Availability | 0/TBD | Not started | - |
| 4. Dashboard | 0/TBD | Not started | - |
