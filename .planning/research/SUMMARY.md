# Project Research Summary

**Project:** Where's the Cleric — D&D Session Planner (v1.3 DM Experience & Scheduling Flow)
**Domain:** Group scheduling / availability coordination for tabletop RPG groups
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

v1.3 adds five tightly-related features to an already well-structured Next.js 16 / React 19 / Prisma 7 / Tailwind CSS 4 codebase. The core insight from cross-cutting all four research files is that every new capability either (a) directly reuses a proven in-codebase pattern or (b) mirrors an exact analogue that already exists. Clipboard copy is already in production. The calendar grid algorithm is already implemented twice. The DM availability exception model is a direct structural parallel to the existing `PlayerException` / `AvailabilityEntry` model. This means v1.3 is a refactoring-and-surfacing milestone more than a net-new-capability milestone, and zero new npm dependencies are required.

The recommended approach is to build in dependency order: schema first (to unlock DM exception storage), then shared utility extraction (to avoid a third copy of `buildMonthGrid`), then the share modal and copy features (zero data dependencies), then the DM exception UI wired to the new schema, then the calendar/ranked-list redesign that incorporates all of the above, and finally the custom date picker as a polish item. This order ensures every phase has a working, testable output and no phase blocks another phase from starting.

The critical risks are all well-understood and documented in detail: hydration mismatches from timezone-unsafe date rendering, state loss in `useActionState` forms if the custom picker is implemented as a controlled input without the hidden-input pattern, and the impossibility of opening a share modal directly from a server-side `redirect()`. All three have a clear, tested mitigation strategy consistent with how the existing codebase already works. The team's established patterns — UTC-everywhere date discipline, narrow client component islands, hidden inputs for Server Action forms, `redirect()` outside `try/catch` — are the correct patterns and must be maintained without exception.

---

## Key Findings

### Recommended Stack

No new packages are required for v1.3. The existing stack handles every stated capability. `navigator.clipboard.writeText()` is already proven in `CopyLinkButton.tsx`. The calendar grid algorithm (`buildMonthGrid`, `formatDateKey`) is already implemented in both `AvailabilityCalendar.tsx` and `DashboardCalendar.tsx` — these must be extracted to `src/lib/calendarUtils.ts` before any new calendar component is written, which eliminates duplication. The only genuinely new UI pattern is a custom date picker to replace `<input type="date">`; this is best built hand-rolled (approximately 80 lines of TSX) because it reuses the existing grid logic, inherits the CSS custom property theme perfectly, and avoids Tailwind CSS 4 stylesheet-override friction with third-party date picker libraries.

**Core technologies (existing, confirmed):**
- Next.js 16 App Router — Server Components own data fetching, Server Actions own mutations
- React 19 `useActionState` — form submission pattern; the hidden-input approach keeps this unchanged for the custom date picker
- Tailwind CSS 4 — CSS custom properties (`--dnd-accent`, `--dnd-input-bg`, etc.) are already defined; the custom picker inherits them for free
- Prisma 7 + Neon PostgreSQL — existing pattern of per-record availability tables, not JSON columns
- `navigator.clipboard.writeText()` — browser-native, no library needed, already in production

**New extraction (not a new dependency):**
- `src/lib/calendarUtils.ts` — extracts `buildMonthGrid()` and `formatDateKey()` from the two existing copies; all calendar components import from here

### Expected Features

**Must have (table stakes):**
- Post-creation share modal — campaign is useless until the link is shared; this is the next required action after creation and currently the DM must navigate to find the link
- Copy join link button — single click, "Copied!" button-state feedback, no toast needed
- Pre-written invite message copy — DMs paste into Discord/WhatsApp; without this they write it themselves every time, inconsistently
- Two-month calendar view on campaign dashboard — the planning window is currently truncated by the single-month view
- Ranked best-day list alongside the calendar — rankings already exist in the data model but are not surfaced in the redesigned layout
- DM unavailability exceptions (per campaign) — without this, the best-day list is wrong because it ignores the DM's own constraints

**Should have (differentiators):**
- "Copy best dates" formatted message — closes the loop from "seeing the answer" to "communicating the answer" in one click; no other scheduling tool targets the D&D group-chat workflow specifically
- Block vs flag toggle for DM unavailability — nuance absent from general-purpose tools; gives the DM control over how their unavailability affects recommendations
- Custom purple-themed date picker — the native browser picker breaks the app's visual identity; consistent theming signals quality

