---
phase: 07-join-flow
plan: 02
subsystem: ui
tags: [next.js, prisma, cookies, react, server-component]

# Dependency graph
requires:
  - phase: 07-join-flow/07-01
    provides: player_id cookie set by registerPlayer, /join/[joinToken] smart routing, PlayerSlot model
  - phase: 05-schema-migration
    provides: v1.1 schema with PlayerSlot.availabilityEntries and Campaign.planningWindowStart/End
  - phase: 03-availability
    provides: AvailabilityForm component with playerSlotId + initialEntries + planningWindow props

provides:
  - Player availability page at /join/[joinToken]/availability
  - Cookie-based guard — absent/stale/cross-campaign player_id redirects to /join/[joinToken]
  - Serialized availabilityEntries and planning window dates fed to AvailabilityForm
  - End-to-end verified join flow: new player, auto-save, returning player, DM redirect

affects: [08-availability, deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server component cookie guard — read player_id, redirect to register if absent/stale/wrong-campaign"
    - "Cross-campaign cookie defense — compare slot.campaignId against campaign.id before rendering"
    - "Date serialization for AvailabilityForm — e.date?.toISOString() ?? null for entry dates, .split('T')[0] for planning window"

key-files:
  created:
    - src/app/join/[joinToken]/availability/page.tsx
  modified: []

key-decisions:
  - "Cross-campaign cookie check compares slot.campaignId to campaign.id — player visiting a different campaign's join link gets sent to register, not shown stale data"
  - "No new decisions beyond those established in 07-01 — page follows established patterns exactly"

patterns-established:
  - "Pattern: availability page as server component — load slot+entries+campaign in one findUnique with include, serialize before passing to client component"

requirements-completed: [JOIN-02, JOIN-03]

# Metrics
duration: ~50min (includes human verification pause)
completed: 2026-03-02
---

# Phase 7 Plan 2: Join Flow — Availability Page Summary

**Player availability page at /join/[joinToken]/availability wired to AvailabilityForm, with cookie guard redirecting absent/stale/cross-campaign visitors back to registration — end-to-end join flow verified across all four scenarios**

## Performance

- **Duration:** ~50 min (includes checkpoint pause for human verification)
- **Started:** 2026-03-02T17:13:18Z
- **Completed:** 2026-03-02T18:04:13Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Async server component reads player_id cookie and handles three redirect cases: absent (new visitor), stale (no matching slot), cross-campaign (slot belongs to different campaign)
- Serializes availabilityEntries (Date fields to ISO string) and planning window dates (YYYY-MM-DD strings) before passing to AvailabilityForm
- Build passes with zero TypeScript errors; /join/[joinToken]/availability appears as a dynamic route
- All four join flow scenarios verified by human: new player name form, availability auto-save with toast, returning player bypass, DM redirect to dashboard

## Task Commits

Each task was committed atomically:

1. **Task 1: Player availability page** - `e92160b` (feat)
2. **Task 2: Human verify complete join flow** - verified by user (no code changes)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/app/join/[joinToken]/availability/page.tsx` - Async server component: cookie guard, prisma query with slot+entries+campaign include, serialization, renders AvailabilityForm

## Decisions Made
- Cross-campaign cookie check: if `slot.campaignId !== campaign.id`, redirect to `/join/${joinToken}` — treats the visitor as new rather than showing them data from a different campaign. This is a defensive guard for the edge case where a player has a player_id cookie from a previous campaign and visits a new join link.
- No new library or pattern decisions — page follows all patterns established in 07-01 and prior phases.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete join flow is live and verified end-to-end
- Phase 7 (Join Flow) is fully complete — all four JOIN requirements satisfied
- v1.1 Simplified Onboarding milestone is complete (Phases 5, 6, 7 all done)
- No blockers for deployment or next milestone work

---
*Phase: 07-join-flow*
*Completed: 2026-03-02*
