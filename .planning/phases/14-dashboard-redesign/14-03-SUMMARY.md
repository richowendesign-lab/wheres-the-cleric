---
phase: 14-dashboard-redesign
plan: "03"
subsystem: ui
tags: [react, nextjs, tabs, client-component, server-component, typescript]

# Dependency graph
requires:
  - phase: 14-01
    provides: UpdatePlanningWindowForm with string props; BestDaysList with dmExceptionMode
  - phase: 14-02
    provides: DashboardCalendar with prev/next navigation
  - phase: 13-dm-availability-exceptions
    provides: DmExceptionCalendar component and dmExceptionDates/dmExceptionMode data
provides:
  - CampaignTabs Client Component managing Availability and Settings tab state
  - CampaignDetailPage refactored to pass all serialised props to CampaignTabs
  - Availability tab: Awaiting Response -> DashboardCalendar+BestDaysList -> DmExceptionCalendar
  - Settings tab: Join Link+UpdateMaxPlayersForm -> UpdatePlanningWindowForm -> DeleteCampaignButton
affects: [14-04, phase-15-shareable-message]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component passes all data as serialised props to a single Client Component boundary
    - Client Component owns tab state (useState); no URL change on tab switch
    - ARIA tablist/tab pattern for accessible tab navigation

key-files:
  created:
    - src/components/CampaignTabs.tsx
  modified:
    - src/app/campaigns/[id]/page.tsx
    - src/components/DeleteCampaignButton.tsx

key-decisions:
  - "CampaignTabs is the single Server->Client boundary: all data is serialised in page.tsx before passing through"
  - "Tab state is client-side only (useState) — no URL change preserves simplicity"
  - "Header, title, description and ShareModal stay outside tabs — always visible"
  - "Availability tab default keeps scheduling data front and centre per DASH-05"

patterns-established:
  - "Single-boundary pattern: Server Component fetches, serialises, then hands off to one Client Component"

requirements-completed: [DASH-03, DASH-05]

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 14 Plan 03: CampaignTabs Summary

**CampaignTabs Client Component wires all availability and settings UI behind a two-tab interface, with CampaignDetailPage reduced to a thin data-fetching server shell passing serialised props**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-10T14:45:21Z
- **Completed:** 2026-03-10T14:48:11Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- New `CampaignTabs` 'use client' component with `activeTab` state defaulting to 'availability'
- Availability tab renders sections in locked order: Awaiting Response -> Group Availability (DashboardCalendar + BestDaysList side by side) -> DM Availability Exceptions
- Settings tab renders: Join Link + UpdateMaxPlayersForm -> Planning Window -> Danger Zone
- `CampaignDetailPage` reduced from ~90 lines of JSX to ~30; all component imports moved inside CampaignTabs
- Zero Date objects cross the Server->Client boundary — all props are strings, arrays, or primitives

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CampaignTabs Client Component** - `a797d5f` (feat)
2. **Task 2: Refactor CampaignDetailPage to use CampaignTabs** - `edb6c36` (feat)
3. **Auto-fix: DeleteCampaignButton startTransition type error** - `ba707f5` (fix)

## Files Created/Modified
- `src/components/CampaignTabs.tsx` - New 'use client' component; owns tab state and renders both tab panels
- `src/app/campaigns/[id]/page.tsx` - Refactored Server Component; now a thin data-fetching shell passing props to CampaignTabs
- `src/components/DeleteCampaignButton.tsx` - Fixed pre-existing startTransition async type error (blocking build)

## Decisions Made
- CampaignTabs is the single Server->Client boundary — all serialisation happens in page.tsx before the props are passed
- Tab state is `useState` only — no router.push or URL param changes; keeps the UX simple
- Header row, campaign title/description, and ShareModal remain outside `CampaignTabs` — they are always visible regardless of active tab

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DeleteCampaignButton startTransition type error**
- **Found during:** Task 2 verification (full build check)
- **Issue:** `startTransition(() => deleteCampaign(campaignId))` — `deleteCampaign` returns `Promise<{ error } | void>`, but React's `startTransition` callback must return `VoidOrUndefined`. TypeScript error was pre-existing but now blocking the production build after CampaignTabs integration.
- **Fix:** Changed to `startTransition(async () => { await deleteCampaign(campaignId) })` — async wrapper discards the return value, satisfying the type constraint
- **Files modified:** src/components/DeleteCampaignButton.tsx
- **Verification:** `npx tsc --noEmit` exits with zero errors; `npm run build` succeeds
- **Committed in:** ba707f5

---

**Total deviations:** 1 auto-fixed (Rule 1 - pre-existing bug surfaced by build verification)
**Impact on plan:** Fix necessary for build to succeed. No scope creep; single-line change.

## Issues Encountered
- Pre-existing `UpdatePlanningWindowForm` call in page.tsx was passing `campaign` object instead of string props (fixed in Plan 14-01 but page.tsx not updated at the time). My refactoring corrected this as part of the normal rewrite — not a deviation, just cleanup folded into Task 2.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CampaignTabs is wired and building cleanly — Phase 14 Plan 04 can proceed
- DASH-03 and DASH-05 requirements satisfied
- All availability and settings UI is now tab-gated; Phase 15 (shareable message) can reference the final layout

---
*Phase: 14-dashboard-redesign*
*Completed: 2026-03-10*

## Self-Check: PASSED

- FOUND: src/components/CampaignTabs.tsx
- FOUND: src/app/campaigns/[id]/page.tsx
- FOUND: .planning/phases/14-dashboard-redesign/14-03-SUMMARY.md
- FOUND commit: a797d5f (feat: create CampaignTabs)
- FOUND commit: edb6c36 (feat: refactor CampaignDetailPage)
- FOUND commit: ba707f5 (fix: DeleteCampaignButton type error)
