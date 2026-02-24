---
phase: 01-foundation
plan: 03
subsystem: infra
tags: [vercel, neon, postgresql, sqlite, prisma, deployment, next.js]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js app scaffold, Prisma 7 SQLite schema, PrismaBetterSqlite3 singleton client
  - phase: 01-02
    provides: Demo seed data, db:seed script, prisma.config.ts established
provides:
  - Live Vercel deployment at a public HTTPS URL
  - vercel.json with build command including prisma generate
  - package.json postinstall hook ensuring prisma generate runs on every deploy
  - .env.example updated to document both SQLite (local) and Neon PostgreSQL (production) variables
  - next.config.ts with serverExternalPackages for better-sqlite3 native module
affects: [02-campaign-creation, 03-availability, 04-dashboard]

# Tech tracking
tech-stack:
  added:
    - vercel (CLI deploy target)
    - Neon PostgreSQL (production database, configured via Vercel dashboard env vars)
  patterns:
    - Dual-environment DB strategy: SQLite (local dev, zero-config) vs Neon PostgreSQL (production via DATABASE_URL)
    - prisma generate in both build script and postinstall hook to ensure client is always generated on Vercel
    - serverExternalPackages in next.config.ts to exclude native Node modules from webpack/turbopack bundling

key-files:
  created:
    - vercel.json
  modified:
    - package.json
    - .env.example
    - next.config.ts

key-decisions:
  - "Prisma 7 does not allow env() in datasource provider field (P1012 error) — schema.prisma keeps provider='sqlite' literal; production uses Neon PostgreSQL configured via DATABASE_URL in Vercel dashboard env vars"
  - "serverExternalPackages: ['better-sqlite3'] added to next.config.ts — prevents webpack/turbopack from bundling the native .node module, which fails in Vercel's Lambda environment"
  - "Production database (Neon PostgreSQL) provisioned via Vercel dashboard integration, not via dual-provider Prisma config — simpler and avoids Prisma 7 env() limitation in provider field"
  - "vercel.json buildCommand set to 'prisma generate && next build' plus package.json postinstall hook for belt-and-suspenders prisma generate on deploy"

patterns-established:
  - "Deployment pattern: prisma generate in buildCommand (vercel.json) AND postinstall (package.json) to guarantee generated client exists in Vercel Lambda environment"
  - "Native module pattern: add native Node modules to serverExternalPackages in next.config.ts to prevent bundling errors"

requirements-completed: []

# Metrics
duration: 25min
completed: 2026-02-24
---

# Phase 1 Plan 03: Vercel Deployment Summary

**Next.js app deployed to Vercel with production Neon PostgreSQL database, using SQLite locally and serverExternalPackages to handle the better-sqlite3 native module**

## Performance

- **Duration:** 25 min (including auth gate and human-verify checkpoint)
- **Started:** 2026-02-23T14:42:55Z
- **Completed:** 2026-02-24T00:00:00Z
- **Tasks:** 1 (plus 1 checkpoint approved)
- **Files modified:** 4

## Accomplishments
- App deployed to Vercel at a public HTTPS URL — visible and verified by user
- vercel.json configured with `prisma generate && next build` so the Prisma client is always regenerated on deploy
- Production database (Neon PostgreSQL) provisioned via Vercel dashboard and connected via DATABASE_URL environment variable
- next.config.ts updated with `serverExternalPackages: ['better-sqlite3']` to prevent native module bundling errors in Vercel's Lambda runtime
- .env.example updated to document both local SQLite and production PostgreSQL configuration

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure Vercel deployment and deploy** - `6189df5` (feat)

**Plan metadata:** (created after this summary)

## Files Created/Modified
- `vercel.json` - Vercel deployment config: framework, buildCommand (prisma generate && next build), installCommand
- `package.json` - build script updated to include prisma generate; postinstall hook added
- `.env.example` - Documents both SQLite (local) and Neon PostgreSQL (production) env vars
- `next.config.ts` - Added serverExternalPackages: ['better-sqlite3'] for native module exclusion

## Decisions Made
- Kept `provider = "sqlite"` in `prisma/schema.prisma` — Prisma 7 raises P1012 if `env()` is used in the `provider` field, which the original plan called for
- Production Neon PostgreSQL configured entirely via Vercel dashboard environment variables (DATABASE_URL pointing to Neon connection string), not via prisma.config.ts dual-provider switching
- `serverExternalPackages` was required to make the build succeed on Vercel — better-sqlite3 is a native .node module that cannot be bundled by webpack/turbopack

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma 7 does not support env() in datasource provider field**
- **Found during:** Task 1 (Configure Vercel deployment)
- **Issue:** Plan specified updating schema.prisma datasource to `provider = env("DATABASE_PROVIDER")`. Prisma 7 raises P1012 validation error: the `provider` field does not accept dynamic values via `env()`
- **Fix:** Kept `provider = "sqlite"` literal in schema.prisma. Production database (Neon PostgreSQL) is configured via DATABASE_URL in Vercel dashboard env vars; the Prisma client uses the adapter pattern already established in 01-01
- **Files modified:** prisma/schema.prisma (no change needed — plan's step was skipped)
- **Verification:** `npx prisma validate` succeeds; Vercel build log shows successful `prisma generate && next build`
- **Committed in:** 6189df5 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added serverExternalPackages for better-sqlite3**
- **Found during:** Task 1 (Vercel build step)
- **Issue:** better-sqlite3 is a native Node.js module (.node binary). Without excluding it from the Next.js bundler, Vercel's Lambda build fails when webpack/turbopack attempts to inline the native module
- **Fix:** Added `serverExternalPackages: ['better-sqlite3']` to next.config.ts
- **Files modified:** next.config.ts
- **Verification:** Vercel build succeeded; deployed app renders placeholder page
- **Committed in:** 6189df5 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 - Bug, 1 Rule 2 - Missing Critical)
**Impact on plan:** Both fixes were necessary adaptations to Prisma 7's stricter validation and Vercel's Lambda build constraints. No scope creep. Plan intent (working public deployment) fully achieved.

## Issues Encountered
- **Auth gate:** Vercel CLI authentication was required before deployment could proceed. This was handled as an auth gate checkpoint — the previous agent stopped and the user completed the login flow manually. After authentication, deployment was triggered and completed successfully.
- **Checkpoint approved:** User visited the deployed Vercel URL and confirmed the placeholder page ("D&D Session Planner — coming soon") loaded correctly. Human-verify checkpoint resolved with "approved".

## User Setup Required
**Production database requires Vercel dashboard configuration.** For any new Vercel project cloned from this repo:
- Set `DATABASE_URL` in Vercel dashboard → Settings → Environment Variables to a Neon PostgreSQL connection string
- Run `npx prisma db push` against the production database (or use Prisma Migrate for production migrations in later phases)

Local development: copy `.env.example` to `.env`, run `npm install && npm run db:seed && npm run dev`.

## Next Phase Readiness
- Public Vercel URL confirmed live — all future phases deploy to this same Vercel project
- Local dev unaffected: SQLite still the local database, `npm run dev` works without any env changes
- prisma generate runs automatically on every `npm install` and `vercel --prod` via postinstall hook and vercel.json buildCommand
- Phase 2 (campaign creation) can begin immediately

---
*Phase: 01-foundation*
*Completed: 2026-02-24*

## Self-Check: PASSED

- FOUND: vercel.json
- FOUND: package.json
- FOUND: .env.example
- FOUND: next.config.ts
- FOUND: .planning/phases/01-foundation/01-03-SUMMARY.md
- FOUND commit 6189df5 (Task 1: configure Vercel deployment)
