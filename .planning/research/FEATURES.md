# Feature Landscape

**Domain:** SaaS/tool marketing landing page — scheduling tool for tabletop RPG groups (v1.5)
**Researched:** 2026-03-13
**Overall confidence:** HIGH for established marketing page patterns; HIGH for implementation context (direct codebase reading); MEDIUM for conversion-specific claims (based on well-documented industry patterns, not A/B test data for this app specifically)

---

## Context

This milestone replaces the current minimal logged-out home page (icon + heading + two buttons) with a full marketing landing page. The page is public-facing and must:

1. Explain the value proposition to a stranger who has never heard of the app
2. Show — not just describe — what the app does via interactive demo embeds
3. Convert visitors into sign-ups via primary CTAs repeated at strategic scroll positions

The target audience is a D&D DM who is frustrated by session scheduling chaos. The app already exists and works well; this page's job is to make that obvious before the visitor even creates an account.

The existing app already has these reusable interactive components that can power the demo:
- `AvailabilityCalendar` — player-side calendar with `weeklySelection` and `overrides` props
- `WeeklySchedule` — day-of-week toggle buttons

The v1.5 requirements from PROJECT.md define seven specific sections:
1. Sticky nav with scroll-triggered dark background
2. Hero section with heading, subtitle, primary CTAs
3. Interactive FeaturesBlock (4 selectable steps with images)
4. "Easy for players" card grid + second demo embed
5. Final CTA section
6. Section entrance animations on scroll
7. Logged-in home page unaffected

---

## Research: Core Questions

### Q1 — What makes a scheduling tool landing page convert visitors?

Scheduling tools (Calendly, Doodle, When2meet, Cal.com) converge on the same pattern because the product category has one core problem: the visitor doesn't understand what the tool actually does until they try it. The conversion challenge is collapsing the time-to-understanding.

**The four things that convert on scheduling tool pages:**

1. **A concrete outcome in the hero headline, not a feature description.** "Find the best day for your next D&D session" converts better than "Group availability coordination tool." The visitor must immediately see their problem solved, not a product description.

2. **A visual or interactive product preview above the fold (or close to it).** Calendly shows a booking page preview in the hero. Doodle shows a filled poll grid. When2meet shows its green-heatmap grid. The visitor recognises "that is what I'll get" before they click anything. Tools that rely on abstract descriptions of what they do consistently underperform.

3. **Friction-free CTAs with no-risk framing.** "Free", "No account needed for players", "Takes 2 minutes" — these remove the mental cost of signing up. For this app specifically, "No account needed for players" is a genuine differentiator: DMs sign up, players don't. This should appear near the hero CTA.

4. **Social proof or context.** Calendly uses customer logos and testimonials. Doodle uses user counts. For a beta app with no user base yet, the equivalent is specificity ("built for groups of 5–8") — this filters in the right audience and implies the tool is designed for their use case rather than generic.

**What does not convert:**

- Long feature lists without visual evidence
- Marketing copy that emphasises the app's cleverness rather than the visitor's outcome
- Multiple competing primary CTAs at the same scroll position (sign up vs learn more vs watch demo — pick one primary)

**Confidence:** HIGH — these patterns are consistent across Calendly, Doodle, Cal.com, Notion, Linear, and Basecamp marketing pages as of 2025. The specific conversion science claims (e.g. exact CTR deltas) are industry knowledge, not data from this app.

---

### Q2 — What is table stakes for a marketing landing page of this type?

These features are expected by visitors who land on any modern SaaS tool page. Their absence creates doubt ("is this app real?") or friction ("I can't find what I need").

See Table Stakes section below.

---

### Q3 — What is the right interactive demo for this app?

The demo is the most technically complex part of this milestone. The goal: show visitors the player availability experience without requiring them to sign up, log in, or navigate to a real campaign.

**What to show:**
- The player-side view: weekly schedule toggles and a calendar with dates marked available/busy
- Pre-seeded with mock data that makes it visually interesting (a few days pre-selected, some overrides)
- The calendar should respond to user interaction (clicking a day changes its state) to make it feel real

