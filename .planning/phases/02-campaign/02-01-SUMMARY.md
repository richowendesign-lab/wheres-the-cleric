---
phase: 02-campaign
plan: 01
subsystem: campaign-creation
tags: [next.js, server-actions, prisma, react-19, tailwind]

# Dependency graph
requires:
  - Next.js 16 app scaffold (01-01)
  - Prisma 7 SQLite schema (01-01)
provides:
  - dmName field on Campaign model (schema + db migrated)
  - createCampaign Server Action with full validation
  - /campaigns/new page with dark-themed form
  - CampaignForm client component (useActionState, React 19)
  - PlayerSlotsInput client component (dynamic add/remove)
  - Cinzel font wired as font-fantasy Tailwind utility
affects: [02-campaign-detail, 03-availability, 04-dashboard]

# Tech tracking
tech-stack:
  added:
    - Cinzel (next/font/google) for fantasy heading font
    - useActionState (React 19 built-in — no new package)
  patterns:
    - Server Action pattern: 'use server' + useActionState in client wrapper
    - CampaignForm ('use client') wraps Server Action for error state display
    - PlayerSlotsInput ('use client') manages dynamic array of playerName inputs
    - font-fantasy via CSS variable --font-cinzel in @theme block (Tailwind CSS 4)

key-files:
  created:
    - src/lib/actions/campaign.ts
    - src/components/CampaignForm.tsx
    - src/components/PlayerSlotsInput.tsx
    - src/app/campaigns/new/page.tsx
  modified:
    - prisma/schema.prisma
    - src/app/layout.tsx
    - src/app/globals.css
    - prisma/seed.ts

key-decisions:
  - "Server Action in src/lib/actions/campaign.ts; CampaignForm client component holds useActionState — standard React 19 pattern for Server Action error display"
  - "Cinzel font registered as --font-cinzel CSS variable; exposed as font-fantasy Tailwind class via @theme in globals.css"
  - "prisma db push --force-reset used to reset dev.db for dmName column addition (no migration file — dev-only SQLite pattern from Phase 1)"

# Metrics
duration: 15min
completed: 2026-02-24
---

# Phase 2 Plan 01: Campaign Creation — Schema Migration and Creation Form Summary

**dmName field added to Campaign schema, createCampaign Server Action with validation, and dark-themed /campaigns/new form with dynamic player slots using React 19 useActionState**

## Performance

- **Duration:** 15 min
- **Completed:** 2026-02-24
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Campaign model updated with `dmName String` field; dev.db migrated via prisma db push --force-reset
- `createCampaign` Server Action validates all fields, checks end > start, creates Campaign + N PlayerSlots in one prisma.campaign.create call with nested create
- `CampaignForm` client component uses React 19 `useActionState` to wire the Server Action and display inline validation errors
- `PlayerSlotsInput` client component renders a dynamic list of player name inputs (add/remove)
- `/campaigns/new` page renders with Cinzel heading, amber accent, dark gray background
- Cinzel font wired via next/font/google with CSS variable --font-cinzel; exposed as `font-fantasy` Tailwind utility via @theme in globals.css
- `npm run build` passes clean with zero TypeScript errors

## Task Commits

1. **Task 1: Add dmName to schema and run migration** - `b10691c` (feat)
2. **Task 2: Campaign creation form and Server Action** - `f4963ec` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - Added dmName String field to Campaign model
- `src/lib/actions/campaign.ts` - createCampaign Server Action with validation + prisma.campaign.create
- `src/components/CampaignForm.tsx` - Client component: useActionState, renders form fields, shows error
- `src/components/PlayerSlotsInput.tsx` - Client component: dynamic playerName inputs array
- `src/app/campaigns/new/page.tsx` - Server component page wrapper
- `src/app/layout.tsx` - Cinzel + Inter fonts, updated metadata
- `src/app/globals.css` - @theme block with --font-fantasy token
- `prisma/seed.ts` - Added dmName: 'Richard' to seed data (auto-fix)

## Decisions Made

- Server Action + useActionState pattern: Server Action lives in src/lib/actions/; a thin 'use client' CampaignForm component holds useActionState for error display. This is the idiomatic React 19 / Next.js App Router pattern.
- font-fantasy exposed as Tailwind CSS 4 @theme token pointing to --font-cinzel CSS variable — allows `className="font-fantasy"` anywhere in the app.
- dev.db reset accepted: dev-only SQLite database, no real user data. Production uses Neon PostgreSQL on Vercel (Phase 1 decision).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] seed.ts missing dmName field after schema update**
- **Found during:** Task 2 build verification
- **Issue:** `npm run build` TypeScript check caught that `prisma/seed.ts` did not include `dmName` in the campaign.create call — required field after schema change
- **Fix:** Added `dmName: 'Richard'` to seed data object in prisma/seed.ts
- **Files modified:** prisma/seed.ts
- **Commit:** f4963ec (included in Task 2 commit)

## Self-Check: PASSED

- FOUND: prisma/schema.prisma (contains dmName)
- FOUND: src/lib/actions/campaign.ts
- FOUND: src/components/CampaignForm.tsx
- FOUND: src/components/PlayerSlotsInput.tsx
- FOUND: src/app/campaigns/new/page.tsx
- FOUND: src/app/layout.tsx (updated)
- FOUND: src/app/globals.css (updated)
- FOUND commit b10691c (Task 1)
- FOUND commit f4963ec (Task 2)
- BUILD: npm run build passes clean
