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
| v1.3 DM Experience | 6 | 14 | Server Component boundary discipline; post-approval polish iterations; largest LOC delta |
| v1.4 Clarity & Polish | 3 | 3 | Purely additive UI — fastest milestone; native dialog; icon consistency audit pattern |
| v1.5 Marketing Home Page | 5 | 9 | IntersectionObserver + CSS transitions; scroll animations with prefers-reduced-motion |
| v1.6 Campaign Detail Rework | 3 | 4 | DOM source order for responsive stacking; `100dvh` for fixed panels; paginated DM calendar |

### Top Lessons (Verified Across Milestones)

1. **Human smoke tests at phase end catch integration issues** — all milestones verified via human test; zero regressions shipped to production
2. **Server-side first** — server components, server actions, and server-side data aggregation consistently produce cleaner, faster code than client-side alternatives
3. **Ship and learn** — v1.0 revealed invite link friction that became v1.1; shipping quickly generates real product insight
4. **Data layer before UI** — splitting schema/action plans from UI plans prevents wiring errors and enables parallel verification
5. **Scope UX interactions upfront** — leaving interaction model implicit (clickable? side panel? keyboard nav?) guarantees a post-approval iteration; specify it in the plan success criteria
6. **Specify icon style and layout in success criteria** — name the icon, colour, and alignment to avoid post-approval feedback rounds
7. **DOM source order drives mobile layout** — sidebar first in DOM, CSS grid reorders on desktop; avoids JS for responsive column swapping
8. **Use `dvh` not `vh` for fixed full-screen panels** — `100vh` ignores mobile browser chrome, creating bottom gaps; `100dvh` is always correct

---

## Milestone: v1.3 — DM Experience & Scheduling Flow

**Shipped:** 2026-03-12
**Phases:** 6 | **Plans:** 14 | **Timeline:** 3 days active dev (2026-03-09 → 2026-03-12)

### What Was Built
- Post-creation share modal — auto-appears via ?share=1 URL param, two copy buttons (link + pre-written message)
- DmAvailabilityException schema + click-to-toggle calendar with block/flag mode per campaign
- Dashboard redesign — CampaignTabs Client Component, paginated DashboardCalendar, BestDaysList with click-to-expand side panel
- CopyBestDatesButton — 13×13 clipboard SVG icon adjacent to Best Days title, pre-computed message from Server Component
- DatePickerInput — hand-rolled picker with hidden input FormData bridge, typed date entry, ArrowLeft/Right keyboard navigation

### What Worked
- Pre-computing state in Server Components and passing as serialised props to Client Components — kept all Client Components stateless except for UI-only state (copied flag, tab index)
- Optimistic UI for DM exception toggle (same rollback pattern as AvailabilityForm) — instant feedback with no loading states
- CSS-only hover tooltips continued to prove their worth — zero JS state overhead for day-cell tooltips in DashboardCalendar
- The hidden input FormData bridge pattern for DatePickerInput meant zero Server Action changes — clean boundary between UI and data layer
- Post-approval polish iterations (DM exceptions to Settings accordion, Best Days click-to-expand, planning window inline edit auto-close) were quick wins that significantly improved the UX without rework of core logic

### What Was Inefficient
- Phase 14 accumulated 4 plans partly because two post-approval feedback rounds (Settings reordering, Players accordion UX) added work that wasn't in the original spec — tighter upfront UX review of the dashboard layout would have caught these
- Phase 16 was planned with a button trigger; user feedback after checkpoint revealed the need for typed date entry and keyboard navigation — these should have been scoped from the start
- Two post-phase bug fixes (revalidatePath missing from updatePlanningWindow, calendar nav stepping by 1 not 2) were caught in user testing rather than during verification — could have been caught with a more thorough smoke test checklist

### Patterns Established
- `?share=1` URL param for post-action modals — Server Component reads searchParams, no DB field needed
- `delete+create` toggle pattern for junction-table-style records (mirrors toggleDateOverride from v1.0)
- CampaignTabs as a single Client Component boundary — Server Component fetches all data, passes as serialised props, Client Component owns all tab/UI state
- Pre-compute message in Server Component, pass to icon button Client Component — message always matches visible UI, no stale data risk
- `<input type="hidden" name={name} value={formattedValue} />` as FormData bridge for custom pickers — zero Server Action changes required
- Calendar pagination: `slice(i, i + 2)` with step-by-2 navigation and `canGoNext` gate — no overlap, correct single-month final page on odd windows
- `revalidatePath` required in any Server Action that changes data used by Server Components — missing it produces a silent "stale render" bug

