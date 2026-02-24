---
phase: 02-campaign
plan: 03
subsystem: ui
tags: [nextjs, prisma, tailwind, dark-theme, invite-link]

# Dependency graph
requires:
  - phase: 02-campaign
    provides: Campaign model with playerSlots and inviteToken fields (from 02-01/02-02)
provides:
  - Player-facing invite landing page at /invite/[token] with full campaign info display
  - Friendly 404 error page for invalid/expired invite tokens scoped to the invite route
  - Disabled Phase 3 CTA placeholder ("Set your availability" button)
affects: [03-availability, phase-3-player-form]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js 15 async params — type as Promise<{ token: string }>, await before use"
    - "Route-scoped not-found.tsx — placed inside /invite/[token]/ so only invite 404s get the custom message"
    - "Server Component Prisma fetch with nested include (campaign.playerSlots) for single-query player page"

key-files:
  created:
    - src/app/invite/[token]/page.tsx
    - src/app/invite/[token]/not-found.tsx
  modified:
    - src/app/globals.css

key-decisions:
  - "Route-scoped not-found.tsx placed at src/app/invite/[token]/not-found.tsx so the friendly error only applies to invite token 404s, not the whole app"
  - "Single Prisma query with nested include fetches slot + campaign + all sibling slots in one round-trip"
  - "Phase 3 CTA rendered as a disabled button now so the shell is in place for availability form to slot into later"

patterns-established:
  - "Next.js 15 async params: always type params as Promise<{...}> and await before destructuring"
  - "Dark theme date inputs: filter: invert(1) on calendar icon pseudo-element in globals.css for visibility on dark backgrounds"

requirements-completed: [ACCESS-01]

# Metrics
duration: 20min
completed: 2026-02-24
---

# Phase 2 Plan 03: Player Landing Page Summary

**Read-only player invite page at /invite/[token] showing campaign info, fellow players, and a disabled Phase 3 CTA, with a friendly route-scoped 404 for invalid tokens — completing the full Phase 2 DM + player flow**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-02-24
- **Tasks:** 2 (1 auto, 1 checkpoint — approved)
- **Files modified:** 3

## Accomplishments

- Player landing page renders campaign name, DM name, planning window date range, fellow player name badges, and a greyed-out "Set your availability" button from a single Prisma query
- Invalid invite tokens produce a friendly custom error ("This link doesn't look right — ask your DM to resend it") via a route-scoped not-found.tsx, not a generic Next.js 404 or 500
- Dark D&D theme (Cinzel headings, amber accents, gray-950 background) is fully responsive at 375px mobile width
- All 12 manual verification steps across the full DM + player + error flow approved by user

## Task Commits

1. **Task 1: Player landing page and invalid token error page** - `795ed27` (feat)
2. **Deviation fix: Date picker calendar icon visibility** - `5e879d0` (fix)

## Files Created/Modified

- `src/app/invite/[token]/page.tsx` — Server Component; awaits async params, fetches playerSlot with nested campaign and sibling slots, renders full player info card with disabled CTA
- `src/app/invite/[token]/not-found.tsx` — Route-scoped friendly error page for invalid/missing invite tokens
- `src/app/globals.css` — Added `filter: invert(1)` on date input calendar icon for visibility on dark backgrounds

## Decisions Made

- Route-scoped not-found.tsx at the invite segment level so the friendly message only appears for invite-related 404s — global 404s keep the default Next.js behaviour
- Single Prisma query with nested include (`campaign: { include: { playerSlots: ... } }`) fetches all required data without N+1 queries
- Phase 3 CTA rendered as a real disabled button now so the availability form (Phase 3) slots directly into this shell with minimal changes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Date picker calendar icon invisible on dark background**
- **Found during:** Post-checkpoint manual verification
- **Issue:** Browser-native date input calendar icon was rendering in a dark colour, invisible against the gray-950 background on the campaigns detail page
- **Fix:** Added `filter: invert(1)` CSS rule targeting the `::-webkit-calendar-picker-indicator` pseudo-element in `src/app/globals.css`
- **Files modified:** `src/app/globals.css`
- **Verification:** Calendar icon visible on dark background; verified across Chrome and Safari
- **Committed in:** `5e879d0` (separate fix commit after checkpoint approval)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Minor cosmetic fix. No scope creep. Directly caused by the dark theme established in this phase.

## Issues Encountered

None during planned task work. The calendar icon issue was a pre-existing styling gap surfaced by manual verification of the full Phase 2 flow.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Full Phase 2 DM + player flow is complete and verified
- /invite/[token] page.tsx is the shell Phase 3 will extend with the availability date-range form
- The disabled "Set your availability" button is already in place — Phase 3 replaces it with an active form component
- No blockers

---
*Phase: 02-campaign*
*Completed: 2026-02-24*
