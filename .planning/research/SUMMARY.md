# Project Research Summary

**Project:** Where's the Cleric — D&D Session Planner (v1.4 UI Clarity)
**Domain:** Next.js 16 App Router web app — scheduling tool for small groups
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

v1.4 is a focused UI clarity milestone adding four features to an already-working app: a "How it works" onboarding modal, a DM unavailable legend entry in the Group Availability calendar, a DM unavailable indicator in the date side panel, and a clearer empty state when no players are available on a selected date. All research converges on a single conclusion: zero new dependencies, zero schema changes, zero new server actions. Every required capability already exists in the codebase and is either directly reusable (the `ShareModal` modal pattern, `CampaignTabs` side panel, `DayAggregation.dmBlocked` field) or a trivial extension of it.

The recommended approach is surgical. The three calendar/panel changes are concentrated in `CampaignTabs.tsx` (three small JSX additions), and the modal is a new standalone client component (`HowItWorksModal` + `HowItWorksButton`) that follows the established `ShareModal` and narrow-island patterns already in production. Build order matters: the `CampaignTabs` changes (legend, indicator, empty state) are near-zero-risk and should land first; the modal is self-contained but introduces the most surface area and should be built and tested independently before being wired into four pages.

The principal risks are architectural discipline risks, not technical ones. The Server Component pages that need the "How it works" trigger button must not be converted to Client Components. The modal must not manipulate the URL or browser history. It should use the native `<dialog>` element (or add `aria-modal`/`aria-labelledby` to the div-overlay) to satisfy focus-trap and accessibility requirements that `ShareModal` currently skips — the dashboard has many interactive targets that a keyboard user can reach if focus is not properly trapped. The amber legend swatch must match the calendar cell's exact opacity so the legend and calendar are visually consistent.

## Key Findings

### Recommended Stack

No additions to `package.json`. All four features are achievable with what is already installed and proven in production: Next.js 16 App Router, React 19, Tailwind CSS 4, and the existing fixed-overlay modal pattern from `ShareModal.tsx`. The case against adding modal libraries (`@radix-ui/react-dialog`, `@headlessui/react`), animation libraries (`framer-motion`), or focus-trap libraries is clear: the existing patterns handle all required cases at this app's scale.

The one technology decision worth flagging: the new modal should use the native `<dialog>` element with `ref.current.showModal()` rather than the div-overlay pattern used by `ShareModal`. The `<dialog>` element provides a built-in focus trap, native Escape-key handling, and correct ARIA semantics — benefits that `ShareModal` forgoes because it opens on a relatively simple page. The "How it works" modal opens on the dashboard, which has many interactive targets (calendar cells, tab buttons) that a keyboard user can reach if focus is not properly trapped.

**Core technologies (existing, confirmed):**
- `CampaignTabs.tsx` — all three calendar/panel features land here; no new component boundary required
- `ShareModal.tsx` — direct structural template for `HowItWorksModal`; same fixed-overlay, backdrop, dismiss pattern
- `DayAggregation.dmBlocked` — already computed and in `aggMap`; powers both the legend gate and the panel indicator without new data fetching
- Native `<dialog>` element (React 19) — recommended for built-in focus trap and ARIA semantics on the new modal

**New files (not new dependencies):**
- `src/components/HowItWorksModal.tsx` — pure display component, static step copy, `onClose` prop only
- `src/components/HowItWorksButton.tsx` — narrow `'use client'` island, owns `useState(open)`, imports modal

### Expected Features

All four v1.4 features are confirmed table stakes. The research also identified one clear differentiator (role toggle in the modal) and several explicit anti-features.

**Must have (table stakes):**
- DM unavailable legend entry — the amber ring on calendar cells has no legend explanation; any DM who hasn't read Settings won't know what it means
- DM unavailable indicator in date panel — when a DM-blocked date is clicked, the panel gives no signal that the DM themselves is unavailable
- Clear "no players available" state — listing all players as "No response" reads as a failure list, not an informational state
- "How it works" modal (DM perspective) — no onboarding exists; the workflow is non-obvious for new DMs
- "How it works" modal (player perspective) — players arrive via a shared link with no context about what to do

**Should have (differentiators):**
- Role toggle inside the modal ("For DMs" / "For Players") — lets a DM understand the player flow when onboarding their group; implementation cost is low once the modal is built; the alternative is a single unified linear narrative covering both roles

**Defer (v2+):**
- "No response" vs "not free" distinction in the panel — requires threading a richer player status type through `DayAggregation`; moderate scope change, low gain for small groups where the DM already knows who has not responded
- Auto-show modal on first visit with localStorage tracking — adds state management complexity for minimal gain; a persistent on-demand link is sufficient
- Full onboarding tour with tooltips and highlight overlays — over-engineered for a small group tool; static step-card modal is sufficient

### Architecture Approach

