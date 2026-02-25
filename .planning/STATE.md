# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.
**Current focus:** Phase 3 - Availability (complete)

## Current Position

Phase: 3 of 4 (Availability)
Plan: 3 of 3 in current phase
Status: Phase 3 complete — all plans done
Last activity: 2026-02-25 — 03-03 complete (AvailabilityForm integration, auto-save, invite page wired)

Progress: [████████░░] 75%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 11min
- Total execution time: 93min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 40min | 13.3min |
| 02-campaign | 3/3 | 45min | 15min |
| 03-availability | 3/3 | ~13min | ~4.3min |

**Recent Trend:**
- Last 5 plans: 8min, 25min, 15min, 10min, ~3min, ~2min, ~8min
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
- [Phase 02-campaign]: Server Action in src/lib/actions/; CampaignForm client component holds useActionState for error display (React 19 pattern)
- [Phase 02-campaign]: font-fantasy Tailwind utility via @theme --font-cinzel CSS variable (Tailwind CSS 4 pattern)
- [Phase 02-campaign 02-02]: updatePlanningWindow.bind(null, campaign.id) pre-binds campaignId before passing to useActionState — standard React 19 pattern for extra Server Action args
- [Phase 02-campaign 02-02]: NEXT_PUBLIC_APP_URL with localhost:3000 fallback for invite URL construction — no hardcoded URLs in production
- [Phase 02-campaign 02-03]: Next.js 15 async params — type as Promise<{ token: string }>, await before destructuring (direct access causes runtime error)
- [Phase 02-campaign 02-03]: Route-scoped not-found.tsx at invite/[token]/ so friendly error only applies to invite 404s, not the whole app
- [Phase 02-campaign 02-03]: Dark theme date inputs — filter: invert(1) on ::-webkit-calendar-picker-indicator in globals.css for calendar icon visibility
- [Phase 03-availability 03-01]: Used $transaction([deleteMany, createMany]) for weekly pattern — simpler than upsert, avoids 3-field composite unique
- [Phase 03-availability 03-01]: toggleDateOverride accepts status: 'free' | 'busy' | null — null triggers delete (removes override)
- [Phase 03-availability 03-01]: No revalidatePath calls in actions — client manages its own optimistic state for snappy auto-save UX
- [Phase 03-availability 03-02]: WeeklySchedule uses Set<string> with '{dow}-{time}' key format matching AvailabilityEntry dayOfWeek/timeOfDay convention
- [Phase 03-availability 03-02]: AvailabilityCalendar renders months stacked vertically (scrollable) — simpler than paginated; Claude's discretion per CONTEXT.md
- [Phase 03-availability 03-03]: SaveIndicator retry triggers debouncedSaveWeekly.flush() — re-sends last weekly state immediately without re-toggle
- [Phase 03-availability 03-03]: Calendar section conditionally rendered only when both planningWindowStart and planningWindowEnd are non-empty strings
- [Phase 03-availability 03-03]: Date override optimistic rollback uses captured overrides closure (pre-click state) to revert on server error

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-25
Stopped at: Completed 03-03-PLAN.md — AvailabilityForm integration, auto-save wired to Server Actions, invite page updated, Phase 3 complete
Resume file: None
