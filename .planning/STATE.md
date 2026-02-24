# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.
**Current focus:** Phase 1 - Foundation (complete)

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 3 of 3 in current phase
Status: Phase complete — all 3 plans done
Last activity: 2026-02-24 — 01-03 complete (Vercel deployment live, human-verify approved)

Progress: [███░░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 13.3min
- Total execution time: 40min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 40min | 13.3min |

**Recent Trend:**
- Last 5 plans: 7min, 8min, 25min
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Private invite links over accounts (lower friction for players — no signup required)
- Open availability over polls (DM sees full picture, not just pre-selected dates)
- No automated reminders (DM handles nudging; keeps app simple)
- [Phase 01-foundation]: Prisma 7 with PrismaBetterSqlite3 driver adapter for local SQLite (breaking change from Prisma 5/6)
- [Phase 01-foundation]: Generated Prisma client to src/generated/prisma; import from @/generated/prisma/client
- [Phase 01-foundation]: Database path resolved via process.cwd() + 'prisma/dev.db' in prisma.ts singleton
- [Phase 01-foundation 01-02]: Prisma 7 seed configured in prisma.config.ts migrations.seed field (not package.json "prisma" key)
- [Phase 01-foundation 01-02]: Use npx tsx for seed scripts — Prisma 7 generated client is ESM-only (import.meta.url); ts-node CommonJS mode fails
- [Phase 01-foundation 01-02]: Seed script uses relative import path ../src/generated/prisma/client (not @/ alias — not resolved outside Next.js bundler)
- [Phase 01-foundation 01-03]: Prisma 7 does not support env() in datasource provider field (P1012 error) — schema.prisma keeps provider="sqlite"; production DB (Neon PostgreSQL) configured via Vercel dashboard env vars
- [Phase 01-foundation 01-03]: serverExternalPackages: ['better-sqlite3'] added to next.config.ts — prevents webpack/turbopack from bundling native .node module in Vercel Lambda environment
- [Phase 01-foundation 01-03]: Production database configured via DATABASE_URL in Vercel dashboard (not dual-provider prisma.config.ts) — simpler and avoids Prisma 7 P1012 env() limitation

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 01-03-PLAN.md — Phase 1 Foundation fully complete
Resume file: None
