---
phase: 06-campaign-creation
plan: 02
subsystem: ui
tags: [nextjs, cookies, next-headers, server-component, redirect]

# Dependency graph
requires:
  - phase: 06-campaign-creation
    provides: "dm_secret httpOnly cookie set on campaign creation (plan 06-01)"
provides:
  - "Returning DM auto-redirected from home page to campaign dashboard via dm_secret cookie"
affects: [join-flow, player-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Async server component reading httpOnly cookie server-side before rendering JSX"
    - "Silent fallthrough when dm_secret cookie is stale (DB reset) — no error thrown"

key-files:
  created: []
  modified:
    - src/app/page.tsx

key-decisions:
  - "Silent fallthrough if dm_secret cookie exists but campaign not found — handles DB reset gracefully, DM can create new campaign"

patterns-established:
  - "Cookie-based server-side redirect pattern: await cookies() → findUnique → redirect() before JSX return"

requirements-completed: [CAMP-13]

# Metrics
duration: ~10min
completed: 2026-03-02
---

# Phase 6 Plan 02: Home Page Returning-DM Redirect Summary

**Async home page server component reads dm_secret cookie and redirects returning DM to their campaign dashboard before JSX renders**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-02T16:44:00Z
- **Completed:** 2026-03-02T16:54:42Z
- **Tasks:** 2 (1 auto + 1 human-verify)
- **Files modified:** 1

## Accomplishments
- `HomePage` converted to `async` server component — reads `dm_secret` cookie via `cookies()` from `next/headers` before any JSX renders
- If cookie is present and matches a campaign in the database, `redirect(/campaigns/[id])` fires server-side — the home page is never shown to a returning DM
- If cookie is absent or stale (no matching campaign), falls through silently to the existing home page JSX — DM can create a new campaign without error
- Human verification confirmed all 6 steps pass: no-cookie home page, campaign creation flow, cookie present in DevTools, return-visit redirect, copy-link button, browser-close-reopen redirect

## Task Commits

Each task was committed atomically:

1. **Task 1: Returning DM redirect on home page** - `ce05901` (feat)
2. **Task 2: Human verify full DM creation flow** - human-verified (no code changes)

## Files Created/Modified
- `src/app/page.tsx` - Converted to async server component; added cookies/redirect/prisma imports and dm_secret redirect logic before JSX return

## Decisions Made
- Silent fallthrough when cookie present but no matching campaign — plan specified this explicitly to handle DB resets gracefully without an error state.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Full DM creation flow is complete: create campaign → see join link → cookie set → returning visit auto-redirects
- Ready for Phase 6 Plan 3 (player join flow via `/join/[joinToken]`) or next phase
- No blockers or concerns

---
*Phase: 06-campaign-creation*
*Completed: 2026-03-02*
