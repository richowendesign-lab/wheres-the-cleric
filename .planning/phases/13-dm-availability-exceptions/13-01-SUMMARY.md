---
phase: 13-dm-availability-exceptions
plan: 01
subsystem: api
tags: [prisma, server-actions, typescript, react, nextjs]

# Dependency graph
requires:
  - phase: 11-schema-foundation-calendar-utilities
    provides: DmAvailabilityException schema and dmExceptionMode on Campaign
provides:
  - DayAggregation.dmBlocked boolean field required on all aggregations
  - computeDayStatuses accepts optional dmExceptionDateKeys Set parameter
  - toggleDmException Server Action with auth guard and Date.UTC safe upsert/deleteMany
  - setDmExceptionMode Server Action with auth guard and revalidatePath
  - CampaignDetailPage wires dmAvailabilityExceptions into computeDayStatuses
  - Shared Toast component extracted from AvailabilityForm for reuse in DmExceptionCalendar
affects:
  - 13-02-dm-exception-calendar-ui
  - 14-dashboard-redesign
  - 15-shareable-message

# Tech tracking
tech-stack:
  added: []
  patterns:
    - toggleDmException follows same Date.UTC + upsert/deleteMany discipline as toggleDateOverride
    - Server Actions that only manage optimistic-state data do NOT call revalidatePath
    - Server Actions that change rendering-critical data (mode) DO call revalidatePath
    - Shared UI components extracted to src/components/ for cross-feature reuse

key-files:
  created:
    - src/components/Toast.tsx
  modified:
    - src/lib/availability.ts
    - src/lib/actions/campaign.ts
    - src/components/AvailabilityForm.tsx
    - src/app/campaigns/[id]/page.tsx

key-decisions:
  - "toggleDmException does NOT call revalidatePath — client manages optimistic state (same discipline as toggleDateOverride)"
  - "setDmExceptionMode DOES call revalidatePath — mode change requires Server Component re-render with new exceptionMode prop"
  - "dmBlocked is required (not optional) on DayAggregation — TypeScript enforces at all call sites"
  - "dmExceptionDateKeys and dmExceptionDates computed in CampaignDetailPage but not yet consumed in JSX (Plan 13-02 adds DmExceptionCalendar)"
  - "Toast text changed from 'Availability saved' to generic 'Saved' to support reuse in DmExceptionCalendar"

patterns-established:
  - "toggleDm* Server Actions: auth guard (getSessionDM + dmId check) -> Date.UTC parse -> upsert/deleteMany -> return { success: true } | { error: string }"
  - "CampaignDetailPage: serialize DB dates to Set<string> for O(1) lookup, pass to computeDayStatuses as optional param"

requirements-completed: [DMEX-01, DMEX-02, DMEX-04]

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 13 Plan 01: DM Availability Exceptions Data Layer Summary

**DayAggregation extended with required dmBlocked field, toggleDmException and setDmExceptionMode Server Actions added with auth guards, and CampaignDetailPage wired to pass exception date keys into computeDayStatuses**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-10T09:49:00Z
- **Completed:** 2026-03-10T09:57:46Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extracted shared Toast component from AvailabilityForm into src/components/Toast.tsx with generic "Saved" text
- Extended DayAggregation with required dmBlocked boolean; computeDayStatuses accepts optional dmExceptionDateKeys Set
- Added toggleDmException Server Action: auth-guarded, Date.UTC safe, upsert/deleteMany, no revalidatePath
- Added setDmExceptionMode Server Action: auth-guarded, calls revalidatePath for re-render on mode change
- CampaignDetailPage now queries dmAvailabilityExceptions, builds dmExceptionDateKeys Set, and passes it to computeDayStatuses

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract Toast to shared component + extend DayAggregation with dmBlocked** - `23768cb` (feat)
2. **Task 2: Add toggleDmException + setDmExceptionMode Server Actions; update CampaignDetailPage** - `ab70f91` (feat)

## Files Created/Modified
- `src/components/Toast.tsx` - Shared save-status toast (exported Toast and SaveStatus type); text changed to generic "Saved"
- `src/lib/availability.ts` - DayAggregation.dmBlocked added as required field; computeDayStatuses accepts optional dmExceptionDateKeys
- `src/lib/actions/campaign.ts` - toggleDmException and setDmExceptionMode Server Actions added
- `src/components/AvailabilityForm.tsx` - Local Toast function and SaveStatus type removed; imports from @/components/Toast
- `src/app/campaigns/[id]/page.tsx` - dmAvailabilityExceptions included in Prisma query; dmExceptionDateKeys Set built and passed to computeDayStatuses; dmExceptionMode and dmExceptionDates variables computed for Plan 13-02

## Decisions Made
- toggleDmException does NOT call revalidatePath — client manages optimistic state (same discipline as toggleDateOverride in availability.ts)
- setDmExceptionMode DOES call revalidatePath — mode change requires Server Component to re-render with new exceptionMode prop
- dmBlocked is required (not optional) on DayAggregation — TypeScript enforces correctness at all call sites
- Toast "Availability saved" text genericized to "Saved" so the component works in both AvailabilityForm and the upcoming DmExceptionCalendar
- dmExceptionDates array and dmExceptionMode variables computed in CampaignDetailPage now (but not yet consumed in JSX) — Plan 13-02 adds DmExceptionCalendar that will receive them as props

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript error in src/components/DeleteCampaignButton.tsx (Promise return type mismatch) was present before this plan and is out of scope. No new errors introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Data layer complete: dmBlocked flows from DB through computeDayStatuses to DayAggregation on every campaign page load
- Server Actions ready for Plan 13-02 to call from DmExceptionCalendar client component
- dmExceptionDates and dmExceptionMode variables are already computed in CampaignDetailPage; Plan 13-02 only needs to render DmExceptionCalendar and pass them as props

## Self-Check: PASSED

- src/components/Toast.tsx: FOUND
- src/lib/availability.ts: FOUND (dmBlocked: boolean in DayAggregation)
- src/lib/actions/campaign.ts: FOUND (toggleDmException, setDmExceptionMode exported)
- src/app/campaigns/[id]/page.tsx: FOUND (dmAvailabilityExceptions included, dmExceptionDateKeys passed)
- Task commits: 23768cb (FOUND), ab70f91 (FOUND)

---
*Phase: 13-dm-availability-exceptions*
*Completed: 2026-03-10*