**Defer to v1.4+:**
- DM recurring availability patterns (full availability form mirroring the player flow)
- Player-facing display of DM unavailability (requires a transparency/UX decision outside v1.3 scope)
- Auto-send or email delivery of share messages (requires email infrastructure, out of scope)
- Calendar month pagination (two-month simultaneous view is confirmed better for this use case)

### Architecture Approach

The codebase is cleanly structured around Server Components for data fetching and narrow `'use client'` islands for interactivity. v1.3 extends this in four distinct areas, each with a clear integration point. The share modal uses a URL search param (`?share=1`) as the only durable signal that survives the server-side `redirect()` boundary — the Server Component reads `searchParams`, passes a boolean prop to the `ShareModal` client component which mounts open. DM availability exceptions get a new first-class `DmAvailabilityException` Prisma model (not a JSON column, not a variant of `AvailabilityEntry`) with `@@unique([campaignId, date])`, fetched via the same `include` the campaign detail page already uses for `playerSlots`. The best-day copy button is a narrow client component island (`CopyBestDaysButton`) embedded in the otherwise-Server `BestDaysList`. The custom `DatePicker` emits a `<input type="hidden">` so all existing Server Actions read `formData.get(name)` unchanged.

**Major components:**
1. `ShareModal` (Client, New) — mounts open on campaign creation; two copy buttons (link + invite message); cleans `?share=1` from URL on dismiss with `router.replace`
2. `DmExceptionCalendar` (Client, New) — click-to-toggle calendar for marking DM-unavailable dates; optimistic UI with rollback on error; mirrors `AvailabilityForm` pattern
3. `DatePicker` (Client, New) — styled popover calendar; emits `<input type="hidden">` for form compatibility; reuses extracted `buildMonthGrid` from `calendarUtils.ts`
4. `CopyBestDaysButton` (Client, New) — narrow island for clipboard; receives pre-built message string from `BestDaysList` (stays Server)
5. `DmAvailabilityException` (Prisma model, New) — separate table; `@@unique([campaignId, date])`; `Campaign` gets `dmExceptionMode String?` for block/flag toggle
6. `src/lib/calendarUtils.ts` (Utility, New) — extracted `buildMonthGrid` and `formatDateKey`; imported by all calendar components

**Key patterns to follow:**
- Narrow client component islands (do not promote server components to client just for one interactive element)
- Hidden input for all custom form controls wired to `useActionState` forms
- UTC-everywhere date discipline (`Date.UTC(y, m-1, d)`, never `new Date(datetimeString)` without Z suffix)
- Serialize `DateTime` fields to `YYYY-MM-DD` strings before passing to client components

### Critical Pitfalls

1. **Hydration mismatch from timezone-sensitive date rendering** — any `new Date()` at SSR render time or date formatting without `{ timeZone: 'UTC' }` will produce a hard React 19 hydration error. Always slice ISO strings or use `Date.UTC`. For "today" defaults in the date picker, set on the client only inside `useEffect` or lazy `useState`, never during SSR.

2. **Controlled picker resets after server action validation error** — if `DatePicker` stores its value in `useState(props.defaultValue)`, that state resets to the initial value when `useActionState` re-renders on error, and the user loses their entered dates. The fix is the hidden-input pattern: picker visual state in local `useState`, `<input type="hidden" name={name} value={localState} />` for FormData.

3. **Share modal cannot open after server-side `redirect()`** — `redirect()` is a HTTP 307; all client state is thrown away on navigation. The only durable signal is `?share=1` in the URL. Read `searchParams` in the Server Component, pass as a prop. Never call `useSearchParams()` in a child client component (requires Suspense boundary).

4. **DM unavailability modelled as `AvailabilityEntry` variant corrupts the unique constraint** — nullable FK in a composite unique index is technically legal in PostgreSQL but creates duplicate-entry risk and bypasses the ORM's type system. Use a separate `DmAvailabilityException` table with its own `@@unique([campaignId, date])`.

5. **`computeBestDays` cannot express block vs flag if it filters** — adding DM blocking as a filter to the ranking function makes the "flag" mode (keep ranked, show warning) inexpressible. Add `dmBlocked: boolean` to the `DayAggregation` interface and let rendering components (`BestDaysList`, `DashboardCalendar`) decide whether to hide or badge blocked days.

---

## Implications for Roadmap

Based on combined research findings, the feature dependency graph drives a clear build order. Every phase has a testable output and no phase blocks another from starting.

### Phase 1: Schema Foundation + Utility Extraction