**What NOT to show:**
- The DM dashboard (complex; requires mock campaign data, player data, aggregation — high implementation cost)
- The full campaign creation form (gives the wrong impression of the first action)
- The join/name-entry step (too trivial to demo)

**Why the player view:**
The DM is the visitor who needs to sign up. Showing them what their players will experience is more persuasive than showing them their own dashboard, because the DM's anxiety is "will my players actually fill this in?" — not "will I be able to see the data?" The demo answers "yes, it's this easy for players."

**How to implement it:**
`AvailabilityCalendar` and `WeeklySchedule` are already standalone React components that accept all their data as props and manage no server state. A demo embed is:
- A `'use client'` wrapper component with `useState` for `weeklySelection` and `overrides`
- Pre-seeded state (e.g. `weeklySelection = new Set(['6'])` for Saturday pre-selected; a couple of overrides)
- Planning window hard-coded to cover the next 4–6 weeks from current date
- A reset button ("Try it yourself") that clears overrides back to the seeded state
- No server calls, no auth, no navigation

Implementation complexity: **Low-Medium.** The underlying components already exist. The wrapper is 60–80 lines of client state management.

**Demo embed placement (two instances in the spec):**
1. In the main Features section, alongside the interactive step-selector — this demo should show the player calendar in its most populated state (Saturday highlighted, a busy override on one date)
2. In the "Easy for players" section — same component, possibly with a slightly different seed to show a different state, or the same component reused

**Confidence:** HIGH — derived directly from reading `AvailabilityCalendar.tsx` and `WeeklySchedule.tsx`. Both components accept data as props with zero server dependency.

---

### Q4 — What patterns do Calendly, Doodle, and When2meet use on their landing pages?

**Calendly:**
- Sticky nav with logo, product links, Log In, and a primary "Sign up free" button (always visible)
- Hero: short outcome-focused headline ("Easy scheduling ahead"), subtitle, CTA button, product preview screenshot/mockup
- "How it works" in 3 steps with icons — host creates link, shares, invitees pick times
- Social proof block (customer logos, testimonial quotes)
- Feature highlights with screenshots or animated GIFs
- Pricing section (not relevant here — beta)
- Final CTA section

**Doodle:**
- Hero immediately shows a poll creation interface in-page (not a screenshot — an interactive mockup)
- Step-by-step explainer for how to create and share a poll
- Player/invitee perspective shown separately ("Easy for your participants")
- Multiple CTA placements (hero, after features, final section)

**When2meet:**
- Minimal — no real marketing page, just the tool itself
- Not a model to follow for conversion

**Cal.com:**
- Open-source positioning prominently featured
- Interactive feature demo in the hero (actual product preview)
- Step-by-step onboarding flow shown on page

**Patterns common across all three relevant tools (Calendly, Doodle, Cal.com):**

1. Sticky nav with persistent CTA button — always one click to sign up
2. Outcome headline + social proof or specificity in hero
3. Product preview at or near hero (visual evidence)
4. Two-perspective explainer (host/DM vs guest/player) — always both roles shown
5. Repeated CTA at the bottom (for visitors who scroll the whole page)
6. Footer with legal links (privacy, terms) — expected even for beta

