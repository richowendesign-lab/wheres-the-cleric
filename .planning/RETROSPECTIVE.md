# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-02-26
**Phases:** 4 | **Plans:** 14 | **Timeline:** 3 days (2026-02-23 → 2026-02-26)

### What Was Built
- Campaign creation with per-player invite links and planning window
- Player weekly availability patterns + specific date overrides
- DM calendar dashboard with aggregate view, best-day ranking, and awaiting-response list

### What Worked
- Atomic plan execution with human smoke tests at the end of each phase — caught zero regressions
- Server-side aggregation for the dashboard kept client components clean with no loading states
- CSS-only tooltips (group-hover) avoided JS state while delivering smooth UX

### What Was Inefficient
- Per-player invite link model required the DM to manage individual links — revealed friction during review that led directly to v1.1

### Patterns Established
- Server Action in `src/lib/actions/` + `useActionState` for error display (React 19 pattern)
- `$transaction([deleteMany, createMany])` for atomic weekly pattern updates
- `computeDayStatuses` called server-side, passed as plain data to client components

### Key Lessons
1. Shipping a working MVP fast is more valuable than upfront design — v1.0 revealed the invite link friction that became v1.1
2. Server-side data aggregation scales better than client-side fetching for read-heavy views

### Cost Observations
- Sessions: unknown
- Notable: 14 plans completed in 3 days — roughly 4-5 plans/day baseline established

---

## Milestone: v1.1 — Simplified Onboarding

**Shipped:** 2026-03-02
**Phases:** 3 | **Plans:** 8 | **Timeline:** 4 days (2026-02-27 → 2026-03-02)

### What Was Built
- v1.1 schema migration — `joinToken` + `dmSecret` on Campaign, `inviteToken` removed, all v1.0 data wiped
- Date-range-only campaign creation — no name or player name fields
- Single shareable join link displayed on dashboard immediately after creation
- DM cookie (`dm_secret`) — returning DM auto-redirected from home page to dashboard
- Smart join page (`/join/[joinToken]`) — three routing cases handled: new visitor, returning player, returning DM
- Player availability page (`/join/[joinToken]/availability`) with cookie guard and cross-campaign defence

### What Worked
- Phased migration approach (schema first, server-side second, UI third, verification last) produced a clean build on first attempt in plan 05-04 — no unplanned rework
- Cookie-based server-side redirect pattern proved reusable across home page (DM) and join page (DM + player)
- Human verification at the end of each phase caught integration issues before they compounded

### What Was Inefficient
- Phase 5 had 4 plans but plan 05-04 required zero code changes — could have integrated the build verification step into the preceding plan as a final task

### Patterns Established
- Cookie-based server-side redirect: `await cookies()` → DB lookup → `redirect()` before JSX return
- `JoinForm` as a separate client file — clean `use client` boundary from server component routing logic
- `redirect()` outside try/catch in server actions — Next.js `redirect()` throws internally, must not be caught
- No `secure: true` on httpOnly cookies — consistent dual-environment approach (Vercel enforces HTTPS at platform level)
- `npx tsc --noEmit` before `npm run build` — fast TypeScript gate before slower Next.js compilation

### Key Lessons
1. Schema-first migrations with a dedicated verification plan are safe but the verification plan should include build steps, not be a separate plan if code changes are unlikely
2. The cookie-based identity pattern is clean for small apps — avoids auth complexity while maintaining per-user state
3. Phased migration (schema → server → UI → verify) is the right order; reverting is painful if you skip steps

### Cost Observations
- Sessions: unknown
- Notable: 8 plans in 4 days — consistent pace, no major rework sessions

---

## Milestone: v1.2 — Multi-Campaign DM

**Shipped:** 2026-03-05
**Phases:** 3 | **Plans:** 7 | **Timeline:** 2 days (2026-03-04 → 2026-03-05)

### What Was Built
- DM auth infrastructure — DM + Session Prisma models, bcryptjs password hashing, httpOnly session cookie, `getSessionDM()` utility
- Auth server actions (signUp, logIn, logOut) + Next.js middleware protecting `/campaigns/:path*`
- Sign-up and login pages wired to server actions with inline error display
- Campaign schema extended with `name`, `description`, `maxPlayers`, `dmId` FK; `createCampaign` validates name and links to authenticated DM; `registerPlayer` enforces join cap
- Campaign form, dashboard, and join page updated for new fields and "Campaign Full" gate
- Multi-campaign home dashboard at `/campaigns` — campaign cards, empty state, "Create new campaign" button

### What Worked
- Split data layer (09-01) and UI layer (09-02) cleanly — schema and server action changes committed before UI touched any of the new fields
- Prisma client regeneration issue (after `db push`) was caught at human-verify stage, not in production — dev server restart resolved it
- `useActionState` from `react` (React 19) pattern carried forward consistently from v1.0
- Logout as a plain HTML form with server action required zero client-side JS — clean pattern discovered during Phase 8 and applied everywhere

### What Was Inefficient
- Prisma client not regenerated automatically after schema changes — required a manual `prisma generate` + dev server restart mid-verification; could note this in future auth/schema plans as an explicit task step
- Phase 8 had 4 plans; the last plan (08-04) was lightweight (logout button + verification) and could likely have been merged into 08-03

### Patterns Established
- `getSessionDM()` as the single auth utility — returns DM or null, callers redirect on null
- Logout as `<form action={logOut}>` in Server Component — no `use client` needed
- Required fields validated in server action (not DB constraint) when using `db push` — avoids breaking schema changes against existing data
- `_count: { select: { playerSlots: true } }` pattern for cap enforcement in `registerPlayer`
- After any `db push`, run `prisma generate` and restart the dev server before testing

### Key Lessons
1. Auth is the foundation — building it before campaign features (not alongside) meant zero auth-related rework in Phases 9 and 10
2. `db push` without `prisma generate` is a footgun — the Prisma client doesn't update automatically; explicit `generate` step should be in any plan that modifies the schema
3. Two-day milestone pace is achievable for a 3-phase feature set; 7 plans executed cleanly with no rework beyond the Prisma client issue

### Cost Observations
- Sessions: 3 (one per phase approximately)
- Notable: 7 plans in 2 days — fastest milestone yet; auth infrastructure plan (08-01) took only 8 minutes

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Pattern |
|-----------|--------|-------|-------------|
| v1.0 MVP | 4 | 14 | Baseline established — atomic plans, human smoke tests |
| v1.1 Onboarding | 3 | 8 | Phased migration pattern proven — schema → server → UI → verify |
| v1.2 Multi-Campaign DM | 3 | 7 | Auth-first approach; data layer before UI; fastest milestone |

### Top Lessons (Verified Across Milestones)

1. **Human smoke tests at phase end catch integration issues** — all three milestones verified via human test; zero regressions shipped
2. **Server-side first** — server components, server actions, and server-side data aggregation consistently produce cleaner, faster code than client-side alternatives
3. **Ship and learn** — v1.0 revealed invite link friction that became v1.1; shipping quickly generates real product insight
4. **Data layer before UI** — splitting schema/action plans from UI plans (v1.2 pattern) prevents wiring errors and enables parallel verification
