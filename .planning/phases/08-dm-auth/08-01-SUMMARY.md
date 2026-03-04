---
phase: 08-dm-auth
plan: "01"
subsystem: auth
tags: [bcryptjs, prisma, postgresql, session, cookies, nextjs]

# Dependency graph
requires: []
provides:
  - DM model in PostgreSQL (id, email unique, passwordHash, createdAt)
  - Session model in PostgreSQL (id, token unique/auto, dmId FK cascade, expiresAt, createdAt)
  - hashPassword(password) utility using bcrypt with 12 rounds
  - verifyPassword(password, hash) utility
  - createSession(dmId) inserts Session row and returns token string (30-day expiry)
  - getSessionDM() reads dm_session_token cookie and returns DM or null
  - SESSION_COOKIE_NAME constant ('dm_session_token')
affects:
  - 08-02-signup
  - 08-03-login
  - 08-04-logout
  - 08-05-middleware
  - 08-06-dm-home

# Tech tracking
tech-stack:
  added: [bcryptjs@3.0.3, @types/bcryptjs@2.4.6]
  patterns:
    - "Server-only module for auth utilities (no use client)"
    - "Session-based auth via httpOnly cookie dm_session_token"
    - "Prisma session lookup with include: { dm: true } for single query"
    - "Expiry check on session read (session.expiresAt < new Date())"

key-files:
  created:
    - src/lib/auth.ts
  modified:
    - prisma/schema.prisma
    - package.json

key-decisions:
  - "bcryptjs over bcrypt: pure JS, no native compilation, works on Vercel Edge"
  - "30-day session duration with server-side expiry check on every read"
  - "BCRYPT_ROUNDS=12 for security/performance balance"
  - "db push (not migrate) for schema changes — works for both SQLite dev and Neon prod"

patterns-established:
  - "Auth utilities live in src/lib/auth.ts as server-only module"
  - "Session cookie name exported as SESSION_COOKIE_NAME constant for reuse"
  - "getSessionDM returns null for missing OR expired sessions — callers treat both the same"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 8min
completed: 2026-03-04
---

# Phase 08 Plan 01: DM Auth Infrastructure Summary

**Prisma DM + Session models with bcrypt password utilities and server-side session management via httpOnly cookie**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-04T13:21:41Z
- **Completed:** 2026-03-04T13:29:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- DM and Session models added to Prisma schema and pushed to Neon PostgreSQL (cascade delete on DM removes sessions)
- bcryptjs installed (pure JS, no native build required, Edge-compatible)
- `src/lib/auth.ts` created with all 5 exports: SESSION_COOKIE_NAME, hashPassword, verifyPassword, createSession, getSessionDM
- TypeScript compiles cleanly, Prisma schema validates

## Task Commits

Each task was committed atomically:

1. **Task 1: Add DM and Session models to Prisma schema and install bcrypt** - `5e33d8f` (feat)
2. **Task 2: Create src/lib/auth.ts with session utilities** - `b46075c` (feat)

**Plan metadata:** (docs commit — created after SUMMARY)

## Files Created/Modified
- `prisma/schema.prisma` - Added model DM (email unique, passwordHash, sessions relation) and model Session (token auto-cuid, dmId FK, expiresAt, cascade delete)
- `src/lib/auth.ts` - Auth utility module: hashPassword, verifyPassword, createSession, getSessionDM, SESSION_COOKIE_NAME
- `package.json` - Added bcryptjs dependency and @types/bcryptjs devDependency

## Decisions Made
- Used bcryptjs (pure JS) over bcrypt (native) — no native compilation, works on Vercel Edge without extra config
- Session expiry is 30 days; token is an auto-generated cuid() from Prisma (no manual UUID generation needed)
- BCRYPT_ROUNDS=12 — standard security/performance tradeoff for server-side auth
- Used `db push` instead of `migrate dev` — appropriate for both SQLite (local) and Neon PostgreSQL (production) without migration file overhead

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required. Database credentials already configured via DATABASE_URL environment variable.

## Next Phase Readiness
- Auth infrastructure complete — DM and Session tables exist in database, all utility functions available
- Plans 08-02 (sign up), 08-03 (login), 08-04 (logout), 08-05 (middleware) all import from `src/lib/auth.ts`
- No blockers.

---
*Phase: 08-dm-auth*
*Completed: 2026-03-04*
