---
phase: 09-campaign-fields-and-join-cap
plan: "02"
subsystem: ui
tags: [react, nextjs, prisma, tailwind, server-components]

# Dependency graph
requires:
  - phase: 09-01
    provides: Campaign schema with name/description/maxPlayers/dmId; createCampaign validates name and enforces player cap via registerPlayer

provides:
  - CampaignForm with required name field, optional description textarea, optional maxPlayers number input
  - Campaign dashboard h1 showing campaign.name (with fallback), description rendered conditionally, player count/cap indicator
  - Join page "Campaign Full" gate — renders full message instead of JoinForm when playerSlots.length >= maxPlayers
  - Updated campaign creation page copy reflecting richer form

affects:
  - future UI plans that extend CampaignForm or campaign dashboard
  - any plan that reads or displays campaign metadata

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component pre-render cap check — reads _count/playerSlots length before returning JSX, no client state needed"
    - "Conditional UI blocks guarded by nullable fields — `campaign.description &&` and `campaign.maxPlayers !== null &&`"
    - "Fallback display values for pre-migration data — `campaign.name ?? 'Campaign Dashboard'`"

key-files:
  created: []
  modified:
    - src/components/CampaignForm.tsx
    - src/app/campaigns/new/page.tsx
    - src/app/campaigns/[id]/page.tsx
    - src/app/join/[joinToken]/page.tsx

key-decisions:
  - "Fallback `campaign.name ?? 'Campaign Dashboard'` handles pre-Phase-9 campaigns with no name without a migration"
  - "Cap check in join page uses existing playerSlots include (no query change) — length comparison is sufficient since 09-01 already enforces cap atomically in registerPlayer"
  - "Description and maxPlayers indicator rendered conditionally — no placeholder text shown when fields are null"

patterns-established:
  - "Pre-render gate: check constraint at top of Server Component and return early JSX — avoids passing state to Client Components"
  - "Nullable field conditional rendering: `{field && <Block />}` for strings; `{field !== null && <Block />}` for numbers"

requirements-completed:
  - CAMP-01
  - CAMP-02
  - CAMP-03
  - JOIN-01

# Metrics
duration: 30min
completed: 2026-03-04
---

# Phase 9 Plan 02: Campaign Fields and Join Cap UI Summary

**CampaignForm extended with name/description/maxPlayers fields; campaign dashboard renders name, description, and player cap indicator; join page shows "Campaign Full" gate when cap is reached — all four CAMP/JOIN requirements verified end-to-end by human.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-04
- **Completed:** 2026-03-04
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 4

## Accomplishments

- CampaignForm now captures campaign name (required, browser + server validated), description (optional textarea), and max players (optional number input) alongside existing planning window fields
- Campaign dashboard h1 now shows `campaign.name` with `?? 'Campaign Dashboard'` fallback for pre-Phase-9 records; description and player count/cap indicator render conditionally when those fields are set
- Join page performs a pre-render cap check — returns a "Campaign Full" screen with no form when `playerSlots.length >= maxPlayers`, completing the enforcement started in 09-01
- End-to-end flow verified by human: blank name rejected, filled form creates campaign with all fields visible on dashboard, join page gates correctly at cap

## Task Commits

Each task was committed atomically:

1. **Task 1: Update CampaignForm and campaign creation page** - `3d96ffc` (feat)
2. **Task 2: Update campaign dashboard and join page cap gate** - `8a9e6e0` (feat)
3. **Task 3: End-to-end verification checkpoint** - approved by human (no code changes)

## Files Created/Modified

- `src/components/CampaignForm.tsx` - Added name (required), description (optional textarea), maxPlayers (optional number) fields; field order: name → planning window dates → description → maxPlayers → submit
- `src/app/campaigns/new/page.tsx` - Updated subtitle copy to reflect richer campaign creation form
- `src/app/campaigns/[id]/page.tsx` - h1 renders `campaign.name` with fallback; description block rendered conditionally; player count/cap indicator rendered when `maxPlayers` is set
- `src/app/join/[joinToken]/page.tsx` - Pre-render cap check returns "Campaign Full" JSX before JoinForm when cap is reached

## Decisions Made

- Fallback `campaign.name ?? 'Campaign Dashboard'` handles pre-Phase-9 campaigns without a schema migration or data backfill
- Cap check in join page uses existing `playerSlots` include (no query change needed) since 09-01 already enforces the cap atomically in `registerPlayer`
- Description and maxPlayers indicator are fully hidden (no placeholder) when null — cleaner UX for campaigns without those fields set

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four Phase 9 requirements (CAMP-01, CAMP-02, CAMP-03, JOIN-01) are complete and human-verified
- Campaign name/description/maxPlayers are now visible in the UI and enforced at the join gate
- Phase 9 is fully complete — ready to plan the next milestone phase

---
*Phase: 09-campaign-fields-and-join-cap*
*Completed: 2026-03-04*
