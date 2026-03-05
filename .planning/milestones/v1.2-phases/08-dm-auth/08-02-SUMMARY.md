---
phase: 08-dm-auth
plan: "02"
subsystem: auth
tags: [nextjs, server-actions, middleware, cookies, prisma, bcryptjs]

# Dependency graph
requires:
  - phase: 08-01
    provides: hashPassword, verifyPassword, createSession, SESSION_COOKIE_NAME, getSessionDM from src/lib/auth.ts
provides:
  - signUp server action (email/password validation, DM record creation, session cookie, redirect)
  - logIn server action (credential verification, session cookie, redirect)
  - logOut server action (session deletion, cookie clearance, redirect)
  - Next.js middleware protecting /campaigns/* routes from unauthenticated access
  - Redirect-if-authed logic for /auth/login and /auth/signup
affects:
  - 08-03-login-page
  - 08-04-signup-page
  - 08-05-dm-home
  - 08-06-nav

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server actions use 'use server' directive with FormData params and _prevState for useFormState compatibility"
    - "Session cookie set with httpOnly, sameSite: lax, secure: production-only, maxAge: 30 days"
    - "Middleware cookie-presence-only check (no Prisma — Edge runtime constraint)"
    - "Real session validation delegated to getSessionDM() in Server Components"

key-files:
  created:
    - src/lib/actions/auth.ts
    - src/middleware.ts
  modified: []

key-decisions:
  - "Inline SESSION_COOKIE_NAME in middleware (cannot import from @/lib/auth — Edge runtime incompatibility with next/headers cookies())"
  - "Middleware appends ?next=pathname on protected redirect — captured for future redirect-after-login, not implemented in Phase 8"
  - "middleware.ts filename used per plan spec despite Next.js 16 deprecation warning (functional, build succeeds)"

patterns-established:
  - "Auth server actions return { error: string } for validation failures, redirect() for success"
  - "logIn/signUp use identical error message for credential failures — no field distinction to prevent enumeration attacks"
  - "prisma.dM accessor (camelCase with capital M) for DM model — verified in generated Prisma client"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 08 Plan 02: Auth Server Actions + Middleware Summary

**signUp/logIn/logOut server actions with httpOnly session cookie management, and Next.js Edge middleware protecting /campaigns/* from unauthenticated access**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T13:26:35Z
- **Completed:** 2026-03-04T13:28:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `src/lib/actions/auth.ts` created with all three auth actions: signUp validates and creates DM + session, logIn verifies bcrypt hash + creates session, logOut deletes session from DB + clears cookie
- `src/middleware.ts` created protecting /campaigns/* with cookie-presence check and redirect-if-authed for /auth/* pages
- TypeScript compiles cleanly (`npx tsc --noEmit` exits 0)
- `npm run build` succeeds — middleware runs as valid Edge code (no Prisma imports)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auth server actions (signUp, logIn, logOut)** - `99b4923` (feat)
2. **Task 2: Create Next.js middleware to protect /campaigns/* routes** - `ad477d1` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `src/lib/actions/auth.ts` - 'use server' module with signUp, logIn, logOut server actions; uses prisma.dM accessor, imports from @/lib/auth
- `src/middleware.ts` - Edge middleware with route protection for /campaigns/* and redirect-if-authed for /auth/login, /auth/signup; matcher config covers all relevant routes

## Decisions Made
- Inlined `SESSION_COOKIE_NAME = 'dm_session_token'` in middleware rather than importing from @/lib/auth — the auth.ts module imports `cookies()` from next/headers which is unavailable in Edge runtime
- Middleware appends `?next=pathname` query param on unauthenticated redirects for future redirect-after-login capability; the logIn action ignores this in Phase 8 (always redirects to /)
- Used `middleware.ts` filename per the plan specification — Next.js 16 shows a deprecation warning (suggests `proxy.ts`) but build succeeds and functionality is correct

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- Next.js 16.1.6 shows deprecation warning: `middleware.ts` → `proxy.ts` convention change. Build succeeds and middleware functions correctly. Noted for future migration.

## User Setup Required
None — no external service configuration required. All implementation is code-only.

## Next Phase Readiness
- Auth server actions and middleware complete — ready for UI layer (login/signup pages)
- Plans 08-03 (signup page), 08-04 (login page), 08-05 (DM home) can import signUp, logIn, logOut from `@/lib/actions/auth`
- No blockers.

---
*Phase: 08-dm-auth*
*Completed: 2026-03-04*

## Self-Check: PASSED

- src/lib/actions/auth.ts: FOUND
- src/middleware.ts: FOUND
- 08-02-SUMMARY.md: FOUND
- Commit 99b4923 (Task 1): FOUND
- Commit ad477d1 (Task 2): FOUND
