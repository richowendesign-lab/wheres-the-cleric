---
phase: 07-join-flow
plan: 01
subsystem: ui
tags: [next.js, prisma, server-actions, cookies, react]

# Dependency graph
requires:
  - phase: 06-campaign-creation
    provides: Campaign with joinToken + dmSecret, dm_secret cookie pattern, createCampaign action
  - phase: 05-schema-migration
    provides: v1.1 schema with PlayerSlot model and joinToken on Campaign

provides:
  - Smart join page at /join/[joinToken] with server-side cookie-based routing
  - registerPlayer server action that creates PlayerSlot and sets player_id cookie
  - JoinForm client component with useActionState for inline error display

affects: [07-join-flow, 08-availability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server component reads cookies before any JSX and fires redirects (DM/returning player)"
    - "useActionState in client component for server action error display"
    - "Hidden form fields pass campaignId and joinToken to server action"

key-files:
  created:
    - src/app/join/[joinToken]/page.tsx
    - src/app/join/[joinToken]/JoinForm.tsx
    - src/lib/actions/player.ts
  modified: []

key-decisions:
  - "JoinForm extracted to separate file (JoinForm.tsx) rather than inline — cleaner separation of 'use client' boundary"
  - "player_id cookie set without secure: true — consistent with dm_secret decision (Vercel enforces HTTPS at platform level)"
  - "redirect() called as final statement in registerPlayer (outside try/catch) — Next.js redirect() throws internally"

patterns-established:
  - "Pattern: server component cookie routing — read cookies, check identity, redirect before JSX"
  - "Pattern: client form wrapper — JoinForm uses useActionState, receives action as prop from server component"

requirements-completed: [JOIN-01, JOIN-02, JOIN-03, JOIN-04]

# Metrics
duration: 1min
completed: 2026-03-02
---

# Phase 7 Plan 1: Join Flow Summary

**Smart join page at /join/[joinToken] with server-side cookie routing (DM to dashboard, returning player to availability, new visitor to name form) and registerPlayer action that creates a PlayerSlot and sets player_id cookie**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-02T17:12:09Z
- **Completed:** 2026-03-02T17:13:18Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- registerPlayer server action validates name, creates PlayerSlot, sets httpOnly player_id cookie, redirects to availability
- Smart join page routes DM visitors to /campaigns/[id] before any JSX renders (server-side)
- Smart join page routes returning players (player_id cookie matches a slot in this campaign) to /join/[joinToken]/availability
- New visitors see minimal name entry form — no nav, no header, amber heading on dark bg
- Build passes with zero TypeScript errors; /join/[joinToken] appears as a dynamic route

## Task Commits

Each task was committed atomically:

1. **Task 1: registerPlayer server action** - `bf61db5` (feat)
2. **Task 2: Smart join page with name entry form** - `95d3661` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/lib/actions/player.ts` - registerPlayer server action: validates name, creates PlayerSlot, sets player_id cookie, redirects
- `src/app/join/[joinToken]/page.tsx` - Async server component: looks up campaign by joinToken, runs DM/player cookie checks, falls through to JoinForm for new visitors
- `src/app/join/[joinToken]/JoinForm.tsx` - 'use client' component using useActionState to display inline validation errors from registerPlayer

## Decisions Made
- JoinForm extracted to `JoinForm.tsx` rather than inlined in `page.tsx` — cleaner 'use client' boundary, easier to test in isolation
- player_id cookie set without `secure: true` — consistent with Phase 6 dm_secret decision; Vercel enforces HTTPS at platform level
- redirect() placed as the final statement in registerPlayer (not inside try/catch) — Next.js redirect() works by throwing internally; wrapping in try/catch would catch and suppress the redirect

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- /join/[joinToken] route is live and fully functional for routing
- registerPlayer action is ready to be called from the form
- /join/[joinToken]/availability page does not yet exist — Phase 7 Plan 2 will build it
- No blockers for continuing join flow implementation

---
*Phase: 07-join-flow*
*Completed: 2026-03-02*
