---
phase: 05-schema-migration
plan: "01"
subsystem: database
tags: [prisma, postgresql, neon, schema-migration]

requires:
  - phase: 04-dashboard
    provides: v1.0 schema with Campaign(name, dmName), PlayerSlot(inviteToken)

provides:
  - v1.1 Prisma schema with joinToken + dmSecret on Campaign, no inviteToken on PlayerSlot
  - Empty database synced to v1.1 schema
  - Regenerated Prisma client types for v1.1 models

affects: [06-dm-flow, 07-player-flow]

tech-stack:
  added: []
  patterns:
    - "prisma db push --force-reset for destructive schema migrations in db-push workflow (no migrations dir)"

key-files:
  created: []
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Used prisma db push --force-reset (not prisma migrate reset) — project uses db push workflow with no migrations directory"
  - "src/generated/prisma is gitignored; Prisma client regenerated on disk only, verified via grep"

patterns-established:
  - "v1.1 data model: single joinToken (public) + dmSecret (private) on Campaign replaces per-player inviteToken pattern"

requirements-completed: [MIGR-01]

duration: ~10min
completed: 2026-03-02
---

# Phase 5 Plan 01: Schema Migration Summary

**Prisma schema rewritten to v1.1 single-link model — joinToken/dmSecret on Campaign, inviteToken removed from PlayerSlot, database wiped and client regenerated**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 2
- **Files modified:** 2 (prisma/schema.prisma, .planning/config.json)

## Accomplishments

- Rewrote schema.prisma: Campaign gains joinToken + dmSecret (@unique, cuid defaults), loses name and dmName; PlayerSlot loses inviteToken
- Wiped Neon PostgreSQL database via `prisma db push --force-reset` — all v1.0 Campaign/PlayerSlot/AvailabilityEntry rows removed
- Regenerated Prisma client (src/generated/prisma) — Campaign type reflects joinToken/dmSecret, PlayerSlot type has no inviteToken

## Task Commits

1. **Task 1: Rewrite schema.prisma to v1.1 model** - `bfa216d` (feat)
2. **Task 2: Wipe database and regenerate Prisma client** - `e1ffc17` (chore)

## Files Created/Modified

- `prisma/schema.prisma` - v1.1 schema: joinToken + dmSecret on Campaign, no inviteToken on PlayerSlot, no name/dmName on Campaign
- `src/generated/prisma/` - Regenerated client types (gitignored, verified on disk)

## Decisions Made

- Used `prisma db push --force-reset` (not `prisma migrate reset`) — project uses db push workflow with no migrations directory
- `src/generated/prisma` is gitignored; client regeneration verified via grep on disk rather than committed files
- DATABASE_URL sourced from `.env` (not `.env.local`) — env file location noted for future tasks

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- DATABASE_URL extraction via `cut -d= -f2-` from `.env` initially failed because env var was in `.env` not `.env.local`. Resolved by reading the file directly and supplying the value explicitly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- v1.1 schema is live in Neon PostgreSQL, database is empty
- Prisma client types match v1.1 model — phases 06-dm-flow and 07-player-flow can now build against joinToken/dmSecret pattern
- No blockers

---
*Phase: 05-schema-migration*
*Completed: 2026-03-02*
