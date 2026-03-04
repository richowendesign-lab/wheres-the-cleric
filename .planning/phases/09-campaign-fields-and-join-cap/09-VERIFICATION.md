---
phase: 09-campaign-fields-and-join-cap
verified: 2026-03-04T17:30:00Z
status: human_needed
score: 10/10 must-haves verified
re_verification: false
human_verification:
  - test: "Submit CampaignForm with blank name field"
    expected: "Error message 'Campaign name is required.' displayed — no redirect"
    why_human: "Server action error path requires a live browser session with authenticated DM; cannot run server actions in static analysis"
  - test: "Create campaign with name, description, max players set to 2; verify dashboard renders all three fields"
    expected: "h1 shows campaign name (not 'Campaign Dashboard'); description text appears below heading; '0 / 2 players joined' appears in Join Link section"
    why_human: "Requires live Next.js server, authenticated DM session, and Neon database connection"
  - test: "Register two players via join link, then attempt a third join"
    expected: "Third visit to join URL shows 'Campaign Full' heading and explanatory text — no name entry form visible"
    why_human: "Requires live browser with cookie isolation (incognito) and real playerSlot inserts into the database"
  - test: "Campaign dashboard shows '2 / 2 players joined' after two players have joined"
    expected: "Player count indicator updates to reflect actual slot count from database"
    why_human: "Requires live server render after real data changes"
---

# Phase 9: Campaign Fields and Join Cap Verification Report

**Phase Goal:** DM can create richly described campaigns and the join link enforces a player cap
**Verified:** 2026-03-04T17:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

All ten automated must-haves from both plans are verified. The four items below require a live browser session with an authenticated DM and a real Neon PostgreSQL connection — they cannot be evaluated by static code analysis.

### Observable Truths — Plan 09-01

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Campaign cannot be created without a name — server action returns error if name is blank | VERIFIED | `src/lib/actions/campaign.ts` lines 20-23: `trimmedName` guard returns `{ error: 'Campaign name is required.' }` |
| 2 | Campaign creation saves name, description, and maxPlayers to the database | VERIFIED | `src/lib/actions/campaign.ts` lines 47-56: `prisma.campaign.create` with `name`, `description`, `maxPlayers` in `data` |
| 3 | Campaign is linked to the authenticated DM account (dmId FK set) | VERIFIED | `src/lib/actions/campaign.ts` line 9: `getSessionDM()` called; line 10-12: null guard returns error; line 52: `dmId: dm.id` passed to create |
| 4 | registerPlayer is rejected with an error when playerSlot count equals campaign maxPlayers | VERIFIED | `src/lib/actions/player.ts` lines 22-36: `findUnique` with `_count.playerSlots`; cap check `campaign._count.playerSlots >= campaign.maxPlayers` returns `{ error: 'This campaign is full. No more players can join.' }` |

**Score (09-01):** 4/4 truths verified

### Observable Truths — Plan 09-02

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 5 | CampaignForm has a required name field — browser and server both reject blank submission | VERIFIED | `src/components/CampaignForm.tsx` lines 19-27: `<input type="text" name="name" required .../>` present; server action also validates |
| 6 | CampaignForm has an optional description textarea and an optional maxPlayers number input | VERIFIED | `src/components/CampaignForm.tsx` lines 51-71: `<textarea name="description" .../>` and `<input type="number" name="maxPlayers" .../>` present |
| 7 | Campaign dashboard h1 shows the campaign name, not generic 'Campaign Dashboard' text | VERIFIED | `src/app/campaigns/[id]/page.tsx` line 76: `{campaign.name ?? 'Campaign Dashboard'}` — live name rendered with fallback for pre-Phase-9 records |
| 8 | Campaign dashboard shows the description block when description is non-null | VERIFIED | `src/app/campaigns/[id]/page.tsx` lines 81-83: `{campaign.description && <p ...>{campaign.description}</p>}` |
| 9 | Campaign dashboard shows max players and current player count when maxPlayers is set | VERIFIED | `src/app/campaigns/[id]/page.tsx` lines 95-99: `{campaign.maxPlayers !== null && <p ...>{campaign.playerSlots.length} / {campaign.maxPlayers} players joined</p>}` |
| 10 | Join page shows a 'Campaign Full' message and no name form when registerPlayer would be rejected at cap | VERIFIED | `src/app/join/[joinToken]/page.tsx` lines 38-49: cap check before JoinForm render; returns full-page "Campaign Full" JSX with explanatory text |

