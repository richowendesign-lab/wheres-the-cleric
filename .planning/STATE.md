# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.
**Current focus:** Phase 5 — Schema Migration (v1.1 Simplified Onboarding)

## Current Position

Phase: 5 of 7 in v1.1 (Schema Migration)
Plan: — of — in current phase
Status: Ready to plan
Last activity: 2026-02-27 — v1.1 roadmap created (phases 5-7 defined)

Progress: [████████░░░░░░░░░░░░] 40% (v1.0 complete, v1.1 not started)

## Performance Metrics

**Velocity:**
- Total plans completed: 14 (v1.0)
- Average duration: unknown
- Total execution time: unknown

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3 | — | — |
| 2. Campaign | 3 | — | — |
| 3. Availability | 4 | — | — |
| 4. Dashboard | 4 | — | — |

**Recent Trend:**
- v1.0 shipped in 3 days (14 plans)
- Trend: Baseline established

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Carried forward from v1.0:

- [Phase 01-foundation]: Prisma 7 with PrismaNeon driver adapter (Pool) for Neon PostgreSQL
- [Phase 01-foundation]: Generated Prisma client to src/generated/prisma; import from @/generated/prisma/client
- [Phase 01-foundation]: serverExternalPackages configured in next.config.ts for native modules
- [Phase 02-campaign]: Server Action in src/lib/actions/; client component holds useActionState for error display (React 19 pattern)
- [Phase 02-campaign]: NEXT_PUBLIC_APP_URL with localhost:3000 fallback for URL construction
- [Phase 02-campaign]: Next.js async params — type as Promise<{ token: string }>, await before destructuring
- [Phase 03-availability]: $transaction([deleteMany, createMany]) for weekly pattern
- [Phase 03-availability]: No revalidatePath in actions — client manages optimistic state
- [Phase 04-dashboard]: Override-beats-weekly resolution in resolvePlayerStatusOnDate
- [Phase 04-dashboard]: computeDayStatuses called server-side, passed as plain DayAggregation[] to client components
- [v1.1 migration]: Existing v1.0 data will be wiped; schema drops name/dmName from Campaign, drops inviteToken from PlayerSlot, adds joinToken + dmSecret to Campaign

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-27
Stopped at: v1.1 roadmap created — ready to plan Phase 5
Resume file: None