### Key Lessons
1. **UX scope creep is real** — when a phase spec says "show best days", it should also specify interaction model (clickable? side panel?). Leaving it implicit guarantees a post-approval iteration
2. **Typed input + keyboard nav should be scoped upfront for any custom input component** — retrofitting these after checkpoint costs an extra planning round
3. **Smoke tests should explicitly check revalidation** — "does the UI update without a manual refresh after saving?" should be a first-class test case in any plan that includes a Server Action
4. **The hidden-input FormData bridge is the right pattern for styled custom inputs** — proven on DatePickerInput; use it for any future custom form control
5. **Calendar pagination edge cases need explicit test cases** — "N months with even/odd count, step forward/back through full window" should be in the UAT checklist

### Cost Observations
- Sessions: 4-5 (schema/utilities, share modal, DM exceptions, dashboard redesign, best dates + date picker)
- Notable: Largest LOC delta of any milestone (+9,558 / -348) — dashboard redesign and DatePickerInput were the biggest contributors



---

## Milestone: v1.4 — Clarity & Polish

**Shipped:** 2026-03-13
**Phases:** 3 | **Plans:** 3 | **Timeline:** 1 day (2026-03-13)

### What Was Built
- DM unavailable legend swatch in Group Availability calendar (conditional on dmExceptionDates.length > 0) with matching exclamation-circle indicator in date side panel and Best Days cards ("DM unavailable" label)
- "No players available this day." empty state in date panel when freeCount === 0
- HowItWorksModal — native `<dialog>` with full focus trap, visual numbered step cards, DM/player role toggle, backdrop + Escape dismiss
- HowItWorksButton wired into all four pages: home (below auth buttons), campaigns (icon-only with logout), join (near heading), availability (near heading)

### What Worked
- Native `<dialog>` for focus trap — zero dependencies, spec-correct, works across all browsers; the right call vs a JS-managed div overlay
- Single-plan phases worked well for small-scope additive changes — no wave overhead for three sequential 1-plan phases
- Icon consistency applied retroactively (Best Days "DM busy" → exclamation-circle "DM unavailable") was a quick win with meaningful UX improvement
- Committed v1.3 before starting v1.4 gave a clean baseline — stat tracking and tagging stayed accurate

### What Was Inefficient
- Phase 17 checkpoint required two post-approval polish rounds: (1) amber square → exclamation-circle icon in panel, (2) consistent icon + label in Best Days cards — both should have been in the original plan spec
- Phase 18 verification revealed the modal wasn't centered and the trigger icon/position needed adjustment — layout details that can be specified upfront with a simple mockup in the plan

### Patterns Established
- Native `<dialog>` + `showModal()` / `close()` is the correct pattern for modals requiring focus containment — use for any new modals; `ShareModal` is a candidate for future upgrade
- `defaultRole` prop on `HowItWorksButton` — Server Components pass the correct default; Client Component manages toggle state internally
- Exclamation-circle SVG as the standard "DM unavailable" icon — matches the visual language of the date panel and Best Days list
- Post-checkpoint icon audits: whenever a new icon/indicator is added, check all components that represent the same concept for consistency

### Key Lessons
1. **Specify icon style in plan success criteria** — "show a DM unavailable indicator" is not specific enough; "show an exclamation-circle SVG in amber" avoids a post-approval feedback round
2. **Layout alignment is part of the acceptance criteria** — "modal appears" should include "modal is horizontally centered and does not overflow viewport"
3. **Icon consistency audit should be a task in any plan that introduces a new icon** — adding an icon to one component means checking all related components for the same concept
4. **1-plan phases are appropriate for sub-100-line changes** — no planning overhead needed when the work is a single focused file edit

### Cost Observations
- Sessions: 1 (all three phases in a single day)
- Notable: Fastest milestone yet — 3 phases, 1 day, 20 files, +2,217 LOC; purely additive UI work with no data model changes

---

## Milestone: v1.5 — Marketing Home Page

**Shipped:** 2026-03-14
**Phases:** 5 | **Plans:** 9 | **Timeline:** 2 days (2026-03-13 → 2026-03-14)

### What Was Built
- Static page shell with sticky nav (logo, Beta badge, auth CTAs, scroll-aware background transition)
- Scroll-triggered fade + slide-up animations via `IntersectionObserver` + CSS transitions (prefers-reduced-motion respected)
- Features step-selector — 4 clickable steps with expanded descriptions and paired images
- Interactive availability demo — DM dashboard and player availability pickers rendered in the page with fake data
- Sticky nav scroll behaviour — background fades in once user scrolls past the hero

### What Worked
- `IntersectionObserver` with one-shot `disconnect()` — lightweight, no dependency, correctly fires once per element
- CSS `grid-rows-[0fr]` / `grid-rows-[1fr]` for FAQ accordion — smooth height animation with zero JS height calculation
- Static-data demos embedded in the marketing page reused existing UI components — zero duplication of component logic
- Landing page as a completely separate route from the app — clean separation, no auth concerns bleeding into marketing content

