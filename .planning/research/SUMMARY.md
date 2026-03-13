# Project Research Summary

**Project:** Where's the Cleric — D&D Session Planner
**Domain:** Marketing landing page integrated into existing Next.js App Router app (v1.5)
**Researched:** 2026-03-13
**Confidence:** HIGH

## Executive Summary

This milestone adds a full marketing landing page to an existing, live application. The product is a niche scheduling tool for D&D groups; the research task was to determine how to build a persuasive, animated marketing page without disrupting the running app. All four research areas converge on a single, clear finding: everything needed already exists. The stack requires zero new dependencies. The architecture follows the narrow `'use client'` island discipline the codebase has already established. The demo components can be built by wrapping existing `WeeklySchedule` and `AvailabilityCalendar` components in a new stateful shell. No animation library is justified.

The recommended approach is to build the landing page as a set of collocated components in `src/components/landing/`, with `app/page.tsx` remaining a thin Server Component that handles the auth-check-then-redirect pattern before rendering the marketing content. Scroll animations use native `IntersectionObserver` + Tailwind CSS transitions. The interactive demo is a self-contained client component with hardcoded placeholder data and no server action calls. The FeaturesBlock step-selector is pure `useState`. All of this is consistent with patterns already proven in the codebase (`Toast.tsx`, `CampaignTabs.tsx`, `HowItWorksModal`).

The key risks are implementation-order risks rather than technology risks: hydration mismatches from browser-only APIs accessed outside `useEffect`, accidentally pulling a Prisma import chain into the demo component, and inadvertently removing the auth redirect by restructuring `page.tsx`. All three are straightforward to prevent with explicit guards and build-order discipline. The PITFALLS.md research provides exact prevention patterns for each.

---

## Key Findings

### Recommended Stack

The v1.5 milestone adds **zero new dependencies** to `package.json`. All animation and interactivity requirements are met by the existing stack: Next.js 16 App Router, React 19, Tailwind CSS 4, and native browser APIs (`IntersectionObserver`, `window.scroll`).

The explicit decision to not add Framer Motion is load-bearing. Framer Motion costs 30–60 KB gzipped and would require promoting static section components to `'use client'`, undermining RSC streaming benefits. The `FadeInSection`/`ScrollReveal` pattern achieves identical visual effects in under 25 lines using the same CSS transition approach already in production in `Toast.tsx`.

**Core technologies:**
- `IntersectionObserver` (native browser API): scroll-triggered entrance animations — zero JS cost, `useEffect`-only, fires once then disconnects
- `useState` + Tailwind `transition-*` classes: all interactive state (sticky nav scroll, FeaturesBlock step-selector, demo calendar) — already the established codebase pattern
- `next/image` with `fill` + explicit `aspect-ratio` container: FeaturesBlock image swap without layout shift
- `{ passive: true }` scroll listener: sticky nav background transition without blocking the compositor thread

See `STACK.md` for full rationale and exact component code samples.

### Expected Features

The marketing page must do one thing for conversion: collapse the time-to-understanding. Competitive research (Calendly, Doodle, Cal.com) shows all successful scheduling tool pages converge on the same pattern — interactive product preview near the hero, outcome-focused headline, persistent CTA, and a two-perspective explainer (host and guest experience). This app's genuine differentiator is "players don't need an account" — this should appear near the hero CTA as friction-reduction copy.