**Score (09-02):** 6/6 truths verified

**Overall Score:** 10/10 must-haves verified

---

## Required Artifacts

### Plan 09-01 Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | `name String?`, `description String?`, `maxPlayers Int?`, `dmId String?` on Campaign; `campaigns Campaign[]` on DM | VERIFIED | All four fields present at lines 14-17; DM relation at line 22; `campaigns` back-relation at line 59 |
| `src/lib/actions/campaign.ts` | `createCampaign` validates name, saves all fields, links to session DM | VERIFIED | Exports `createCampaign` (line 8), `deleteCampaign` (line 61), `updatePlanningWindow` (line 68) — all three required exports present |
| `src/lib/actions/player.ts` | `registerPlayer` checks maxPlayers cap before inserting PlayerSlot | VERIFIED | Exports `registerPlayer` (line 7); cap check at lines 22-36 precedes `prisma.playerSlot.create` at line 38 |

### Plan 09-02 Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `src/components/CampaignForm.tsx` | name (required), description (optional), maxPlayers (optional) form fields | VERIFIED | `name="name"` at line 21; `name="description"` at line 53; `name="maxPlayers"` at line 65 — all present and substantive |
| `src/app/campaigns/new/page.tsx` | Updated copy reflecting richer campaign creation | VERIFIED | Subtitle at line 8: "Name your campaign, set the planning window, and get a shareable join link." |
| `src/app/campaigns/[id]/page.tsx` | Renders `campaign.name` in h1, description section, maxPlayers/player-count section | VERIFIED | `campaign.name` at line 76; description conditional at lines 81-83; cap indicator at lines 95-99 |
| `src/app/join/[joinToken]/page.tsx` | Pre-checks player cap — renders full message instead of JoinForm when at cap | VERIFIED | Cap check at line 38 with early return of "Campaign Full" JSX; text "Campaign Full" present at line 42 |

---

## Key Link Verification

### Plan 09-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/actions/campaign.ts` | `prisma.campaign.create` | `data: { name, description, maxPlayers, dmId }` | WIRED | Lines 47-56: all four fields passed in data object; `dmId: dm.id` from `getSessionDM()` result |
| `src/lib/actions/player.ts` | `prisma.campaign.findUnique` | `_count: { select: { playerSlots: true } }` then compare to `maxPlayers` | WIRED | Lines 22-36: `findUnique` with `_count.playerSlots`; comparison `campaign._count.playerSlots >= campaign.maxPlayers` at line 34 |

### Plan 09-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/CampaignForm.tsx` | `createCampaign` server action | `name, description, maxPlayers` form fields submitted via `useActionState` | WIRED | Line 4: `import { createCampaign }`; line 7: `useActionState(createCampaign, null)`; form fields named `name`, `description`, `maxPlayers` |
| `src/app/campaigns/[id]/page.tsx` | `campaign.name` | Server Component prop access after `prisma.campaign.findUnique` | WIRED | Lines 18-26: `prisma.campaign.findUnique` with full `include`; line 76: `{campaign.name ?? 'Campaign Dashboard'}` rendered in h1 |
| `src/app/join/[joinToken]/page.tsx` | `_count.playerSlots` vs `campaign.maxPlayers` | Server Component pre-render check before returning JSX | WIRED | Lines 14-17: `findUnique` with `include: { playerSlots: { select: { id: true } } }` — length used as count; line 38: `campaign.playerSlots.length >= campaign.maxPlayers` |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CAMP-01 | 09-01, 09-02 | DM can create a campaign with a required name | SATISFIED | `createCampaign` validates blank name (campaign.ts:21-23); `CampaignForm` has `name` field with `required` attribute (CampaignForm.tsx:21) |
| CAMP-02 | 09-01, 09-02 | DM can optionally add a description when creating a campaign | SATISFIED | `description` field in schema (schema.prisma:15), saved in `createCampaign` (campaign.ts:50), rendered in dashboard (campaigns/[id]/page.tsx:81-83), textarea in form (CampaignForm.tsx:52-58) |
| CAMP-03 | 09-01, 09-02 | DM can optionally set a max players limit when creating a campaign | SATISFIED | `maxPlayers` field in schema (schema.prisma:16), validated in `createCampaign` (campaign.ts:27-34), rendered in dashboard (campaigns/[id]/page.tsx:95-99), number input in form (CampaignForm.tsx:63-70) |
| JOIN-01 | 09-01, 09-02 | Join link enforces max players cap — new player sees "campaign full" message when limit is reached | SATISFIED | Cap enforced in `registerPlayer` (player.ts:34-36); pre-render cap gate in join page (join/[joinToken]/page.tsx:38-49) renders "Campaign Full" heading before JoinForm |

