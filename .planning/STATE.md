---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: DM Experience & Scheduling Flow
status: unknown
last_updated: "2026-03-11T10:33:00.000Z"
progress:
  total_phases: 9
  completed_phases: 8
  total_plans: 26
  completed_plans: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09 after v1.3 milestone start)

**Core value:** The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.
**Current focus:** v1.3 — DM Experience & Scheduling Flow (Phase 15 next)

## Current Position

Phase: 15-shareable-best-dates — IN PROGRESS (1/2 plans complete)
Current: 15-02-PLAN.md Task 1 complete — awaiting human-verify checkpoint
Last activity: 2026-03-11 — CopyBestDatesButton wired into BestDaysList; awaiting checkpoint approval

```
v1.3 Progress: [███████░░░] 5/6 phases near-complete — PHASE 15 CHECKPOINT
```

## Performance Metrics

**Velocity:**
- Total plans completed: 3 (v1.3)
- Average duration: 4.7 min
- Total execution time: 15 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 11 P01 | 2 tasks | 2 min | 1 min |
| Phase 12-share-modal P01 | 2 tasks | 5 min | 2.5 min |
| Phase 12-share-modal P02 | 2 tasks | 10 min | 5 min |
| Phase 13-dm-availability-exceptions P01 | 2 tasks | 8 min | 4 min |

*Updated after each plan completion*
| Phase 13-dm-availability-exceptions P13-02 | 2 | 2 tasks | 4 files |
| Phase 14-dashboard-redesign P01 | 1 | 2 tasks | 2 files |
| Phase 14-dashboard-redesign P02 | 2 | 1 tasks | 1 files |
| Phase 14-dashboard-redesign P03 | 3 | 2 tasks | 3 files |
| Phase 15-shareable-best-dates P01 | 4 | 2 tasks | 2 files |
| Phase 15-shareable-best-dates P02 | 5 | 1 task | 1 file |

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

**v1.3 roadmap decisions:**
- Phase 11 has no direct requirements — it is a structural prerequisite unblocking all feature phases (schema + utility extraction)
- DASH-01 clarification: calendar adapts with prev/next arrows, NOT a hardcoded two-month side-by-side layout
- Phase 16 (custom date picker) depends only on Phase 11 (calendarUtils extraction) and can run independently of Phases 12-15
- Phase 13 must precede Phase 14: dashboard redesign must render DM-blocked days correctly, requiring exception data to exist first
- Phase 15 must follow Phase 14: shareable message content depends on DM exceptions being factored into rankings
- [Phase 11]: calendarUtils.ts has zero imports — prevents circular dependencies; named exports only (no default export)
- [Phase 11]: calendarUtils pattern established: shared calendar functions live in src/lib/calendarUtils.ts, not in components

**Plan 11-01 decisions:**
- DmAvailabilityException.date is DateTime (not nullable) — exceptions are always date-specific
- No updatedAt on DmAvailabilityException — toggle pattern (delete+create) preferred over in-place updates
- dmExceptionMode String? on Campaign — null means unset; application defaults to block behaviour
- No @@index or @@map on DmAvailabilityException — kept minimal to match AvailabilityEntry pattern

**Plan 12-01 decisions:**
- [Phase 12-share-modal]: ShareModal uses div overlay (not native dialog) for consistent DnD styling; CopyButton is local unexported helper; dismiss cleans URL via router.replace(pathname)
- inviteMessage computed inline from joinUrl prop at render time — not in useState
- router.replace uses window.location.pathname to strip query params without creating a new history entry

**Plan 12-02 decisions:**
- searchParams received as async Promise prop on CampaignDetailPage Server Component — not via useSearchParams() hook (requires Client Component)
- ShareModal placed as last child in outer container div; fixed positioning makes DOM location irrelevant
- No open state passed from page to ShareModal — ShareModal manages own open state via useState(true)

**Plan 13-01 decisions:**
- toggleDmException does NOT call revalidatePath — client manages optimistic state (same discipline as toggleDateOverride)
- setDmExceptionMode DOES call revalidatePath — mode change requires Server Component to re-render with new exceptionMode prop
- dmBlocked is required (not optional) on DayAggregation — TypeScript enforces correctness at all call sites
- Toast text genericized from "Availability saved" to "Saved" to support reuse in DmExceptionCalendar
- dmExceptionDates array and dmExceptionMode computed in CampaignDetailPage now; Plan 13-02 passes them as props to DmExceptionCalendar
- [Phase 13-dm-availability-exceptions]: DmExceptionCalendar empty state uses displayDays.length (post-filter) so block mode blocking all best days correctly shows empty state

**Plan 13-02 decisions:**
- DmExceptionCalendar wraps its own section header inside the component — self-contained for clarity
- BestDaysList empty state checks displayDays.length (post-filter) not bestDays.length — block mode hiding all best days correctly shows empty state
- Separate modeStatus from saveStatus — prevents date click feedback and mode toggle feedback from clobbering each other
- DashboardCalendar amber ring uses ring-amber-400/60 (60% opacity) to overlay without replacing existing green/gray states
- UX refinement deferred per user note — current implementation is functional and verified; interaction design to be revisited in a future phase
- [Phase 14-dashboard-redesign]: UpdatePlanningWindowForm accepts campaignId + planningWindowStart/End as string | null — Date objects cannot cross Server->Client boundary
- [Phase 14-dashboard-redesign]: BestDaysList unavailable = \!free: PlayerDayStatus is 'free' | 'no-response', so \!=='free' correctly captures all unavailability
- [Phase 14-dashboard-redesign]: displayedMonths slices up to 2 months from currentMonthIndex — single state variable drives both navigation and responsive 2-up display
- [Phase 14-dashboard-redesign]: Navigation header hidden when months.length === 1 — avoids visual noise for single-month planning windows
- [Phase 14-dashboard-redesign]: Responsive 2-up calendar via Tailwind CSS lg:grid-cols-2 only — no JS media query needed
- [Phase 14-dashboard-redesign]: CampaignTabs is single Server->Client boundary: all data serialised in page.tsx before passing through props
- [Phase 14-dashboard-redesign]: Tab state is client-side only (useState) — no URL change on tab switch
- [Phase 14-dashboard-redesign]: Header, title, description and ShareModal remain outside CampaignTabs — always visible regardless of active tab
- [Phase 15-shareable-best-dates]: formatBestDatesMessage accepts dmExceptionMode directly and mirrors BestDaysList filter so copied message always matches visible UI
- [Phase 15-shareable-best-dates]: CopyBestDatesButton receives pre-built message string as prop — message computation stays in Server Component, component stays stateless except copied flag
- [Phase 15-02]: message computed unconditionally before empty-state branch — formatBestDatesMessage is pure and cheap; avoids duplication across both return paths
- [Phase 15-02]: mb-2 moved from h2 to wrapper div to preserve spacing below header row when CopyBestDatesButton added

### Pending Todos

None.

### Blockers/Concerns

- [Phase 16] Confirm whether `updatePlanningWindow` server action calls `revalidatePath` before implementing key-based remount strategy for the custom date picker.

## Session Continuity

Last session: 2026-03-11
Stopped at: 15-02-PLAN.md Task 1 complete — CopyBestDatesButton wired into BestDaysList; awaiting human-verify checkpoint approval
Resume file: None
