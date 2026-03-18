---
phase: 27-flat-settings-and-sync-toggle
plan: "01"
subsystem: campaign-settings
tags: [settings, sync-toggle, ui, flat-layout]
dependency_graph:
  requires: [25-sync-schema-and-server-layer, 26-two-column-layout-restructure]
  provides: [flat-settings-tab, dm-sync-toggle-ui]
  affects: [CampaignTabs, DmSyncToggle, campaign-detail-page]
tech_stack:
  added: []
  patterns: [optimistic-update-with-rollback, plain-useState-toggle]
key_files:
  created:
    - src/components/DmSyncToggle.tsx
  modified:
    - src/components/CampaignTabs.tsx
    - src/app/campaigns/[id]/page.tsx
decisions:
  - "joinUrl prop removed from CampaignTabs entirely — Join Link section removed in this plan, prop had no other consumers"
  - "Knob translation uses translate-x-[18px]/translate-x-[3px] instead of translate-x-4.5/translate-x-0.5 for precise pixel alignment"
metrics:
  duration: "~3 min"
  completed_date: "2026-03-18"
  tasks_completed: 2
  tasks_total: 3
  files_modified: 3
---

# Phase 27 Plan 01: Flat Settings and Sync Toggle Summary

Flat Settings tab with per-campaign DM availability sync toggle — pill toggle using plain useState optimistic update pattern calling `setDmSyncEnabled` server action.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Create DmSyncToggle component | a67341f | done |
| 2 | Flatten Settings tab and wire dmSyncEnabled prop | da7d4d1 | done |
| 3 | Human verify in browser | — | awaiting checkpoint |

## What Was Built

**DmSyncToggle component** (`src/components/DmSyncToggle.tsx`):
- `'use client'` pill toggle with sliding knob
- Plain `useState` optimistic update + rollback (not `useOptimistic`) matching DmExceptionCalendar pattern
- Calls `setDmSyncEnabled(campaignId, next)` on toggle
- `status` initialised as `'idle'` — never `'saving'` on mount
- Label updates based on `enabled` state: enabled vs sync-off message
- Subdued note: "Re-enabling sync applies to future changes only — existing dates are not changed."
- Toast integration for saved/error feedback

**Settings tab flattened** (`src/components/CampaignTabs.tsx`):
- Join Link section removed (SET-02)
- `<details>`/`<summary>` accordion wrappers removed from Players and My Unavailable Dates sections
- `ChevronDownIcon` deleted (dead code)
- New "Availability Sync" section added between Planning Window and Players — unconditional (always visible)
- `dmSyncEnabled: boolean` added to `CampaignTabsProps`
- `joinUrl` prop removed (no longer needed)

**Page wired** (`src/app/campaigns/[id]/page.tsx`):
- `dmSyncEnabled={campaign.dmSyncEnabled}` prop added to `<CampaignTabs>` call
- `joinUrl` prop removed from call to match updated interface

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed joinUrl prop from CampaignTabs interface**
- **Found during:** Task 2
- **Issue:** After removing the Join Link section that consumed `joinUrl`, the prop became dead code causing a TypeScript warning and unnecessary prop threading.
- **Fix:** Removed `joinUrl` from `CampaignTabsProps` interface, destructuring, and the call in `page.tsx`.
- **Files modified:** src/components/CampaignTabs.tsx, src/app/campaigns/[id]/page.tsx
- **Commit:** da7d4d1

## Settings Section Order (Final)

1. Planning Window (unchanged)
2. Availability Sync (new — DmSyncToggle, always visible)
3. Players (flattened from accordion)
4. My Unavailable Dates (conditional on window — DmExceptionCalendar only, flattened)
5. Danger Zone (unchanged)

## Verification Results

- `npx tsc --noEmit` — zero errors
- `npm run build` — succeeds
- No `<details>` or `<summary>` elements in CampaignTabs.tsx (grep count: 0)
- No `ChevronDownIcon` in CampaignTabs.tsx
- No `CopyLinkButton` in CampaignTabs.tsx
- `dmSyncEnabled` prop flows from page.tsx through CampaignTabsProps to DmSyncToggle
- `DmSyncToggle` initialises `status` as `'idle'`

## Awaiting

Task 3 is a checkpoint:human-verify — browser verification by user.