No orphaned requirements — all four IDs declared in both plans are fully mapped to Phase 9 in REQUIREMENTS.md (traceability table confirms Phase 9, Status: Complete for all four).

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | — |

No stub code, TODO comments, placeholder returns, or empty handlers found in any of the five modified files. The `placeholder` attributes on form inputs (`src/components/CampaignForm.tsx`) are standard HTML input hint text, not code stubs.

One notable item: `src/app/join/[joinToken]/page.tsx` line 26-29 still contains a DM redirect check via `dm_secret` cookie (`campaign.dmSecret`). This is a legacy path from before Phase 8 DM ownership was introduced. The plan (09-01) explicitly noted that `dmSecret` would remain in place during transition — this is intentional and documented, not a regression.

---

## Human Verification Required

### 1. Blank name rejection

**Test:** Log in as DM, visit `/campaigns/new`, leave the name field blank, fill in planning window dates, and submit the form.
**Expected:** Error message "Campaign name is required." appears inline — no redirect occurs, form stays on the page.
**Why human:** Server action error path requires a real browser with an authenticated session cookie and a live Next.js server process. Static analysis confirms the guard code exists but cannot run it.

### 2. Full campaign creation — all fields visible on dashboard

**Test:** Fill in name "Test Campaign", description "A short test", max players "2", and valid planning window dates. Submit. Confirm redirect to `/campaigns/{id}`.
**Expected:** h1 shows "Test Campaign" (not "Campaign Dashboard"); "A short test" appears below the heading; "0 / 2 players joined" appears in the Join Link section.
**Why human:** Requires live database write and server-rendered response from Neon PostgreSQL.

### 3. Join cap enforcement — "Campaign Full" screen

**Test:** Copy the join URL from the campaign created in test 2. Register two players in separate incognito windows. Open a third incognito window and visit the same join URL.
**Expected:** Third visit shows a page with heading "Campaign Full" and explanatory text — no name entry form is visible.
**Why human:** Requires real player registration (cookie-based), real playerSlot database inserts, and cookie-isolated browser sessions.

### 4. Player count indicator updates after joins

**Test:** After registering two players (from test 3), return to the campaign dashboard at `/campaigns/{id}`.
**Expected:** Player count indicator reads "2 / 2 players joined".
**Why human:** Requires live server re-render after real database state change.

---

## Gaps Summary

No automated gaps detected. All ten must-haves are verified, all four requirement IDs are fully covered, and no anti-patterns were found.

The phase status is `human_needed` because the end-to-end browser flow — blank name rejection, dashboard field rendering, and the join cap gate in a real session — cannot be confirmed without running the application. The 09-02 SUMMARY documents that a human verified these flows at task checkpoint 3, but that claim is in the SUMMARY rather than the codebase. A fresh human confirmation against the current deployed code is the remaining step.

---

_Verified: 2026-03-04T17:30:00Z_
_Verifier: Claude (gsd-verifier)_
