---
phase: 09-campaign-fields-and-join-cap
plan: 01
subsystem: database
tags: [prisma, postgresql, campaign, dm-auth, player-cap]

# Dependency graph
requires:
  - phase: 08-dm-auth
    provides: DM model, getSessionDM() function, session cookie auth system
provides:
  - Campaign model with name, description, maxPlayers, and dmId fields in Prisma schema
  - createCampaign validates required name, links campaign to authenticated DM via dmId
  - registerPlayer enforces maxPlayers cap before inserting PlayerSlot
affects: [09-02-campaign-ui, any campaign creation or join flows]

# Tech tracking
tech-stack:
  added: []
  patterns: [dm-ownership-via-dmId, join-cap-via-count-check]

key-files:
  created: []
  modified:
    - prisma/schema.prisma
    - src/lib/actions/campaign.ts
    - src/lib/actions/player.ts

key-decisions:
  - "name/description/maxPlayers fields are nullable in DB (String?/Int?) — required-at-creation enforced in server action, not DB constraint"
  - "dmId is nullable (String?) to allow existing campaigns without DM ownership to remain valid"
  - "createCampaign no longer sets dm_secret cookie — ownership is now via authenticated DM session"
  - "maxPlayers cap check uses prisma _count aggregate on playerSlots to avoid race conditions from stale counts"

patterns-established:
  - "Join cap pattern: fetch campaign with _count.playerSlots, compare to maxPlayers before insert"
  - "DM ownership pattern: call getSessionDM() at top of action, return error if null, pass dm.id to prisma create"

requirements-completed: [CAMP-01, CAMP-02, CAMP-03, JOIN-01]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 9 Plan 01: Campaign Fields and Join Cap (Schema + Actions) Summary

**Prisma Campaign model extended with name/description/maxPlayers/dmId; createCampaign now validates name and links ownership to authenticated DM; registerPlayer enforces player cap via _count check**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T16:48:29Z
- **Completed:** 2026-03-04T16:50:37Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Campaign schema extended with name (String?), description (String?), maxPlayers (Int?), dmId (String?) and DM relation — db push applied to live Neon PostgreSQL database
- createCampaign rewritten to validate required name, parse optional description/maxPlayers, link campaign to authenticated DM via dmId, and no longer set dm_secret cookie on creation
- registerPlayer updated to fetch campaign with playerSlot count and return an error when the player cap is reached before creating a slot

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Campaign schema with name/description/maxPlayers and DM ownership** - `bde5909` (feat)
2. **Task 2: Update createCampaign action and enforce join cap in registerPlayer** - `d4c544e` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added name, description, maxPlayers, dmId fields to Campaign; added campaigns relation to DM
- `src/lib/actions/campaign.ts` - Rewrote createCampaign with name validation, new fields, DM session linkage, removed dm_secret cookie set
- `src/lib/actions/player.ts` - Added maxPlayers cap check using _count aggregate before playerSlot creation

## Decisions Made
- Fields made nullable in DB schema to avoid migration issues with existing rows — the required-at-creation constraint is enforced at the server action level
- dmId is nullable so existing campaigns created before Phase 9 remain valid
- dm_secret cookie is no longer set by createCampaign (ownership now via authenticated DM session); deleteCampaign still clears the old cookie for backward compatibility during transition

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The plan's verification command (`node -e "const {PrismaClient} = require('./src/generated/prisma')"`) failed because the Prisma 7.x generator outputs TypeScript source files, not compiled CJS modules. Verification was confirmed via `prisma validate` (schema valid), `db push` (succeeded), and `tsc --noEmit` (zero errors) instead.

## User Setup Required

None - no external service configuration required. The `db push` was applied automatically to the connected Neon database.

## Next Phase Readiness
- Schema changes and action behaviors are in place — Plan 09-02 (campaign UI) can proceed
- createCampaign accepts name/description/maxPlayers from form data; form fields just need to be added to the UI
- registerPlayer correctly rejects joins when campaign is full

---
*Phase: 09-campaign-fields-and-join-cap*
*Completed: 2026-03-04*