**Rationale:** Two zero-UI changes that every downstream phase depends on. Schema migration unlocks DM exception storage. Utility extraction prevents a third copy of `buildMonthGrid` and forces a clean shared API before any new calendar component is written.
**Delivers:** `DmAvailabilityException` Prisma model, `dmExceptionMode` on Campaign, `src/lib/calendarUtils.ts` with `buildMonthGrid` and `formatDateKey` exported.
**Addresses:** Structural prerequisite for all other phases.
**Avoids:** JSON column anti-pattern (Pitfall 4), third-copy duplication anti-pattern (ARCHITECTURE.md anti-pattern).

### Phase 2: Share Modal + Invite Message Copy

**Rationale:** Highest immediate DM value, lowest complexity, zero data dependencies beyond the join link URL that already exists. Provides a proof-of-concept for the URL-search-param modal trigger pattern before it is needed anywhere else.
**Delivers:** Post-creation `ShareModal` with copy-link and copy-invite-message buttons; `createCampaign` action modified to redirect to `?share=1`; campaign detail page reads `searchParams.share`.
**Addresses:** Table stakes — post-creation share modal, copy join link, pre-written message copy.
**Avoids:** `redirect()` + modal state pitfall (Pitfall 3), `useSearchParams()` Suspense pitfall (Pitfall 7), clipboard-without-user-gesture pitfall (Pitfall 6).

### Phase 3: DM Availability Exceptions (Data + UI)

**Rationale:** The DM exception data must exist and be correct before the calendar redesign can display it and before the best-dates message can exclude blocked days. Building the `DmExceptionCalendar` and `toggleDmException` Server Action in this phase also proves the optimistic-UI pattern before it is needed for anything else.
**Delivers:** `DmExceptionCalendar` component; `toggleDmException` Server Action; `dmBlocked` field added to `DayAggregation`; block/flag mode respected in `computeDayStatuses`.
**Addresses:** Table stakes — DM unavailability exceptions; differentiator — block vs flag toggle.
**Avoids:** `AvailabilityEntry` reuse pitfall (Pitfall 4), `computeBestDays` filter pitfall (Pitfall 5), date parsing drift pitfall (Pitfall 9).

### Phase 4: Two-Month Calendar + Ranked Date List Redesign

**Rationale:** The big visible change. Now incorporates DM exception data (from Phase 3) correctly. The underlying calendar grid algorithm already works — this phase is layout restructuring (Basecamp-style two-panel) and wiring in the `dmBlocked` field to rendering.
**Delivers:** Two-month side-by-side calendar view with DM-unavailable day markers; ranked best-day list panel with block/flag conditional rendering; cross-panel hover linkage.
**Addresses:** Table stakes — two-month calendar view, ranked best-day list; anti-feature removed — calendar pagination eliminated in favour of simultaneous view.
**Avoids:** Per-player colour complexity (anti-feature from FEATURES.md — use fill-intensity aggregate instead).

### Phase 5: Shareable Best Dates Message

**Rationale:** Depends on the ranked list being correct (Phase 4) which depends on DM exceptions being resolved (Phase 3). Low complexity once upstream data is right — it is a message template rendered in `BestDaysList` and passed to `CopyBestDaysButton`.
**Delivers:** `CopyBestDaysButton` client component; pre-formatted top-3 best-dates message (numbered list, day name + full date, "everyone free" vs "N/M free (Name busy)"); copy button on dashboard.
**Addresses:** Differentiator — shareable best dates message; anti-feature enforced — top 3 only in copied message.
**Avoids:** Promoting `BestDaysList` to a client component unnecessarily (ARCHITECTURE.md anti-pattern).

### Phase 6: Custom Date Picker (Polish)

**Rationale:** A polish item with no dependencies on any other phase. Blocked nothing, blocks nothing. Placed last so it doesn't delay DM-facing functionality. The `calendarUtils.ts` extraction in Phase 1 means this is approximately 80 lines of TSX with no new logic to invent.
**Delivers:** `DatePicker` client component with hidden input; replaces `<input type="date">` in `CampaignForm` and `UpdatePlanningWindowForm`; `globals.css` `input[type="date"]` overrides removed.
**Addresses:** Differentiator — custom purple-themed date picker consistent with app visual identity.
**Avoids:** Hydration mismatch pitfall (Pitfall 1), controlled picker reset pitfall (Pitfall 2), `defaultValue` re-sync pitfall (Pitfall 8), Tailwind CSS 4 third-party stylesheet conflict.

### Phase Ordering Rationale