**What this app does that the big tools do not:**
- D&D-specific framing — the fantasy theme and Cinzel font already differentiate it visually. This should be leaned into, not hidden. "Your next session" not "your next meeting."
- Player-friendly model — "players don't need an account" is a genuine UX differentiator vs Calendly (all users need accounts) and Doodle (poll participants don't create accounts but polls are ephemeral). Worth calling out explicitly.

**Confidence:** MEDIUM — based on direct familiarity with these tools' marketing pages as of late 2024/early 2025. Specific page structures may have changed; the patterns described are stable conventions not likely to have reversed.

---

### Q5 — What is the right content for the FeaturesBlock step-selector?

The spec calls for "4 selectable steps" with a highlight/expand interaction and accompanying image swap. This is Calendly's feature carousel pattern.

**Recommended step content:**

| Step | Heading | Description | Image/visual |
|------|---------|-------------|--------------|
| 1 | Create your campaign | Set a planning window and copy your join link in seconds | Campaign creation form screenshot or mockup |
| 2 | Share with players | Players open the link, enter their name, and set their availability — no account required | Join page or availability page screenshot |
| 3 | See who's free | A live calendar shows each player's availability as they respond | Dashboard calendar screenshot with 3–4 players filled in |
| 4 | Pick the best day | A ranked list surfaces the top dates for everyone — copy it to your group chat | BestDaysList screenshot with "Copy to chat" button |

This four-step sequence matches the actual DM workflow and gives the step-selector concrete content to show. Images can be static screenshots of the actual app UI (not custom illustrations) — this is both faster to build and more persuasive (visitors see the real product).

**Confidence:** HIGH — derived from reading PROJECT.md's feature description and mapping the actual DM user journey in the codebase.

---

### Q6 — What should the scroll animation system look like?

The spec calls for sections to "animate in smoothly as they enter the viewport on scroll."

**The established pattern is intersection-observer-based fade/slide-in:**
- Each section starts at `opacity: 0` and either `translateY: 20px` or `translateY: 0`
- On intersection (threshold ~10% of the element visible), a CSS class is toggled that transitions to `opacity: 1` and `translateY: 0`
- Duration: 400–600ms ease-out
- No stagger within sections required unless cards in a grid need to animate sequentially

**Implementation options in Next.js + Tailwind CSS 4:**

Option A: Custom `useIntersectionObserver` hook + Tailwind transition classes — no new dependencies. The hook adds/removes a CSS class; Tailwind handles the transition. This is the correct choice for this project.

Option B: Framer Motion — `framer-motion` adds ~30kB gzipped, which is justified for complex sequences (e.g. staggered card entrances) but overkill for simple section fade-ins. Adds a dependency with potential SSR complications in Next.js App Router (requires `'use client'` on every animated component).

Option C: CSS `@keyframes` with `animation-play-state` toggle — same effect as option A but less composable.

**Recommendation:** Option A. A reusable `useFadeInOnScroll` hook (20 lines) + a `FadeInSection` wrapper component covers all seven sections cleanly with zero new dependencies. This is the pattern used by many Next.js + Tailwind sites without any animation library.

**Confidence:** HIGH — intersection observer is a baseline browser API with near-universal support. The Tailwind approach is the natural fit given the project's existing CSS setup.

---

## Table Stakes

Features visitors (prospective DMs) expect on any modern scheduling tool marketing page. Missing = page feels incomplete, amateur, or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Sticky nav with logo + Sign Up / Log In buttons | Users expect to be able to sign up from any scroll position; a nav that disappears on scroll is a modern baseline | Low | Nav background must change on scroll (transparent to dark) — scroll event listener or `IntersectionObserver` on a sentinel element |
| Outcome-focused hero headline | Visitors won't read further without understanding "what does this do for me?" in 10 words or less | Low | Copy decision — "Find the best session date, without the back-and-forth" is one option; "Never chase your players for session dates again" is more direct |
| Primary CTA button in hero | The conversion action must be available at zero scroll | Low | "Sign up free" with secondary "Log in" — matches existing auth pages |
| Product visual in or near hero | Visitors need visual evidence the product exists and works | Medium | A static screenshot of the dashboard calendar with players filled in works; the demo embed is richer but adds complexity — static screenshot is table stakes, interactive demo is a differentiator |
| Section explaining how it works | Visitors won't sign up for a tool they don't understand | Medium | The FeaturesBlock (4 steps) covers this — but step content and images must actually explain the workflow, not just list features |
| Player-side explainer | DMs need to understand what their players will experience (their primary anxiety) | Medium | The "Easy for players" section in the spec covers this |
| Final CTA repeat | Visitors who scroll the whole page without clicking the hero CTA get one more chance to convert | Low | "Ready to plan your next adventure?" with Sign Up / Log In buttons |
| "Beta" badge or honesty signal | Without it, visitors may wonder why they haven't heard of this app; a Beta badge sets expectations correctly and is already present in the current design | Low | Already exists in current `page.tsx`; must be preserved in nav |
| Responsive layout | Mobile visitors exist; a broken mobile layout destroys trust | Medium | Tailwind's responsive utilities handle this; sticky nav collapses gracefully; hero goes single-column; FeaturesBlock goes vertical; card grid becomes single-column |

---

## Differentiators

Features beyond table stakes that increase conversion or delight the target audience.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Interactive demo embed (player view) | Visitors experience the player side of the app before signing up — eliminates "will my players figure this out?" anxiety | Medium | `AvailabilityCalendar` and `WeeklySchedule` already exist; wrapper client component with pre-seeded state; no server calls |
| Interactive FeaturesBlock step-selector | Clicking a step highlights it, expands description, and swaps the image — more engaging than static screenshots; matches Calendly's proven pattern | Medium | Client component with `useState(activeStep)`, step data array, conditional image render; no dependency on app data |
| Scroll-triggered entrance animations | Sections fade+slide in as they enter the viewport — page feels polished and intentional | Low-Medium | Reusable `FadeInSection` wrapper; no animation library required |
| D&D-specific copy and framing | "Quest for the perfect session date" tone — differentiates from generic scheduling tools immediately; appeals directly to the DM's identity as a Game Master | Low | Copy decision only; no implementation complexity |
| "No account needed for players" callout near hero | This is a genuine friction-reducer — players don't sign up, they just click a link. Many tools don't do this. Calling it out near the CTA reduces the DM's anxiety about player adoption | Low | A single line of copy near or below the hero CTA buttons |
| Two demo embeds (different scroll positions) | The spec calls for two instances — one in the FeaturesBlock and one in "Easy for players." Two exposures to the interactive player UI reinforces the simplicity message | Low (second embed is same component, different seed) | First demo satisfies the complexity cost; second is free |
| Scroll-triggered nav background opacity | Nav goes from transparent to dark on scroll — prevents hero text from being obscured while giving the nav a presence once the user scrolls | Low | `IntersectionObserver` on a sentinel `<div>` at the bottom of the hero, or `scroll` event listener with a threshold |

---

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Pricing/plan section | No plans exist; this is beta; pricing creates expectation that must be managed | Omit entirely; the Beta badge handles this implicitly |
| Testimonials or social proof block | No real users yet; fabricated or placeholder testimonials destroy trust if noticed | If needed later, add after launch with real DM quotes; for now, specificity ("built for groups of 5–8") is the honesty alternative |
| Video explainer embed | High production cost; adds a third-party embed (YouTube/Vimeo) with privacy implications; the interactive demo is better for this product | Use the interactive demo instead |
| Feature comparison table vs competitors | Doodle/Calendly comparisons invite scrutiny of gaps; this is a niche tool, not a Calendly replacement | Let D&D-specific framing do the differentiation |
| Newsletter signup or email capture below the CTA | Friction before the primary conversion action; adds an email form the visitor hasn't asked for | Use Sign Up / Log In as the only capture mechanism |
| Animated illustrations or Lottie animations | High production cost; requires design assets not in the project | Static screenshots of actual app UI are more persuasive anyway |
| Cookie banner / consent popup | No analytics, no third-party tracking; no legal obligation for a beta with no advertising | Add only if analytics are ever added |
| Mobile hamburger menu with drawer | Adds JS complexity for a nav with only two buttons; on mobile, the two CTA buttons can reflow as a stacked row | Responsive Tailwind classes handle the nav at mobile breakpoints |
| Parallax scrolling effects | Jarring on mobile; accessibility issues for vestibular disorders; adds complexity with zero conversion benefit for this product type | Simple fade-in animations are sufficient |
| Full onboarding tour on the landing page (product tour) | The interactive demo is already the onboarding; a separate tour overlay on top of a marketing page is conceptually confusing | The demo embed is the tour |

---

## Feature Dependencies

```
Sticky nav
  → New component: LandingNav.tsx (client component — needs scroll state for bg transition)
  → Logo: existing /dnd-icon.png
  → Beta badge: copy from current page.tsx
  → Auth links: href="/auth/signup" and href="/auth/login" (no change to auth pages)
  → No data dependencies

Hero section
  → Static content only (headline, subtitle, CTAs)
  → CTA buttons: same Link components as current page.tsx
  → "No account needed for players" callout: single line of text
  → No data dependencies

FeaturesBlock (interactive step-selector)
  → New client component: FeaturesBlock.tsx
  → useState for activeStep (0–3)
  → Step data: hardcoded array (heading, description, imageSrc)
  → Images: static screenshots of the actual app, stored in /public
  → Image swap: conditional Next.js <Image> or array index into step data
  → No demo embed in FeaturesBlock itself — spec says "accompanying image" per step, not a live demo
  → Dependency: screenshots must be captured and added to /public before implementation

Interactive demo embed (DemoEmbed)
  → New client component: DemoEmbed.tsx
  → useState for weeklySelection (Set<string>) and overrides (Map<string, 'free' | 'busy'>)
  → Pre-seeded state: e.g. weeklySelection = new Set(['6']) + one or two overrides
  → Planning window: hard-coded date range (next 4–5 weeks from render time)
  → Imports: AvailabilityCalendar and WeeklySchedule (existing components)
  → No server calls, no auth, no navigation
  → Reset button: clears overrides back to seed state
  → Two instances of DemoEmbed on page (FeaturesBlock area and "Easy for players" section)
    - Either same component with different seeds, or same component with different framing text
  → Complexity: LOW-MEDIUM — all underlying logic exists; wrapper is ~60–80 lines

"Easy for players" section
  → Static card grid (3 cards: open link → enter name → mark availability)
  → Card content: heading + 1-line description + optional icon
  → Second DemoEmbed instance below the cards
  → No data dependencies

Scroll animations
  → New utility/component: FadeInSection.tsx (client component wrapping IntersectionObserver)
  → Wraps each page section; adds/removes a CSS class on intersection
  → All page sections use FadeInSection as a wrapper
  → No new npm dependencies

Final CTA section
  → Static content (heading + two CTA buttons)
  → Reuses same button styles as hero

Footer
  → Not specified in v1.5 requirements — minimal footer (copyright) acceptable
  → No new dependencies

Logged-in redirect (unchanged)
  → Current page.tsx: if (dm) redirect('/campaigns') — this line must be preserved
  → All landing page content is conditional on the user NOT being logged in
  → Simplest approach: the redirect at the top of page.tsx stays; logged-out content is the rest of the file
```

---

## MVP Recommendation for v1.5

Build in this order to minimise risk and deliver value incrementally:

1. **Static page shell** — All sections present with real copy but no interactivity. Sticky nav, hero, placeholder for FeaturesBlock (static list), "Easy for players" card grid, final CTA. This is the baseline: all content visible, no complex components. Validates the layout before the interactive pieces are added.

2. **Scroll animations** — Add FadeInSection wrapper to all sections. Low complexity, high visual impact, validates the animation approach before building demo components.

3. **FeaturesBlock** — Add step-selector interactivity (activeStep state + image swap). Requires screenshots in /public. Complexity is isolated to one component.

4. **DemoEmbed** — The most complex piece. Build once, place in both locations. Validate that AvailabilityCalendar and WeeklySchedule work correctly with synthetic props and no server data.

5. **Nav scroll behaviour** — Scroll-triggered background opacity. Low complexity; save for last since it's purely cosmetic.

**Defer:** Footer with full legal links — acceptable to ship a minimal one-line copyright footer; full legal pages are out of scope for v1.5.

---

## Complexity Notes for Planning

| Component | Complexity | Why | Risk |
|-----------|------------|-----|------|
| LandingNav | Low | Scroll event or IntersectionObserver + 2 Link buttons; Tailwind transitions | None — isolated client component |
| Hero section | Low | Static content; no interactivity | None |
| FeaturesBlock | Medium | Client state (activeStep), image swap, step data array; images must exist in /public | Image sourcing — screenshots must be taken before implementation |
| DemoEmbed | Medium | Client state for weeklySelection + overrides; AvailabilityCalendar expects planning window strings (must compute real dates from `new Date()`) | Date computation: planning window must be future dates; hard-coded past dates will render empty calendars |
| FadeInSection | Low | ~20 lines; IntersectionObserver is baseline browser API | SSR: IntersectionObserver does not exist in Node.js — must guard with `typeof window !== 'undefined'` or use `useEffect` for setup |
| "Easy for players" cards | Low | Static content; CSS grid | None |
| Final CTA + Footer | Low | Static content | None |

---

## Dependency on Existing Features

| Landing page element | Depends on existing feature | Notes |
|----------------------|-----------------------------|-------|
| DemoEmbed | `AvailabilityCalendar` component | Must import directly; no prop API changes needed |
| DemoEmbed | `WeeklySchedule` component | Same — accepts `selection: Set<string>` and `onChange` callback |
| Auth CTAs | `/auth/signup` and `/auth/login` routes | Already exist; no changes |
| Beta badge | Existing badge style in `page.tsx` | Copy the existing `<span>` markup |
| Background texture | `bg-swirl.png` in `/public` + layout.tsx fixed background | Persists across all pages including landing; no change needed |
| Cinzel font | Already loaded in `layout.tsx` via `next/font/google` | `font-fantasy` class available globally |
| Design tokens | CSS custom properties (`--dnd-accent`, `--dnd-text-muted`, etc.) in `globals.css` | Available to all components |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table stakes features | HIGH | Stable conventions across all major scheduling tool pages |
| Differentiators | HIGH | Direct recommendations from project requirements + competitive analysis |
| Anti-features | HIGH | Clear rationale in each case; no speculation |
| Demo embed design | HIGH | Derived from direct reading of AvailabilityCalendar and WeeklySchedule source |
| FeaturesBlock step content | HIGH | Derived from actual DM user journey in the codebase |
| Conversion patterns | MEDIUM | Well-documented industry patterns; no A/B data for this specific app |
| Scroll animation approach | HIGH | IntersectionObserver is baseline browser API; Tailwind transition approach is standard |

---

## Gaps to Address

- **Screenshot assets for FeaturesBlock:** The step-selector requires 4 images (one per step). These do not exist yet — they must be captured from the live app or from a locally running dev build. This is a build dependency for FeaturesBlock implementation. The planner should flag this as a prerequisite task.

- **Planning window for DemoEmbed:** The demo needs a planning window (start + end date) that covers several future weeks. The simplest approach is to compute it at render time from `new Date()` — e.g. `start = today, end = today + 35 days`. This keeps the demo always showing a relevant date range. Confirm this approach before building.

- **"Try it yourself" UX in the demo:** The spec does not detail reset behaviour. The FEATURES.md recommendation is a "Reset" or "Try it yourself" button. If reset is not desired, the demo can simply start in an empty state and let visitors fill it in freely. The seeded-then-resettable approach is more persuasive because it shows what a filled calendar looks like before the visitor has done anything.

- **LandingNav behaviour when DM is logged in:** The current `page.tsx` redirects logged-in DMs to `/campaigns` before rendering. The landing page and its LandingNav are therefore only ever seen by logged-out visitors. No special "if logged in" logic is needed in the nav.

- **Page title and meta description:** The current `metadata` in `layout.tsx` is generic ("D&D Session Planner"). For a marketing page, a more specific meta description improves SEO and sharing previews. This can be added as `export const metadata` in `page.tsx` — low complexity but worth flagging.

---

## Sources

- Project codebase: direct reading of `src/app/page.tsx`, `src/components/AvailabilityCalendar.tsx`, `src/components/WeeklySchedule.tsx`, `src/app/layout.tsx`, `src/app/campaigns/page.tsx` — HIGH confidence (authoritative)
- PROJECT.md v1.5 active requirements — HIGH confidence (authoritative)
- Domain knowledge: Calendly, Doodle, Cal.com, When2meet, Notion, Linear marketing page patterns — training data, confidence MEDIUM-HIGH (patterns observed across multiple products; stable conventions, not A/B-test specific)
- UX conversion science for SaaS landing pages — training data, confidence MEDIUM (established patterns; specific metrics are illustrative not authoritative)
- Note: Web search was unavailable in this research session. All UX and conversion pattern claims are based on established conventions consistent across multiple major products over several years.
