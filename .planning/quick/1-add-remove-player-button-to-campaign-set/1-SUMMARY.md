---
phase: quick-1-remove-player
plan: "01"
subsystem: campaign-settings
tags: [player-management, server-action, optimistic-ui]
dependency_graph:
  requires: []
  provides: [removePlayer server action, inline remove confirm UI]
  affects: [src/lib/actions/campaign.ts, src/components/CampaignTabs.tsx]
tech_stack:
  added: []
  patterns: [auth+ownership guard, optimistic update with rollback, useTransition]
key_files:
  created: []
  modified:
    - src/lib/actions/campaign.ts
    - src/components/CampaignTabs.tsx
decisions:
  - Optimistic removal uses local players state (mirrors playerSlots prop) for immediate UI feedback, then rolls back on server error — same pattern as DmSyncToggle
  - confirmingPlayerId state handles inline confirm/cancel per row without additional component
metrics:
  duration: ~5 min
  completed: 2026-03-18
---

# Quick Task 1: Add Remove Player Button to Campaign Settings Summary

**One-liner:** Per-row inline confirm/cancel remove button in Settings > Players, backed by a DM-ownership-guarded `removePlayer` server action that deletes PlayerSlot (cascading AvailabilityEntry records).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add removePlayer server action | 47e4df4 | src/lib/actions/campaign.ts |
| 2 | Add player list with inline remove confirm | 6757047 | src/components/CampaignTabs.tsx |

## What Was Built

### removePlayer server action (`src/lib/actions/campaign.ts`)

Exported function `removePlayer(campaignId, playerSlotId)` that:
1. Authenticates via `getSessionDM()` — returns `{ error: 'Not authenticated' }` if null
2. Checks campaign ownership via `campaign.dmId !== dm.id` — returns `{ error: 'Unauthorized' }` if mismatch
3. Deletes the `PlayerSlot` by id — `AvailabilityEntry` records cascade via existing schema relation
4. Calls `revalidatePath('/campaigns/${campaignId}')` to refresh server data
5. Returns `{ success: true }` or `{ error: string }` on exception

### Inline remove confirm UI (`src/components/CampaignTabs.tsx`)

- Added `useTransition` import alongside existing React hooks
- Added `removePlayer` import from `@/lib/actions/campaign`
- `players` state (initialised from `playerSlots` prop) for optimistic list management
- `confirmingPlayerId` state tracks which row is in confirm mode
- `isPending` / `startTransition` for disabling Confirm button during in-flight requests
- Player list renders above `UpdateMaxPlayersForm` in Settings > Players section
- Default row: player name + "Remove" button (hover turns red)
- Confirm row: "Remove [name]? Confirm Cancel" — Confirm triggers optimistic removal + server call with rollback on error; Cancel restores default row

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` exits 0
- `npm run build` completes without errors
- All success criteria met

## Self-Check

- [x] `src/lib/actions/campaign.ts` modified and committed at 47e4df4
- [x] `src/components/CampaignTabs.tsx` modified and committed at 6757047
- [x] Build passes