**Must have (table stakes):**
- Sticky nav with logo, Beta badge, Sign Up / Log In — always visible, one click to convert
- Outcome-focused hero headline — "what does this do for me in 10 words or less"
- Primary CTA in hero — Sign up free, no competing CTAs at same scroll position
- Product visual at or near hero — static screenshot is minimum; interactive demo is better
- FeaturesBlock 4-step explainer — covers "how it works" (Create → Share → See who's free → Pick a day)
- "Easy for players" section — answers the DM's primary anxiety ("will players actually fill this in?")
- Final CTA repeat — captures visitors who scroll the full page without clicking the hero CTA
- Responsive layout — mobile single-column via Tailwind responsive utilities

**Should have (differentiators):**
- Interactive `AvailabilityDemoWidget` — player-view demo with pre-seeded mock data, no auth required
- FeaturesBlock step-selector interactivity — click a step, swap the image (Calendly's proven pattern)
- Scroll-triggered entrance animations — page feels polished; `FadeInSection`/`ScrollReveal` wrapper
- "No account needed for players" callout — single line near hero CTAs; genuine UX differentiator
- Two demo embed placements — FeaturesBlock area and "Easy for players" section
- `prefers-reduced-motion` support — `motion-reduce:transition-none` on all animated elements

**Defer to v2+:**
- Testimonials / social proof block — no real user base yet; fabricated quotes destroy trust
- Pricing section — beta; no plans exist
- Video explainer embed — interactive demo is more persuasive and cheaper to build
- Feature comparison table vs competitors — invites scrutiny of gaps; D&D framing does the differentiation
- Full footer with legal links — minimal copyright footer acceptable for v1.5

### Architecture Approach

The architecture follows a strict separation: `app/page.tsx` stays a Server Component and handles only auth-check-then-redirect. All marketing content lives in `src/components/landing/`, with a single `LandingPage` client root assembling the sections. Static sections (`HeroSection`, `EasyForPlayersSection`, `FinalCTASection`) are children of the client tree but have no own state. Interactive components (`StickyNav`, `FeaturesBlock`, `AvailabilityDemoWidget`, `ScrollReveal`) are explicitly `'use client'`. The demo bypasses `AvailabilityForm` entirely and reuses only the pure leaf components (`WeeklySchedule`, `AvailabilityCalendar`) with hardcoded mock data — no server actions, no Prisma, no routing.

**Major components:**
1. `app/page.tsx` (Server Component, unchanged role) — auth check + redirect; returns `<LandingPage />`
2. `LandingPage` (`'use client'`) — root marketing wrapper; assembles and sequences all sections
3. `StickyNav` (`'use client'`) — scroll event listener, `useState(false)` → dark background on scroll
4. `ScrollReveal` (`'use client'`) — `IntersectionObserver` wrapper; wraps each section for entrance animation
5. `FeaturesBlock` (`'use client'`) — `useState(activeStep)` step-selector; image swap per step
6. `AvailabilityDemoWidget` (`'use client'`) — self-contained mock; reuses `WeeklySchedule` + `AvailabilityCalendar` with hardcoded state; no server actions
7. `HeroSection`, `EasyForPlayersSection`, `FinalCTASection` — static JSX children of client tree

Build order: `ScrollReveal` first (needed by all sections), then `AvailabilityDemoWidget` (validates demo isolation early), then sections in dependency order, then `LandingPage`, then the one-line swap in `page.tsx` last.

### Critical Pitfalls

1. **Hydration mismatch from browser-only APIs (`window`, `IntersectionObserver`) accessed outside `useEffect`** — Always initialise animation and scroll state as `useState(false)`. All browser API access must be inside `useEffect`. Server always renders the "hidden" state; client reveals on mount. Pattern is identical to `CampaignTabs.tsx` keyboard listener setup.

2. **Demo component accidentally importing Prisma through `@/lib/` chain** — `AvailabilityDemoWidget` must import only `WeeklySchedule` and `AvailabilityCalendar`. Verify `@/lib/calendarUtils` has no server-only dependency chain before importing. All demo data is module-level constants — no `@/lib/` utility imports for data computation. Run `next build` to catch PrismaClient-in-browser errors early.

3. **`page.tsx` gaining `'use client'` and silently losing the auth redirect** — `page.tsx` must never have `'use client'`. The `getSessionDM()` + `redirect('/campaigns')` guard must remain the first lines of the default export. Document with a comment. This risk is present in every phase that touches `page.tsx`.

4. **FeaturesBlock image swap causing layout shift** — Fix the image container with `aspect-ratio` (e.g., `aspect-video`) and `overflow-hidden`. Use `next/image` with `fill` + `object-cover`. All step screenshots must share the same aspect ratio. Pre-load the first image with `priority`.

5. **`AvailabilityDemoWidget` using `new Date()` for planning window, causing SSR/client mismatch** — Use static hardcoded placeholder dates (e.g., `2026-04-01` to `2026-05-31`). The demo is illustrative, not real-time; fixed dates are more predictable and communicate "example" clearly.

See `PITFALLS.md` for the full set of 15 pitfalls including: `prefers-reduced-motion` support (Pitfall 9), `StickyNav` z-index collision with `HowItWorksModal` at `z-50` (Pitfall 2), `backdrop-blur` Safari artefacts with the fixed overlay image (Pitfall 12), and demo state resetting on animated wrapper re-renders (Pitfall 11).

---

## Implications for Roadmap

The FEATURES.md MVP recommendation provides a validated build order. Each phase is isolated by dependency, meaning each can be verified independently before the next is built. The full landing page can be delivered in 5 logical phases.

### Phase 1: Static Page Shell
**Rationale:** Validates layout, copy, and section structure before any complex component is added. All content visible immediately; no interactive pieces to debug. Establishes the `src/components/landing/` folder structure and the `page.tsx` one-line swap.
**Delivers:** Fully readable landing page — sticky nav (static, no scroll behaviour yet), hero with CTAs, FeaturesBlock as a static list, "Easy for players" card grid, final CTA section. Logged-in redirect confirmed working.
**Addresses:** All table-stakes features except interactivity.
**Avoids:** Pitfall 3 (auth redirect lost) — establishing `page.tsx` structure correctly from the start.

### Phase 2: Scroll-Triggered Entrance Animations
**Rationale:** Low complexity, high visual impact. Validates the `ScrollReveal`/`FadeInSection` pattern before wrapping more complex components. Easiest phase to verify — visual feedback is immediate.
**Delivers:** All sections animate in on scroll. `ScrollReveal` wrapper component. `prefers-reduced-motion` support baked in from day one.
**Addresses:** Scroll animation differentiator from FEATURES.md.
**Avoids:** Pitfall 1 (hydration mismatch), Pitfall 9 (`prefers-reduced-motion`), Pitfall 8 (multiple observer instances — observe section containers, not individual cards).

### Phase 3: FeaturesBlock Step-Selector
**Rationale:** Interactive but self-contained — depends only on local `useState` and screenshot assets. No server interaction. Can be built and verified in isolation.
**Delivers:** Clickable 4-step feature explainer with image swap. Step content: Create campaign → Share with players → See who's free → Pick the best day.
**Addresses:** FeaturesBlock differentiator from FEATURES.md.
**Avoids:** Pitfall 6 (image container layout shift — fix `aspect-ratio` from the start).
**Dependency:** Screenshot assets for all 4 steps must be captured from the live app before implementation begins. Flag as a prerequisite task.

### Phase 4: Interactive Demo Embed (AvailabilityDemoWidget)
**Rationale:** Most technically complex component. Built once, placed in two locations. Building after the simpler phases means any SSR/hydration patterns are already proven before the most sensitive component is added.
**Delivers:** Self-contained interactive player availability demo with pre-seeded mock data. Reuses `WeeklySchedule` + `AvailabilityCalendar` unchanged. Two placements (FeaturesBlock area and "Easy for players" section).
**Addresses:** Interactive demo differentiator — the single most persuasive element for DM conversion.
**Avoids:** Pitfall 4 (Prisma import chain), Pitfall 7 (dynamic `new Date()` SSR mismatch), Pitfall 11 (state reset on animated wrapper re-render — use class-switching not conditional render in `ScrollReveal`).

### Phase 5: Sticky Nav Scroll Behaviour
**Rationale:** Purely cosmetic refinement. Saved for last because it has the most cross-browser risk (`backdrop-blur` on Safari) and zero impact on functional correctness. All other phases work fine with the static nav from Phase 1.
**Delivers:** Nav background transitions from transparent to dark on scroll. `{ passive: true }` scroll listener. `onScroll()` called on mount to sync state immediately after hydration.
**Addresses:** Sticky nav scroll-opacity differentiator from FEATURES.md.
**Avoids:** Pitfall 2 (hydration mismatch from `scrollY` in initial render), Pitfall 2 (z-index at `z-40` below modals at `z-50`), Pitfall 12 (`backdrop-blur` artefacts — test early, prefer solid `bg-[var(--dnd-input-bg)]/90` if blur looks wrong on Safari).

### Phase Ordering Rationale

- **Shell first** because it establishes the component structure that all later phases populate. Any layout problems surface without the complexity of interactive components.
- **Animations second** because `ScrollReveal` is a dependency for all sections; building it early means wrapping each section is a one-line addition, not a retrofit.
- **FeaturesBlock third** because it depends on screenshot assets (an external dependency) — getting the component shape right early validates the image swap logic before assets exist, and assets can be added once captured.
- **Demo fourth** because it is the highest-risk component (Prisma chain risk, SSR mismatch risk, state reset risk). Building it after simpler components means all SSR patterns are already verified in the codebase.
- **Nav behaviour last** because it is cosmetic and has the most browser-specific risk. It can be added, adjusted, or simplified without touching any other phase's work.

### Research Flags

Phases with standard, well-documented patterns (skip `/gsd:research-phase`):
- **Phase 1 (Static shell):** HTML/JSX structure with Tailwind CSS — fully established
- **Phase 2 (Animations):** `IntersectionObserver` + Tailwind transitions — pattern is codebase-proven
- **Phase 3 (FeaturesBlock):** `useState` tab/step-selector pattern identical to `CampaignTabs.tsx`
- **Phase 4 (Demo):** Wrapping existing controlled components — no novel patterns
- **Phase 5 (Sticky nav):** `scroll` event + `useState` + Tailwind `transition-colors` — fully standard

No phase requires deeper external research. All implementation patterns are documented in the research files with exact code samples.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All decisions grounded in direct codebase inspection; zero new dependencies removes all version/compatibility unknowns |
| Features | HIGH | Table stakes from established SaaS landing page conventions; differentiators derived directly from codebase reading and project requirements |
| Architecture | HIGH | Component boundaries derived from direct inspection of `AvailabilityCalendar`, `WeeklySchedule`, `AvailabilityForm`, and `page.tsx`; patterns match existing codebase discipline |
| Pitfalls | HIGH (most) / MEDIUM (2) | Hydration, Prisma chain, auth redirect, image layout shift — all HIGH from direct codebase grounding. `backdrop-blur` Safari artefact and Framer Motion bundle sizes are MEDIUM (knowledge cutoff August 2025, not live-verified) |

**Overall confidence:** HIGH

### Gaps to Address

- **Screenshot assets for FeaturesBlock:** 4 step images do not exist yet. These must be captured from the running app before Phase 3 implementation begins. Flag as a prerequisite task in the roadmap.

- **`AvailabilityCalendar` planning window prop format:** ARCHITECTURE.md specifies `planningWindowStart` / `planningWindowEnd` as string props, and recommends hardcoded placeholder dates. Confirm the exact date string format expected (ISO `YYYY-MM-DD` assumed) against the component source before writing `AvailabilityDemoWidget`.

- **`backdrop-blur` on Safari with fixed overlay:** PITFALLS.md flags this as MEDIUM confidence (not verified against this specific background stack). Test the scroll nav background in Safari early in Phase 5; have the fallback (`bg-[var(--dnd-input-bg)]/90` solid) ready to drop in if the blur effect looks wrong.

- **Page meta description:** The current `layout.tsx` has generic metadata. A landing-page-specific `export const metadata` in `page.tsx` improves SEO and sharing previews. Low complexity; worth flagging for Phase 1 scope.

- **Demo reset behaviour:** FEATURES.md recommends a "Reset" / "Try it yourself" button in `AvailabilityDemoWidget`. Confirm whether the demo starts pre-seeded (populated, then resettable) or starts empty (visitor fills in from scratch). Pre-seeded is more persuasive — it shows what a filled calendar looks like before the visitor does anything.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/app/page.tsx`, `src/components/AvailabilityCalendar.tsx`, `src/components/WeeklySchedule.tsx`, `src/components/AvailabilityForm.tsx`, `src/components/CampaignTabs.tsx`, `src/components/Toast.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `package.json`, `.planning/PROJECT.md`
- `IntersectionObserver` Web API — Living Standard, universal browser support 2026
- React 19 `useState` / `useEffect` SSR contract — stable core behaviour
- Next.js App Router `redirect()` + `cookies()` server-only constraint — stable, knowledge cutoff August 2025
- Tailwind CSS 4 `motion-reduce:` variant, `transition-*`, `backdrop-blur-sm` — confirmed by codebase usage

### Secondary (MEDIUM confidence)
- Calendly, Doodle, Cal.com, Linear marketing page patterns — training data through late 2024/early 2025; stable conventions unlikely to have reversed
- Framer Motion bundle sizes (~30–60 KB gzipped for `motion` package) — training data; bundlephobia.com is live verification source if Framer Motion is reconsidered
- `backdrop-filter: blur()` Safari compositing with fixed-position overlays — known browser behaviour, not verified against this specific background stack

---
*Research completed: 2026-03-13*
*Ready for roadmap: yes*
