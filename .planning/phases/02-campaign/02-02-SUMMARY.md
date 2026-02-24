---
phase: 02-campaign
plan: 02
subsystem: campaign-detail
tags: [next.js, server-actions, prisma, react-19, clipboard-api]

# Dependency graph
requires:
  - createCampaign Server Action + PlayerSlot schema (02-01)
provides:
  - /campaigns/[id] detail page with invite links table
  - CopyLinkButton client component (navigator.clipboard)
  - UpdatePlanningWindowForm client component (useActionState)
  - updatePlanningWindow Server Action
  - Root page linking to /campaigns/new
affects: [03-availability, 04-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - awaited params pattern for Next.js 15 dynamic routes (params: Promise<{id}>)
    - updatePlanningWindow.bind(null, campaign.id) to pre-bind campaignId before passing to useActionState
    - NEXT_PUBLIC_APP_URL env var for invite URL construction with localhost fallback

key-files:
  created:
    - src/app/campaigns/[id]/page.tsx
    - src/components/CopyLinkButton.tsx
    - src/components/UpdatePlanningWindowForm.tsx
  modified:
    - src/lib/actions/campaign.ts
    - src/app/page.tsx
    - .env.example

key-decisions:
  - "UpdatePlanningWindowForm binds campaignId via .bind(null, campaign.id) before passing to useActionState — standard pattern for passing extra args to Server Actions"
  - "NEXT_PUBLIC_APP_URL used for invite URL construction; localhost:3000 fallback ensures dev works without env var set"

# Metrics
duration: 10min
completed: 2026-02-24
---

# Phase 2 Plan 02: Campaign Detail Page — Invite Links and Planning Window Summary

**Campaign detail page at /campaigns/[id] showing all player invite links with clipboard copy buttons and an editable planning window form using React 19 useActionState**

## Performance

- **Duration:** 10 min
- **Completed:** 2026-02-24
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `/campaigns/[id]` Server Component page renders campaign name, DM name, player slots table with invite URLs and copy buttons
- `CopyLinkButton` `'use client'` component uses `navigator.clipboard.writeText` with 2-second "Copied!" feedback
- Invite URLs constructed from `NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'` — no hardcoded localhost in production
- `updatePlanningWindow` Server Action appended to `campaign.ts` — `createCampaign` action preserved
- `UpdatePlanningWindowForm` `'use client'` component pre-fills existing dates, saves updates via bound action + `useActionState`
- Root page at `/` updated with dark D&D theme, heading, and "Create a Campaign" link to `/campaigns/new`
- `.env.example` documents `NEXT_PUBLIC_APP_URL` for Vercel setup
- `npm run build` passes clean — 5 routes generated

## Task Commits

1. **Task 1: Campaign detail page with invite links table and copy button** — `bf6d598` (feat)
2. **Task 2: Planning window edit form + root page update + env var** — `71e6375` (feat)

## Files Created/Modified

- `src/app/campaigns/[id]/page.tsx` — Server Component; awaits params, queries prisma with playerSlots, renders invite links table
- `src/components/CopyLinkButton.tsx` — `'use client'`; navigator.clipboard copy with copied state feedback
- `src/components/UpdatePlanningWindowForm.tsx` — `'use client'`; useActionState with bound updatePlanningWindow action
- `src/lib/actions/campaign.ts` — `updatePlanningWindow` Server Action added (createCampaign preserved)
- `src/app/page.tsx` — Root page replaced with D&D heading and Create a Campaign link
- `.env.example` — Added NEXT_PUBLIC_APP_URL documentation

## Decisions Made

- `updatePlanningWindow.bind(null, campaign.id)` pre-binds the campaignId before passing to `useActionState` — the standard React 19 pattern for extra Server Action arguments
- `NEXT_PUBLIC_APP_URL` with `localhost:3000` fallback keeps dev working without env config while ensuring production invite URLs use the real domain

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: src/app/campaigns/[id]/page.tsx
- FOUND: src/components/CopyLinkButton.tsx (contains 'use client', navigator.clipboard.writeText)
- FOUND: src/components/UpdatePlanningWindowForm.tsx (contains 'use client', useActionState)
- FOUND: src/lib/actions/campaign.ts (contains updatePlanningWindow + createCampaign)
- FOUND: src/app/page.tsx (contains /campaigns/new link)
- FOUND: .env.example (contains NEXT_PUBLIC_APP_URL)
- FOUND commit bf6d598 (Task 1)
- FOUND commit 71e6375 (Task 2)
- BUILD: npm run build passes clean — 5 routes
