---
phase: 07-join-flow
verified: 2026-03-02T18:30:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 7: Join Flow Verification Report

**Phase Goal:** The join link is smart — new visitors see a name entry form, returning players go straight to their availability page, and the DM goes straight to the dashboard.
**Verified:** 2026-03-02T18:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                              | Status     | Evidence                                                                                                                         |
|----|----------------------------------------------------------------------------------------------------|------------|----------------------------------------------------------------------------------------------------------------------------------|
| 1  | New visitor at /join/[joinToken] sees a name entry form — no nav, no campaign links                | VERIFIED   | `page.tsx` falls through DM + player cookie checks, renders `<JoinForm>` in a minimal `main` with no nav or header              |
| 2  | DM visiting their campaign's join link is redirected server-side to /campaigns/[id]                | VERIFIED   | `page.tsx` reads `dm_secret` cookie, compares to `campaign.dmSecret`, calls `redirect(/campaigns/${campaign.id})` before JSX    |
| 3  | Returning player (player_id cookie matching a slot in this campaign) is redirected to availability  | VERIFIED   | `page.tsx` reads `player_id` cookie, checks `campaign.playerSlots.some(slot => slot.id === playerIdCookie)`, then redirects     |
| 4  | Submitting the name form creates a PlayerSlot, sets a player_id cookie, redirects to availability  | VERIFIED   | `player.ts` calls `prisma.playerSlot.create`, `cookieStore.set('player_id', slot.id, {...})`, then `redirect(/join/…/availability)` |
| 5  | Invalid joinToken returns 404                                                                      | VERIFIED   | Both `page.tsx` and `availability/page.tsx` call `notFound()` if `prisma.campaign.findUnique` returns null                      |
| 6  | Player who lands on /join/[joinToken]/availability sees their name and the AvailabilityForm        | VERIFIED   | `availability/page.tsx` renders `Hi, {slot.name}` and `<AvailabilityForm playerSlotId={slot.id} ... />`                        |
| 7  | Player with no player_id cookie (or stale cookie) is redirected back to /join/[joinToken]          | VERIFIED   | Three redirect guards in `availability/page.tsx`: absent cookie, null slot, cross-campaign slot — all call `redirect(/join/${joinToken})` |
| 8  | Player can toggle weekly days and date overrides — auto-save works as before                       | VERIFIED   | `AvailabilityForm` component is fully implemented with `saveWeeklyPattern`, `toggleDateOverride`, debounce, and Toast            |
| 9  | Planning window dates display when campaign has planningWindowStart and planningWindowEnd set       | VERIFIED   | `availability/page.tsx` serializes window dates and passes to `AvailabilityForm`; form conditionally renders `AvailabilityCalendar` when both dates present |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact                                              | Provides                                                    | Status   | Details                                                                                   |
|-------------------------------------------------------|-------------------------------------------------------------|----------|-------------------------------------------------------------------------------------------|
| `src/app/join/[joinToken]/page.tsx`                   | Smart join page — server-side cookie routing + name entry form | VERIFIED | 53 lines; exports `default async function JoinPage`; full routing logic + JoinForm render |
| `src/app/join/[joinToken]/JoinForm.tsx`               | Client form with useActionState for inline error display    | VERIFIED | 42 lines; `'use client'`; uses `useActionState`; hidden fields; styled amber submit button |
| `src/lib/actions/player.ts`                           | registerPlayer server action                                | VERIFIED | 35 lines; `'use server'`; exports `registerPlayer`; validates name, creates slot, sets cookie, redirects |
| `src/app/join/[joinToken]/availability/page.tsx`      | Player availability page — cookie guard + AvailabilityForm  | VERIFIED | 85 lines; exports `default async function AvailabilityPage`; three redirect guards; full serialization |

---

### Key Link Verification