The architecture for v1.4 is strictly additive. The established Server→Client boundary is preserved: Server Component pages remain Server Components, client interactivity is isolated in narrow `'use client'` islands. `CampaignTabs` remains the single Client Component boundary on the dashboard. All new data (`dmBlocked`, `freeCount`, `dmExceptionDates`) is already computed and already flowing through existing props — no new data fetching or prop-threading is required for any of the four features.

**Major components:**
1. `HowItWorksButton` (new, Client) — narrow island that owns `useState(open)` and renders both trigger and modal; imported by four Server Component pages with zero props passed from the server
2. `HowItWorksModal` (new, Client) — pure display component, static step cards for DM and player perspectives, `onClose` prop only, no business logic
3. `CampaignTabs` (existing, modified) — three small additions: DM unavailable legend entry (conditional on `dmExceptionDates.length > 0`), DM unavailable indicator in side panel (conditional on `agg?.dmBlocked`), and empty-state message in side panel (conditional on `freeCount === 0`)

**Key patterns to follow:**
- Narrow client component islands — do not promote Server Component pages to Client Components for a single interactive button
- `useState` for modal open state — no URL params, no browser history manipulation (contrast with `ShareModal` which is URL-triggered for redirect reasons that do not apply here)
- `<dialog>` element with `.showModal()` for the new modal — provides focus trap and ARIA semantics that the div-overlay pattern does not
- Conditional legend rendering — only show the DM unavailable swatch when `dmExceptionDates.length > 0` to avoid confusing legend entries for states the DM has not used

### Critical Pitfalls

1. **Converting Server Component pages to Client Components to support the modal trigger** — keep pages as Server Components; the `HowItWorksButton` island owns all client state and pages only render `<HowItWorksButton />` with zero props

2. **Missing focus trap on the "How it works" modal** — the dashboard has many interactive targets; use native `<dialog>` with `.showModal()` for built-in focus trap and Escape handling rather than relying on the div-overlay pattern from `ShareModal`

3. **URL manipulation in the modal dismiss handler** — do not cargo-cult `router.replace` from `ShareModal`; the "How it works" modal is pure UI state and must not touch browser history (would cause Back button to navigate away rather than close the modal)

4. **Legend swatch colour mismatch** — the calendar cell uses `ring-amber-400/60` (desaturated amber); a full-opacity `bg-amber-400` legend swatch will look visually distinct; match opacity exactly, or deliberately upgrade the ring to full opacity in both places

5. **DM unavailable legend entry shown when no exception dates exist** — conditionally render the swatch only when `dmExceptionDates.length > 0`; a legend entry for a colour the DM has never seen in the calendar creates confusion rather than clarity

## Implications for Roadmap

The four features map to three phases ordered by risk and dependency. All phases are additive with no blocking dependencies between them — they can be done in any order, but this sequence minimises review surface and catches issues early.

### Phase 1: Calendar and Panel Clarity

**Rationale:** All three changes land in a single file (`CampaignTabs.tsx`), use data already in scope, and carry near-zero risk. They are the highest-value, lowest-effort changes in the milestone and should not be blocked on the more complex modal work.

**Delivers:** A complete calendar legend (including DM unavailable state), a DM unavailable indicator in the date side panel, and a clear empty-state message when no players are free on a selected date.

**Addresses:** DM unavailable legend entry, DM unavailable indicator in panel, "no players available" empty state (all table stakes).

**Avoids:** Pitfall 5 (dmBlocked not surfaced in panel), Pitfall 6 (legend swatch colour mismatch), Pitfall 7 (all-no-response reads as failure list), Pitfall 11 (DM swatch shown with zero exception dates).

### Phase 2: HowItWorksModal Component

**Rationale:** The modal component is self-contained with no dependencies on Phase 1. Build `HowItWorksModal` and `HowItWorksButton` first and verify them in isolation before wiring into pages. This keeps review surface contained and means page-level failures are not caused by component-level issues.

**Delivers:** A working "How it works" modal with DM and player step content (with role toggle), keyboard and focus-trap behaviour via `<dialog>`, correct ARIA semantics, and Escape key close. No page is wired yet.

**Uses:** Native `<dialog>` element (React 19), Tailwind CSS 4 custom properties (`--dnd-input-bg`, `--dnd-accent`, `--dnd-card-bg`), `useEffect` + `useRef` pattern established in `CampaignTabs.tsx`.

**Avoids:** Pitfall 1 (JSX duplication across pages), Pitfall 3 (incorrect client boundary), Pitfall 4 (missing focus trap), Pitfall 8 (broken back button from URL manipulation), Pitfall 9 (CSS counter flash for step numbers), Pitfall 10 (missing aria-labelledby), Pitfall 12 (branching content complexity).

### Phase 3: HowItWorksButton Page Integration

