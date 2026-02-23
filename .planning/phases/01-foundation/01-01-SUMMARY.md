---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [next.js, typescript, tailwind, prisma, sqlite, better-sqlite3]

# Dependency graph
requires: []
provides:
  - Next.js 16 app scaffold with TypeScript, Tailwind CSS, and App Router
  - Prisma 7 SQLite schema with Campaign, PlayerSlot, and AvailabilityEntry models
  - Prisma singleton client via src/lib/prisma.ts using PrismaBetterSqlite3 adapter
  - Running dev server with placeholder page at localhost:3000
affects: [02-campaign-creation, 03-availability, 04-dashboard]

# Tech tracking
tech-stack:
  added:
    - next@16.1.6
    - react@19.2.3
    - typescript@5
    - tailwindcss@4
    - prisma@7.4.1
    - "@prisma/client@7.4.1"
    - "@prisma/adapter-better-sqlite3"
    - better-sqlite3
  patterns:
    - Prisma 7 driver adapter pattern for SQLite (PrismaBetterSqlite3 with explicit db path)
    - Global singleton PrismaClient to survive Next.js hot-reload in dev
    - Generated client output to src/generated/prisma (not node_modules)

key-files:
  created:
    - prisma/schema.prisma
    - prisma.config.ts
    - src/lib/prisma.ts
    - src/app/page.tsx
    - src/app/layout.tsx
    - .env.example
  modified:
    - .gitignore
    - package.json

key-decisions:
  - "Used Prisma 7 with PrismaBetterSqlite3 driver adapter instead of legacy url-based datasource (Prisma 7 breaking change)"
  - "Database path set to prisma/dev.db resolved via process.cwd() for consistent path in Next.js server context"
  - "cuid() IDs on all models for URL-safe unique identifiers"
  - "inviteToken uses @unique @default(cuid()) — one token per player, generated at slot creation"
  - "Cascade deletes: PlayerSlot.onDelete=Cascade from Campaign, AvailabilityEntry.onDelete=Cascade from PlayerSlot"

patterns-established:
  - "Prisma singleton: use src/lib/prisma.ts for all server-side DB access"
  - "Generated client: import from @/generated/prisma/client, not @prisma/client"
  - "Environment: DATABASE_URL in .env, .env.example committed as reference"

requirements-completed: []

# Metrics
duration: 7min
completed: 2026-02-23
---

# Phase 1 Plan 01: Foundation — Next.js Scaffold and Prisma Schema Summary

**Next.js 16 + Tailwind scaffold with full Prisma 7 SQLite schema defining Campaign, PlayerSlot, and AvailabilityEntry models**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-23T14:24:40Z
- **Completed:** 2026-02-23T14:31:23Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Next.js 16 app with TypeScript, Tailwind CSS, ESLint, and App Router scaffolded
- Prisma 7 domain schema with all three models (Campaign, PlayerSlot, AvailabilityEntry) with correct field types and cascade deletes
- SQLite database created at prisma/dev.db and Prisma client generated
- Singleton prisma.ts using Prisma 7's PrismaBetterSqlite3 driver adapter pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project with TypeScript and Tailwind** - `f4ae690` (feat)
2. **Task 2: Install Prisma and define the full data schema** - `48e4eee` (feat)

**Plan metadata:** (created after this summary)

## Files Created/Modified
- `prisma/schema.prisma` - Full domain schema: Campaign, PlayerSlot, AvailabilityEntry models
- `prisma.config.ts` - Prisma 7 config with datasource URL from DATABASE_URL env var
- `src/lib/prisma.ts` - Singleton PrismaClient using PrismaBetterSqlite3 adapter
- `src/app/page.tsx` - Minimal placeholder: "D&D Session Planner — coming soon"
- `src/app/layout.tsx` - Root layout with html/body and Tailwind globals
- `src/app/globals.css` - Tailwind base styles
- `.env.example` - DATABASE_URL reference for developers
- `.gitignore` - Excludes .env, prisma/dev.db, src/generated/prisma

## Decisions Made
- Prisma 7 driver adapter pattern required for SQLite (breaking change from Prisma 5/6 url-based approach)
- Used `@prisma/adapter-better-sqlite3` with `PrismaBetterSqlite3` for local SQLite connection
- Database path hardcoded via `path.resolve(process.cwd(), 'prisma/dev.db')` for reliable path resolution in Next.js server context
- Generated client output to `src/generated/prisma` (Prisma 7 default), not `node_modules/.prisma`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] create-next-app refused due to .planning/ directory conflict**
- **Found during:** Task 1 (Scaffold Next.js project)
- **Issue:** `create-next-app` refused to scaffold in the directory because `.planning/` already existed
- **Fix:** Scaffolded in `/tmp/my-portfolio-scaffold/` then rsynced files to project directory, then ran `npm install`
- **Files modified:** All scaffold files (package.json, next.config.ts, tsconfig.json, src/app/, etc.)
- **Verification:** `npm run build` compiled successfully
- **Committed in:** f4ae690 (Task 1 commit)

**2. [Rule 3 - Blocking] Prisma 7 breaking change: url no longer supported in schema.prisma datasource**
- **Found during:** Task 2 (Install Prisma and define the full data schema)
- **Issue:** Prisma 7 removed `url` from `datasource` in `schema.prisma` — must use `prisma.config.ts` only
- **Fix:** Removed `url = env("DATABASE_URL")` from the datasource block; URL is already in `prisma.config.ts`
- **Files modified:** prisma/schema.prisma
- **Verification:** `npx prisma db push` succeeded
- **Committed in:** 48e4eee (Task 2 commit)

**3. [Rule 3 - Blocking] Prisma 7 breaking change: PrismaClient requires driver adapter for SQLite**
- **Found during:** Task 2 (prisma.ts singleton creation)
- **Issue:** Prisma 7 PrismaClient constructor requires either `adapter` or `accelerateUrl` — the plan's `{ log: ['query'] }` config no longer compiles
- **Fix:** Installed `@prisma/adapter-better-sqlite3` and `better-sqlite3`; updated `src/lib/prisma.ts` to use `PrismaBetterSqlite3` adapter
- **Files modified:** src/lib/prisma.ts, package.json, package-lock.json
- **Verification:** `npm run build` compiled without TypeScript errors
- **Committed in:** 48e4eee (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 - Blocking)
**Impact on plan:** All three were necessary adaptations to Prisma 7's breaking API changes. No scope creep. Plan intent fully preserved.

## Issues Encountered
- Prisma 7 (released after plan was written) has three breaking changes from Prisma 5/6: (1) `url` removed from schema datasource, (2) `PrismaClient` constructor requires driver adapter, (3) generated client output path changed to `src/generated/prisma`. All handled automatically.

## User Setup Required
None — no external service configuration required. The SQLite database is local and auto-created by `npx prisma db push`.

## Next Phase Readiness
- Foundation complete: Next.js app runs, Prisma schema deployed, client importable
- All Phase 2-4 models are defined — no further schema changes expected
- Placeholder page confirms app starts at localhost:3000
- Run `npm run dev` to start; `npx prisma studio` to inspect database

---
*Phase: 01-foundation*
*Completed: 2026-02-23*

## Self-Check: PASSED

- FOUND: package.json
- FOUND: prisma/schema.prisma
- FOUND: prisma/dev.db
- FOUND: src/lib/prisma.ts
- FOUND: src/app/page.tsx
- FOUND: .env.example
- FOUND: 01-01-SUMMARY.md
- FOUND commit f4ae690 (Task 1)
- FOUND commit 48e4eee (Task 2)