- Schema and utility extraction come first because they are zero-UI changes that every other phase depends on; doing them first also prevents any feature phase from making a schema or duplication decision it will regret.
- Share modal comes second because it is isolated (no schema dependency) and delivers immediate DM value; it also validates the URL-param modal pattern early.
- DM exceptions come before the calendar redesign because the redesign must render DM-blocked days correctly; building UI before the data model is ready creates rework.
- The shareable message comes after the calendar redesign (not before) because its content depends on DM exceptions being factored into rankings.
- The date picker is genuinely last — it is a cosmetic replacement that touches no data model and can be done independently.

### Research Flags

Phases with well-documented patterns (skip additional research):
- **Phase 1 (Schema + Utilities):** Direct Prisma model addition following existing patterns; extraction of already-written functions. Standard.
- **Phase 2 (Share Modal):** ARCHITECTURE.md documents the exact implementation with code samples. The URL-search-param pattern is well-established in Next.js App Router.
- **Phase 3 (DM Exceptions):** Exact parallel to `AvailabilityEntry` / `toggleDateOverride` pattern already in the codebase.
- **Phase 4 (Calendar Redesign):** Existing `DashboardCalendar` already supports multi-month rendering; this is layout restructuring and prop-passing, not new algorithm work.
- **Phase 5 (Copy Best Dates):** ARCHITECTURE.md provides the exact component split and message format.
- **Phase 6 (Date Picker):** STACK.md provides the implementation pattern with theme classes.

No phases require `/gsd:research-phase` during planning. All technical questions are resolved.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on direct codebase inspection confirming existing capabilities; no new dependencies means no library API uncertainty |
| Features | HIGH | Share modal, calendar layout, and DM exception patterns are all well-established in scheduling tools; 3-date limit in shareable message is a product recommendation (not industry standard) but strongly supported |
| Architecture | HIGH | All claims derived from direct codebase inspection of actual source files; implementation patterns documented with working code samples |
| Pitfalls | HIGH | Pitfalls 1-5 (critical) are all derived from direct inspection of the codebase combined with well-established React 19 / Next.js App Router behaviour; MEDIUM only on Prisma nullable FK upsert specifics |

**Overall confidence:** HIGH

### Gaps to Address

- **Block vs flag toggle persistence location:** FEATURES.md identifies this as needing confirmation — PROJECT.md says "per-campaign toggle" implying DB storage on the Campaign record. The `dmExceptionMode String?` field on Campaign (ARCHITECTURE.md recommendation) addresses this; confirm during Phase 3 implementation.
- **DM exception visibility to players:** Not specified in v1.3 scope. If blocked dates disappear from the player availability calendar view, that is a change to the player flow. This needs a product decision before Phase 3 implementation — document it as a deferred decision, default to "no player-facing change in v1.3."
- **`UpdatePlanningWindowForm` revalidation after save:** PITFALLS.md notes that `updatePlanningWindow` may not call `revalidatePath`, which affects the `key`-based remount strategy for the custom date picker. Confirm the action's revalidation behaviour in Phase 6 before implementing the key prop.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection: `src/components/CopyLinkButton.tsx`, `DashboardCalendar.tsx`, `AvailabilityCalendar.tsx`, `CampaignForm.tsx`, `UpdatePlanningWindowForm.tsx`, `BestDaysList.tsx`, `CopyLinkButton.tsx`, `globals.css`, `package.json`, `prisma/schema.prisma`, `src/lib/actions/campaign.ts`, `src/lib/actions/availability.ts`, `src/lib/availability.ts`
- `.planning/PROJECT.md` — authoritative project context (key decisions, architecture principles)

### Secondary (MEDIUM-HIGH confidence)

- Scheduling tool UX patterns: Calendly, Doodle, When2Meet, Basecamp Schedule, Cal.com, Google Meet share flows, Discord invite UI, Linear timeline — training knowledge, patterns stable for 3+ years
- Next.js App Router: `redirect()` NEXT_REDIRECT throw behaviour, `searchParams` as Server Component prop, `useSearchParams()` Suspense requirement — training knowledge, knowledge cutoff August 2025
- React 19 hydration strictness, `useActionState` behaviour on error, `useState` initial value semantics — core React behaviour, well-established

### Tertiary (MEDIUM confidence)

- react-day-picker v9 API and Tailwind CSS 4 third-party stylesheet conflict specifics — training knowledge only, not verified via live docs; the recommendation to avoid the library is made regardless
- Prisma upsert behaviour with nullable FK in composite unique index — spec-defined PostgreSQL NULL behaviour confirmed; Prisma ORM-specific upsert accessor behaviour inferred from codebase pattern

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