### What Was Inefficient
- `plain <img>` over next/image required a comment explaining why — Next.js Image's aggressive caching caused query-string cache-busting errors; worth documenting as a known footgun for this project

### Patterns Established
- `useInView` hook with `IntersectionObserver` + `disconnect()` — reusable for any future scroll animation
- `prefers-reduced-motion` media query check in `useInView` — always respect it; one-liner to add to the hook
- CSS-only FAQ accordion with `grid-rows` — no state management for height animation

### Key Lessons
1. **Reuse app components in marketing demos** — identical UI components in demos stay in sync with the app automatically; no fork to maintain
2. **next/image aggressive caching is a footgun** — plain `<img>` is safer for static assets that don't need responsive sizing or priority loading
3. **Scroll animations require `prefers-reduced-motion` from day one** — retrofitting it is trivial but including it upfront is better practice

### Cost Observations
- Sessions: 2
- Notable: 5 phases, 2 days — marketing page was self-contained and moved quickly; interactive demos were the most complex piece

---

## Milestone: v1.6 — Campaign Detail Rework

**Shipped:** 2026-03-18
**Phases:** 3 | **Plans:** 4 | **Timeline:** 2 days (2026-03-16 → 2026-03-18)

### What Was Built
- `dmSyncEnabled Boolean @default(true)` on Campaign schema — additive, non-breaking, opt-out sync model
- `toggleDmException` extended with sibling propagation — respects each sibling's planning window, only writes dates in range
- `setDmSyncEnabled` server action with optimistic UI rollback pattern
- Two-column Availability tab layout — CSS Grid `lg:grid-cols-[1fr_320px]`, sidebar DOM-first for mobile stacking
- Fixed slide-in date detail panel — `position: fixed`, `z-[52]`, `h-[100dvh]`, backdrop at `z-[51]`
- Flat Settings tab — divider-separated sections, `max-w-2xl` left-aligned, all content visible without accordions
- `DmSyncToggle` component — radio button pair ("Sync enabled" / "Sync off") matching exception mode radio style
- Paginated `DmExceptionCalendar` — 2-months-at-a-time with prev/next nav, matching `DashboardCalendar` pattern

### What Worked
- DOM source order for responsive column ordering — sidebar first in DOM, `lg:col-start-*` places it visually; clean, no JS
- `@default(true)` for sync — existing campaigns auto-enrolled; DM doesn't need to do anything for the feature to work
- Matching radio button pattern for `DmSyncToggle` — visual consistency with exception mode toggle; user confirmed immediately
- Paginated calendar pattern reuse from `DashboardCalendar` — identical approach applied to `DmExceptionCalendar` with minimal effort

### What Was Inefficient
- Date panel initially implemented as sidebar content swap — user rejected it, reverted to fixed panel; should have clarified this upfront in discuss-phase
- Mode toggle briefly converted to a switch — user rejected it; radio button pattern preferred throughout; clarify toggle vs radio upfront
- Fixed panel z-index conflict with AppNav — panel was `z-20`, AppNav is `z-50`; panel rendered behind nav; required post-build fix
- `100vh` vs `100dvh` bug on mobile — gap at panel bottom; caught during user testing; should be in a standard checklist for any `position: fixed` full-height element

### Patterns Established
- Fixed slide-in panels must be `z` above sticky nav: `z-[51]` for backdrop, `z-[52]` for panel (AppNav is `z-50`)
- `h-[100dvh]` for any fixed full-screen overlay — `100vh` ignores mobile browser chrome
- DOM-first sidebar for responsive two-column layouts — sidebar in source order, `lg:col-start-1/2` for visual placement
- `@default(true)` for opt-out features — cleaner than requiring DM to enable; existing records automatically enrolled
- Sibling propagation in server action: `findMany({ where: { dmId, dmSyncEnabled: true, id: { not: campaignId } } })` then `createMany` within `$transaction`

### Key Lessons
1. **Clarify overlay vs sidebar swap upfront** — "date detail" is ambiguous; specify "fixed overlay keeps calendar visible" vs "sidebar swaps content" in discuss-phase
2. **Toggle vs radio button preference should be established per project** — this codebase consistently uses radio buttons for two-option settings; document as a pattern
3. **Check z-index of all sticky/fixed elements before planning a new overlay** — AppNav at z-50 is a known constraint; new panels need z > 50
4. **`100dvh` is always correct for full-screen fixed elements** — add it to a standard checklist for any position:fixed panel
5. **Opt-out defaults (`@default(true)`) are better for sync features** — zero DM action required; feature works immediately for all campaigns

### Cost Observations
- Sessions: 3-4
- Notable: 3 phases, 4 plans, +2,605 / -224 LOC — two revision rounds (panel type, toggle style) added iterations but no major rework