| From                                         | To                              | Via                             | Status   | Evidence                                                                            |
|----------------------------------------------|---------------------------------|---------------------------------|----------|-------------------------------------------------------------------------------------|
| `src/app/join/[joinToken]/page.tsx`          | `src/lib/actions/player.ts`     | `action={registerPlayer}` prop  | WIRED    | `import registerPlayer from '@/lib/actions/player'`; passed as `action` to JoinForm |
| `src/lib/actions/player.ts`                  | `prisma.playerSlot`             | `prisma.playerSlot.create`      | WIRED    | Line 22: `const slot = await prisma.playerSlot.create({ data: { campaignId, name: trimmedName } })` |
| `src/app/join/[joinToken]/page.tsx`          | `prisma.campaign`               | `findUnique where joinToken`    | WIRED    | Line 14: `prisma.campaign.findUnique({ where: { joinToken }, include: { playerSlots: ... } })` |
| `src/app/join/[joinToken]/availability/page.tsx` | `src/components/AvailabilityForm` | import + render with props  | WIRED    | Line 4: `import { AvailabilityForm } from '@/components/AvailabilityForm'`; rendered with all four props |
| `src/app/join/[joinToken]/availability/page.tsx` | `prisma.playerSlot`         | `playerSlot.findUnique`         | WIRED    | Line 31: `prisma.playerSlot.findUnique({ where: { id: playerIdCookie }, include: { ... } })` |

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                                            | Status    | Evidence                                                                                              |
|-------------|-------------|----------------------------------------------------------------------------------------|-----------|-------------------------------------------------------------------------------------------------------|
| JOIN-01     | 07-01-PLAN  | New visitor to the join link is prompted to enter their name to join                   | SATISFIED | `page.tsx` falls through to `JoinForm` for new visitors — no nav, just the name entry form            |
| JOIN-02     | 07-01, 07-02| After entering their name, player is redirected to their availability page             | SATISFIED | `registerPlayer` redirects to `/join/${joinToken}/availability`; `availability/page.tsx` renders form |
| JOIN-03     | 07-01, 07-02| Returning player is auto-recognised (cookie) and redirected to their availability page | SATISFIED | `page.tsx` checks `player_id` cookie against campaign slots, redirects before JSX                     |
| JOIN-04     | 07-01-PLAN  | DM visiting the join link is auto-recognised (cookie) and redirected to the dashboard  | SATISFIED | `page.tsx` checks `dm_secret` cookie against `campaign.dmSecret`, redirects to `/campaigns/${campaign.id}` |

All four requirements accounted for. No orphaned requirements found in REQUIREMENTS.md for Phase 7.

---

### Anti-Patterns Found

| File                                          | Line | Pattern                | Severity | Impact         |
|-----------------------------------------------|------|------------------------|----------|----------------|
| `src/app/join/[joinToken]/JoinForm.tsx`       | 22   | `placeholder="Your name"` | Info   | HTML input placeholder attribute — intentional UI copy, not a code stub |

No code stubs, no empty implementations, no TODO/FIXME comments, no incomplete handlers found across any of the four phase files.

---

### Build Status

Build passes with zero TypeScript errors and zero warnings. Both `/join/[joinToken]` and `/join/[joinToken]/availability` appear as dynamic server-rendered routes in the build output.

```
Route (app)
...
ƒ /join/[joinToken]
ƒ /join/[joinToken]/availability
```

---

### Commits Verified

All task commits documented in SUMMARY files were confirmed real in git history:

- `bf61db5` — feat(07-01): add registerPlayer server action
- `95d3661` — feat(07-01): add smart join page with routing logic and name entry form
- `e92160b` — feat(07-02): player availability page at /join/[joinToken]/availability

---

### Human Verification Required

Task 2 of plan 07-02 was a blocking human checkpoint. According to 07-02-SUMMARY.md, all four scenarios were verified by the user:

1. New player sees "Join the Campaign" name form with no navigation
2. After submitting name, player lands on availability page with "Hi, {name}" and AvailabilityForm
3. Returning player (same session, same incognito window) is redirected past the form straight to availability
4. DM in main browser (dm_secret cookie set) visiting join link is redirected to /campaigns/[id] dashboard

These behaviors require runtime observation and cannot be re-verified programmatically. The human checkpoint gate was marked approved in the SUMMARY.

The following behaviors are flagged as needing human re-confirmation if regression testing is desired:

**Test 1: Auto-save toast**
**Test:** Toggle a weekly day in the availability form. Expected: green "Availability saved" toast appears and fades. Why human: Real-time UI feedback cannot be verified statically.

**Test 2: Cross-campaign cookie redirect**
**Test:** Set a player_id cookie from campaign A, then visit the join URL for campaign B. Expected: redirected to /join/[campaignB-token] name form (not shown stale data). Why human: Requires two running campaign records and multi-cookie browser state.

---

### Gaps Summary

No gaps. All nine observable truths are verified. All four artifacts exist, are substantive (not stubs), and are correctly wired. All four JOIN requirements are satisfied with direct code evidence. Build passes cleanly.

---

_Verified: 2026-03-02T18:30:00Z_
_Verifier: Claude (gsd-verifier)_
