---
phase: 06-campaign-creation
plan: 01
subsystem: ui
tags: [nextjs, cookies, server-actions, next-headers]

# Dependency graph
requires:
  - phase: 05-schema-migration
    provides: "Campaign model with joinToken and dmSecret fields"
provides:
  - "dm_secret httpOnly cookie set on campaign creation"
  - "Campaign dashboard displaying join link with copy button"
affects: [join-flow, player-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "cookies() from next/headers for setting httpOnly cookies in server actions"
    - "NEXT_PUBLIC_APP_URL env var for constructing shareable URLs"

key-files:
  created: []
  modified:
    - src/lib/actions/campaign.ts
    - src/app/campaigns/[id]/page.tsx

key-decisions:
  - "No secure: true on dm_secret cookie — Next.js dev is HTTP; Vercel enforces HTTPS automatically"
  - "Join Link section placed as first content section on dashboard for prominent visibility"

patterns-established:
  - "Server action cookie pattern: await cookies() then .set() before redirect()"
  - "Join URL construction: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000' + /join/${token}"

requirements-completed: [CAMP-11, CAMP-12, CAMP-13]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 6 Plan 01: Campaign Creation Summary

**dm_secret httpOnly cookie set by createCampaign server action, campaign dashboard shows shareable join URL with copy button as first content section**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T16:44:40Z
- **Completed:** 2026-03-02T16:46:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `createCampaign` server action now sets `dm_secret` as httpOnly, 1-year cookie (value = `campaign.dmSecret`) before redirecting to dashboard
- Campaign dashboard constructs `joinUrl` from `NEXT_PUBLIC_APP_URL` + `campaign.joinToken` and renders a "Join Link" section with monospace URL display and `CopyLinkButton`
- Join Link section is the first content section after the heading, visible immediately when DM lands on dashboard

## Task Commits

Each task was committed atomically:

1. **Task 1: Set DM cookie in createCampaign server action** - `82030b5` (feat)
2. **Task 2: Display join link on campaign dashboard** - `50e93ad` (feat)

## Files Created/Modified
- `src/lib/actions/campaign.ts` - Added `cookies` import and cookie set before redirect
- `src/app/campaigns/[id]/page.tsx` - Added CopyLinkButton import, joinUrl construction, and Join Link section

## Decisions Made
- No `secure: true` on `dm_secret` cookie — plan specified this explicitly to avoid breaking local dev over HTTP. Vercel enforces HTTPS at the platform level.
- Join Link rendered as first content section after `<h1>` — maximum visibility for the DM immediately after creation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- DM cookie and join link display are complete; ready for the join flow (player visits `/join/[joinToken]`)
- No blockers or concerns

## Self-Check

- [x] `src/lib/actions/campaign.ts` exists and contains `cookies` import and `dm_secret` cookie set
- [x] `src/app/campaigns/[id]/page.tsx` exists and contains `joinUrl` and `CopyLinkButton`
- [x] Commit `82030b5` exists (Task 1)
- [x] Commit `50e93ad` exists (Task 2)
- [x] `npm run build` passed with zero errors after both tasks

## Self-Check: PASSED

---
*Phase: 06-campaign-creation*
*Completed: 2026-03-02*