**Rationale:** Wire the completed and reviewed `HowItWorksButton` into all four pages once the component is known-good. Page-level changes are isolated (`import` + one JSX element each) and carry no risk to data fetching, routing, or existing UI.

**Delivers:** The "How it works" trigger accessible on the home page (`/`), DM campaigns page (`/campaigns`), player join page (`/join/[joinToken]`), and player availability page (`/join/[joinToken]/availability`).

**Avoids:** Pitfall 3 (Server Component pages must not gain `'use client'`).

### Phase Ordering Rationale

- Phase 1 before Phases 2/3: calendar and panel changes are independent of the modal and are zero-risk; they should not be blocked on modal work
- Phase 2 before Phase 3: build and verify the modal component in isolation before integrating into four pages; catches component issues without requiring page-level rollback
- All three phases are data-independent — no phase depends on a previous phase to have the right data in scope; the ordering is about review surface management, not data dependency

### Research Flags

Phases with standard patterns (research-phase not needed):
- **Phase 1 (Calendar and Panel Clarity):** All data already in scope, all patterns already in production. Three small JSX additions to an existing component. No unknowns.
- **Phase 3 (Page Integration):** Simple `import` + JSX addition per page. Established pattern from `CopyLinkButton`, `DeleteCampaignButton`, `ShareModal`.

Phases needing care during implementation (not a full research spike, but one new pattern to verify):
- **Phase 2 (Modal Component):** The `<dialog>` element + `.showModal()` pattern is new to this codebase (existing modals use div-overlay). Verify that `<dialog>` styling integrates cleanly with Tailwind CSS 4 custom properties. The `::backdrop` pseudo-element requires a `globals.css` rule rather than a Tailwind class — this is a minor new pattern. Low risk but worth a quick check before committing the approach.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All conclusions derived from direct codebase inspection; zero new packages means zero library API uncertainty |
| Features | HIGH | Table stakes and anti-features derived from direct user journey analysis in the codebase plus stable scheduling-tool UX conventions (Calendly, Doodle, Cal.com, Notion) |
| Architecture | HIGH | All architectural decisions are extensions of existing production patterns; no new data flows introduced |
| Pitfalls | HIGH (critical), MEDIUM (accessibility specifics) | Critical pitfalls from codebase inspection; accessibility specifics (VoiceOver behaviour, ARIA spec) from established W3C guidance, not verified via live tool |

**Overall confidence:** HIGH

### Gaps to Address

- **Modal trigger placement on `/campaigns`:** The exact visual slot for the "How it works" button in the campaigns page header needs a design decision (inline with heading, right-aligned, or near the logout button). Research established the right pattern (low visual weight, near page heading) but not the exact placement.

- **Player page explainer placement:** The player availability page has no existing page-level header controls. Adding the trigger needs a placement decision — above or below the `AvailabilityForm`, or inside the campaign info card.

- **Public home page scope:** Whether the modal should appear on the unauthenticated home page (`/`) for prospective users, or only on post-auth pages, is a product decision not resolved by research. The technical implementation is identical either way.

- **`<dialog>` `::backdrop` styling:** The existing `ShareModal` backdrop is a sibling `<div className="fixed inset-0 bg-black/60">`. The `<dialog>` element's `::backdrop` pseudo-element is styled via CSS, not Tailwind classes. A `globals.css` rule (`dialog::backdrop { background: rgb(0 0 0 / 0.6); }`) is straightforward but is a new pattern in this codebase. Confirm during Phase 2 implementation before committing to `<dialog>` vs div-overlay.

## Sources

### Primary (HIGH confidence)
- Codebase inspection (direct read): `CampaignTabs.tsx`, `DashboardCalendar.tsx`, `ShareModal.tsx`, `DmExceptionCalendar.tsx`, `BestDaysList.tsx`, `AvailabilityCalendar.tsx`, `lib/availability.ts`, `campaigns/page.tsx`, `page.tsx`, `layout.tsx`, `package.json`, `globals.css`
- `.planning/PROJECT.md` — active v1.4 requirements and architectural constraints
- `DayAggregation.dmBlocked` field existence confirmed via `DashboardCalendar.tsx` line 143

### Secondary (MEDIUM-HIGH confidence)
- Scheduling tool UX conventions (Calendly, Doodle, Cal.com, Notion, Linear, Google Calendar) — training data; patterns stable for 3+ years
- Empty-state and legend UX patterns — training data; well-documented across product design references
- W3C ARIA Authoring Practices Guide — `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap requirements; stable spec

### Tertiary (MEDIUM confidence)
- `<dialog>` element browser support and `.showModal()` API — established platform knowledge (Chrome 37+, Firefox 98+, Safari 15.4+); not verified via live MDN in this research session
- Tailwind CSS 4 opacity modifier behaviour (`/60`) — confirmed from Tailwind docs; knowledge cutoff August 2025

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
