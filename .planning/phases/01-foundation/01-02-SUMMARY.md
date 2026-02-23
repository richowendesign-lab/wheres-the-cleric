---
phase: 01-foundation
plan: 02
subsystem: infra
tags: [prisma, sqlite, seed, tsx, readme]

# Dependency graph
requires:
  - phase: 01-01
    provides: Prisma schema with Campaign, PlayerSlot, AvailabilityEntry models and generated ESM client at src/generated/prisma
provides:
  - Demo seed data: Curse of Strahd campaign with 4 named player slots and March 2026 planning window
  - db:seed script (idempotent — clears and re-creates on each run)
  - db:reset script (force-drops and re-seeds, for user execution only)
  - Designer-friendly README for non-technical setup in under 5 minutes
affects: [02-campaign-creation, 03-availability, 04-dashboard]

# Tech tracking
tech-stack:
  added:
    - ts-node@10.9.2 (dev dependency)
  patterns:
    - Prisma 7 seed configured in prisma.config.ts migrations.seed field (not package.json "prisma" key)
    - Use npx tsx for ESM-compatible TypeScript execution in seed scripts (generated Prisma client uses import.meta.url)
    - Seed script imports PrismaClient from relative path ../src/generated/prisma/client (not @/ alias — ts-node/tsx don't resolve Next.js path aliases)
    - Seed script creates own PrismaBetterSqlite3 adapter instance (cannot reuse src/lib/prisma.ts singleton in CLI context)

key-files:
  created:
    - prisma/seed.ts
    - README.md (replaced boilerplate)
  modified:
    - package.json
    - prisma.config.ts

key-decisions:
  - "Seed command in prisma.config.ts migrations.seed (Prisma 7) not package.json prisma.seed (Prisma 5/6)"
  - "Use npx tsx not ts-node for seed: generated Prisma 7 client is ESM (uses import.meta.url), ts-node CommonJS mode fails"
  - "Relative import path in seed.ts: ../src/generated/prisma/client — @/ alias not available in tsx/ts-node CLI context"
  - "Seed script instantiates its own PrismaBetterSqlite3 adapter — cannot reuse the Next.js singleton from src/lib/prisma.ts"
  - "db:reset blocked by Prisma AI safety guard (PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION) — designed for user execution only, not verification by AI"

patterns-established:
  - "Seed pattern: always use npx tsx for running TypeScript seed scripts in Prisma 7 projects with ESM-generated client"
  - "CLI scripts: use relative imports, not @/ path aliases, when running TypeScript outside the Next.js bundler"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-02-23
---

# Phase 1 Plan 02: Demo Seed Data and Designer README Summary

**Prisma seed populating Curse of Strahd campaign with 4 player slots (invite tokens auto-generated), plus a jargon-free README guiding non-technical setup in 3 commands**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-23T14:34:45Z
- **Completed:** 2026-02-23T14:42:45Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Idempotent seed script: clears and re-creates Curse of Strahd campaign with 4 player slots (Aragorn, Gandalf, Legolas, Gimli) each time
- Each player slot gets a unique cuid() invite token printed as /invite/{token} paths
- March 2026 planning window set on the campaign
- Replaced Next.js boilerplate README with 26-line designer-friendly guide: 3 setup commands, no jargon

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Prisma seed script with demo campaign data** - `2b96169` (feat)
2. **Task 2: Write designer-friendly README with setup instructions** - `5130944` (feat)

**Plan metadata:** (created after this summary)

## Files Created/Modified
- `prisma/seed.ts` - Seed script: clears and re-creates campaign, 4 player slots, March 2026 window; uses npx tsx via prisma.config.ts
- `package.json` - Added db:seed and db:reset convenience scripts
- `prisma.config.ts` - Added migrations.seed field pointing to npx tsx prisma/seed.ts (Prisma 7 seed config location)
- `README.md` - Designer-friendly setup guide: npm install, npm run db:seed, npm run dev — no jargon

## Decisions Made
- Seed command moved to `prisma.config.ts` `migrations.seed` field — Prisma 7 no longer reads the `"prisma"."seed"` key from `package.json`
- Switched from `ts-node --compiler-options {"module":"CommonJS"}` to `npx tsx` — the Prisma 7 generated client is ESM-only (uses `import.meta.url`) and cannot be required via CommonJS
- Seed script uses relative import path (`../src/generated/prisma/client`) instead of `@/` alias — tsx doesn't resolve Next.js tsconfig path aliases
- Seed script creates its own `PrismaBetterSqlite3` adapter instance rather than reusing `src/lib/prisma.ts` — CLI scripts run outside Next.js and cannot share the server singleton

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong import path for PrismaClient in seed.ts**
- **Found during:** Task 1 (Create Prisma seed script)
- **Issue:** Plan specified `import { PrismaClient } from '@prisma/client'` but per 01-01, the generated client is at `src/generated/prisma/client` — using `@prisma/client` would fail at runtime
- **Fix:** Used relative path `../src/generated/prisma/client` and instantiated own `PrismaBetterSqlite3` adapter (matching src/lib/prisma.ts pattern)
- **Files modified:** prisma/seed.ts
- **Verification:** `npm run db:seed` succeeds and prints campaign + 4 player slots
- **Committed in:** 2b96169 (Task 1 commit)

**2. [Rule 1 - Bug] Seed config location changed in Prisma 7**
- **Found during:** Task 1 (running npm run db:seed)
- **Issue:** Plan specified `"prisma": { "seed": "..." }` in package.json — Prisma 7 ignores this and requires seed in `prisma.config.ts` migrations block
- **Fix:** Added `seed: "npx tsx prisma/seed.ts"` to the `migrations` object in `prisma.config.ts`; removed package.json prisma key
- **Files modified:** prisma.config.ts, package.json
- **Verification:** `npm run db:seed` exits 0 and prints seeded campaign
- **Committed in:** 2b96169 (Task 1 commit)

**3. [Rule 1 - Bug] ts-node CommonJS mode incompatible with Prisma 7 ESM client**
- **Found during:** Task 1 (first seed run)
- **Issue:** `ts-node --compiler-options {"module":"CommonJS"}` fails with "exports is not defined in ES module scope" because generated client uses `import.meta.url`
- **Fix:** Switched to `npx tsx` which handles ESM TypeScript natively; tsx was already installed as a Next.js dependency
- **Files modified:** prisma.config.ts
- **Verification:** `npm run db:seed` succeeds
- **Committed in:** 2b96169 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 - Bug, all Prisma 7 breaking changes from plan's Prisma 5/6 assumptions)
**Impact on plan:** All three were necessary adaptations to Prisma 7's changed API surface. No scope creep. Plan intent fully preserved.

## Issues Encountered
- `db:reset` (`prisma db push --force-reset`) is blocked by Prisma's AI safety guard when run by Claude Code — requires `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var. This is expected and correct behavior: `db:reset` is designed for the user to run, not for automated verification. Idempotency was verified by running `db:seed` twice consecutively.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Seed data ready: run `npm run db:seed` once after `npm install` to populate the database
- README guides a non-technical user through full setup in 3 commands
- `db:reset` available for clearing demo data between test sessions
- All Phase 2-4 work can proceed: campaign exists in DB with 4 player slots and unique invite tokens

---
*Phase: 01-foundation*
*Completed: 2026-02-23*

## Self-Check: PASSED

- FOUND: prisma/seed.ts
- FOUND: README.md
- FOUND: package.json
- FOUND: prisma.config.ts
- FOUND: .planning/phases/01-foundation/01-02-SUMMARY.md
- FOUND commit 2b96169 (Task 1: seed script)
- FOUND commit 5130944 (Task 2: README)
