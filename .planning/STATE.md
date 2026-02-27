# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.
**Current focus:** Milestone v1.1 — Simplified Onboarding

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-27 — Milestone v1.1 started

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Carried forward from v1.0:

- Private invite links over accounts (lower friction for players — no signup required)
- Open availability over polls (DM sees full picture, not just pre-selected dates)
- No automated reminders (DM handles nudging; keeps app simple)
- [Phase 01-foundation]: Prisma 7 with PrismaNeon driver adapter (Pool) for Neon PostgreSQL
- [Phase 01-foundation]: Generated Prisma client to src/generated/prisma; import from @/generated/prisma/client
- [Phase 01-foundation]: serverExternalPackages configured in next.config.ts for native modules
- [Phase 02-campaign]: Server Action in src/lib/actions/; client component holds useActionState for error display (React 19 pattern)
- [Phase 02-campaign]: font-fantasy Tailwind utility via @theme --font-cinzel CSS variable (Tailwind CSS 4 pattern)
- [Phase 02-campaign]: NEXT_PUBLIC_APP_URL with localhost:3000 fallback for URL construction
- [Phase 02-campaign]: Next.js async params — type as Promise<{ token: string }>, await before destructuring
- [Phase 03-availability]: $transaction([deleteMany, createMany]) for weekly pattern
- [Phase 03-availability]: toggleDateOverride accepts status: 'free' | 'busy' | null — null triggers delete
- [Phase 03-availability]: No revalidatePath in actions — client manages optimistic state
- [Phase 04-dashboard]: Override-beats-weekly resolution in resolvePlayerStatusOnDate
- [Phase 04-dashboard]: Dates serialized via toISOString().split('T')[0] on server before reaching client
- [Phase 04-dashboard]: computeDayStatuses called server-side, passed as plain DayAggregation[] to client components

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-27
Stopped at: Starting milestone v1.1 requirements
Resume file: None
