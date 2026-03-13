# Technology Stack — v1.5 Additions

**Project:** Where's the Cleric — D&D Session Planner
**Milestone:** v1.5 Marketing Home Page
**Researched:** 2026-03-13
**Scope:** NEW capabilities only — scroll-triggered entrance animations, sticky nav with scroll-opacity transition, and interactive client components (feature step-selector, availability demo embed). Existing stack is validated and not re-researched.

---

## Verdict Up Front

**One optional dependency, all other capabilities are zero-cost using what already exists.**

The existing stack — Next.js 16 App Router, React 19, Tailwind CSS 4, and the CSS `transition` pattern already proven in `Toast.tsx` and `CampaignTabs.tsx` — is sufficient for every v1.5 animation requirement without adding any library.

The one decision worth making explicitly: **do NOT add Framer Motion** for this landing page. The rationale is below. Vanilla `IntersectionObserver` with CSS transitions and `useEffect`/`useState` is the correct, proportionate choice.

---

## The Core Decision: Framer Motion vs Vanilla IntersectionObserver

### What v1.5 Actually Needs

| Requirement | Animation complexity |
|-------------|---------------------|
| Section entrance on scroll (fade up) | One-shot trigger: invisible → visible |
| Sticky nav background on scroll | `scrollY > threshold` → class toggle |
| Interactive step-selector (FeaturesBlock) | `useState` active index, CSS class swap |
| Availability demo embed | Client component with placeholder state, no animation |

All four are discrete, one-directional state changes — not spring physics, not drag, not layout animations, not shared element transitions. This is the exact profile where Framer Motion's overhead is unjustified.

### Why Not Framer Motion

**Bundle cost is real.** Framer Motion (the `framer-motion` package) is approximately 50–60 KB gzipped. The `motion` package (the newer standalone version) is ~30 KB gzipped. For a marketing page where LCP matters, adding 30–60 KB of JS for fade-in effects is a measurable regression.

**`use client` surface area.** In Next.js App Router, any component using Framer Motion must be a Client Component. The landing page sections (`HeroSection`, `FeaturesBlock`, `EasyForPlayersSection`, `CTASection`) are currently good candidates to be Server Components — they render static markup. Adding Framer Motion forces all of them to `'use client'`, which disables React Server Component streaming for that subtree and increases client JS hydration cost.

**Maintenance tax.** Framer Motion's API surface is large and changes between major versions (v10 → v11 → v12 renamed the package). For simple entrance animations that will not change after shipping, a third-party animation library is ongoing dependency maintenance for zero ongoing benefit.

**The codebase already has the right pattern.** `Toast.tsx` demonstrates exactly the pattern needed for scroll entrance animations: a conditional CSS class toggles `opacity-0 translate-y-2` → `opacity-100 translate-y-0` with `transition-all duration-300`. The only thing scroll entrance animations add is an `IntersectionObserver` to fire the trigger when the element enters the viewport instead of when a state boolean changes.

### When Framer Motion Would Be Justified

Framer Motion is the right choice when you need: spring-physics animations, drag interactions, layout animations (animating between DOM positions), shared element transitions, or complex choreographed sequences. None of these are in v1.5.

### Verdict

**Use vanilla IntersectionObserver + CSS transitions. Zero new dependencies.**

---

## Recommended Stack for v1.5

### Scroll Entrance Animations

**Approach:** A single reusable `FadeInSection` client component wraps each landing page section. It uses `useRef` + `useEffect` to attach an `IntersectionObserver` and toggles a `data-visible` attribute (or a `useState` boolean) that activates a Tailwind transition.

**Why this works:**
- `IntersectionObserver` is a native browser API — zero JS bundle cost
- The CSS transition pattern (`opacity-0 translate-y-4 → opacity-100 translate-y-0 transition-all duration-500`) is already proven in `Toast.tsx` and `CampaignTabs.tsx` side panel
- The `FadeInSection` component is small (< 20 lines), completely self-contained, and easy to delete if requirements change
- `{ once: true }` on the observer means it fires once and disconnects — no ongoing observer overhead

**No library needed.**

### Sticky Nav Scroll Detection

**Approach:** The nav component is a `'use client'` component. `useEffect` attaches a `scroll` event listener on `window`. When `window.scrollY > 20` (threshold), a boolean state flips. The nav's `className` conditionally applies `bg-[var(--dnd-input-bg)]/90 backdrop-blur-sm` vs `bg-transparent`.

**Why this works:**
- This is exactly the sticky nav pattern used across the Next.js ecosystem without any library
- `window.scrollY` is synchronous and cheap to read on the scroll event
- The Tailwind transition on the nav background (`transition-colors duration-200`) is already the pattern in this codebase
- The existing `globals.css` design tokens (`--dnd-input-bg`, `--dnd-card-bg`) provide the right dark background colours

**Debouncing note:** The scroll listener does NOT need `use-debounce` (already in `package.json` for form inputs). Nav background transition is a direct visual response to scroll position and must not be debounced — debouncing creates a visible lag. A simple `useState` boolean flip on the scroll handler is correct.

**No library needed.**

### Interactive Feature Step-Selector (FeaturesBlock)

**Approach:** A `'use client'` component with `useState<number>(0)` tracking the active step index. Clicking a step calls `setActiveStep(i)`. The active step gets a distinct visual state via a conditional Tailwind class. The image area renders `activeStep`-dependent content.

**Why this works:**
- This is pure React state management — the same pattern as `CampaignTabs.tsx` tab selection (`activeTab` state)
- No animation library needed; CSS transitions on the image (`opacity`, `transition-opacity`) handle the swap visual
- The FeaturesBlock is already planned as a `'use client'` component (it needs interactivity), so there is no `use client` promotion cost

**No library needed.**

### Interactive Availability Demo Embed

**Approach:** A `'use client'` component that renders a read-only, non-navigating version of the player availability UI with hardcoded placeholder data. No auth, no server actions, no real routing. The component owns its own state for which day is "selected" in the demo.

**Reuse opportunity:** `AvailabilityCalendar.tsx` and `WeeklySchedule.tsx` are existing Client Components. They may be directly reusable with placeholder props passed as data rather than fetched from the DB — this depends on whether they accept props or fetch internally. This is an implementation-phase question, not a stack question.

**No library needed.**

---

## Full Stack Delta: v1.5 Adds Nothing to `package.json`

| Package | Action | Rationale |
|---------|--------|-----------|
| `framer-motion` / `motion` | Do NOT add | 30–60 KB gzipped for effects achievable with CSS transitions; forces unnecessary `'use client'` on section components |
| `@react-spring/web` | Do NOT add | Same objection as Framer Motion — spring physics not needed for fade-in |
| `react-intersection-observer` | Do NOT add | Thin wrapper around native `IntersectionObserver`; the wrapper's only benefit is hook-based API, which a 10-line custom hook replicates without the dependency |
| `react-scroll` | Do NOT add | Anchor-based smooth scroll — not needed; CSS `scroll-behavior: smooth` or `scrollIntoView` is sufficient if needed |
| `lenis` / smooth-scroll | Do NOT add | Smooth scroll hijacking; adds complexity, can impair accessibility, and is out-of-character for this app's lightweight approach |
| `@headlessui/react` | Do NOT add | No new modal or popover patterns in v1.5; existing patterns are sufficient |
| Any animation library | Do NOT add | CSS transitions are the right tool for all v1.5 animation requirements |

---

## New Components to Create (Not New Dependencies)

| Component | Type | Purpose |
|-----------|------|---------|
| `StickyNav` | `'use client'` | Scroll-aware sticky nav; owns `useEffect` scroll listener and `useState(scrolled)` |
| `FadeInSection` | `'use client'` | Wraps any section; uses `IntersectionObserver` to trigger entrance animation |
| `FeaturesBlock` | `'use client'` | Interactive step-selector for the Features section; owns `useState(activeStep)` |
| `AvailabilityDemo` | `'use client'` | Read-only demo embed with placeholder data; no auth or navigation |
| `HeroSection` | Server Component | Static hero markup; no interactivity, no animation (or wraps self in `FadeInSection`) |
| `EasyForPlayersSection` | Server Component | Static card grid; wrapped in `FadeInSection` |
| `CTASection` | Server Component | Static final CTA; wrapped in `FadeInSection` |

**Pattern:** Static sections are Server Components. They are wrapped by `FadeInSection` (a Client Component), which adds the scroll trigger. The static section content itself does not need to be a Client Component — the wrapper handles the animation boundary.

This preserves the narrow `'use client'` island discipline already established in this codebase.

---

## Integration With Next.js App Router

### `'use client'` Boundary Rules (No Changes to Existing Pattern)

The existing pattern — narrow client islands, Server Component pages — must be maintained for the landing page.

| Component | Boundary | Why |
|-----------|----------|-----|
| `page.tsx` (home) | Server Component | Reads session, redirects logged-in DMs, renders layout |
| `StickyNav` | `'use client'` | Needs `useEffect` scroll listener |
| `FadeInSection` | `'use client'` | Needs `useEffect` + `useRef` for `IntersectionObserver` |
| `FeaturesBlock` | `'use client'` | Needs `useState` for active step |
| `AvailabilityDemo` | `'use client'` | Needs `useState` for demo interaction |
| `HeroSection`, `EasyForPlayersSection`, `CTASection` | Server Components | Static markup; no client state needed |

**Key rule:** `FadeInSection` is a Client Component that accepts `children`. Its `children` can still be Server Component output — React allows Server Component trees to be passed as children to Client Components. This means wrapping a static section in `<FadeInSection>` does NOT force the static section's markup to become a Client Component.

### `useEffect` and SSR Safety

`IntersectionObserver` and `window.scrollY` are browser-only APIs. Both must be accessed inside `useEffect` (not at module top level or in render). This is the existing pattern in `CampaignTabs.tsx` (lines 73–79 use `useEffect` for keyboard listeners). No special handling needed.

### Tailwind CSS 4 Compatibility

All new CSS patterns (scroll-triggered opacity, backdrop-blur for nav background) use standard Tailwind utility classes. No new configuration in `tailwind.config.ts` or `globals.css` is required beyond what is already there.

The existing `bg-[var(--dnd-input-bg)]` token pattern works for the sticky nav background. The nav background transition at scroll threshold is `bg-transparent` → `bg-[#1e0439]/90 backdrop-blur-sm` with `transition-colors duration-200` — all existing utilities.

---

## Implementation Patterns

### FadeInSection Component (10–15 lines)

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'

export function FadeInSection({ children, className = '' }: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  )
}
```

This is the exact pattern. The `once: true` equivalent is achieved by calling `obs.disconnect()` after the first intersection.

### StickyNav Scroll Detection (core logic)

```tsx
'use client'
import { useEffect, useState } from 'react'

export function StickyNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-40 transition-colors duration-200 ${
      scrolled ? 'bg-[#1e0439]/90 backdrop-blur-sm' : 'bg-transparent'
    }`}>
      {/* logo, badge, CTAs */}
    </nav>
  )
}
```

`{ passive: true }` on the scroll listener is important — it signals to the browser the handler will not call `preventDefault()`, enabling scroll performance optimisation.

---

## Confidence Assessment

| Area | Level | Basis |
|------|-------|-------|
| Framer Motion bundle cost | MEDIUM | Training data (August 2025 cutoff); npm registry was inaccessible for live version check. Bundle sizes are documented at bundlephobia.com; the ~30-60 KB range is consistent across multiple sources in training data. Exact current size should be verified if Framer Motion is reconsidered. |
| IntersectionObserver browser support | HIGH | Universal support in all modern browsers; part of the Living Standard; no polyfill needed for 2026 |
| `{ passive: true }` scroll listener | HIGH | Web platform standard; documented MDN API; no library dependency |
| CSS transition pattern for scroll animations | HIGH | Verified directly from `Toast.tsx` and `CampaignTabs.tsx` in this codebase — identical pattern already in production |
| Next.js App Router `'use client'` children pattern | HIGH | Established Next.js App Router behaviour; Server Component children can be passed to Client Component wrappers — this is core to the RSC composition model |
| Tailwind CSS 4 utility compatibility | HIGH | All classes used (`transition-all`, `opacity-0`, `translate-y-6`, `backdrop-blur-sm`, `bg-[...]/90`) are standard Tailwind 4 utilities confirmed by existing codebase usage |
| Zero new dependencies conclusion | HIGH | All four animation/interactivity requirements traced to existing browser APIs + existing codebase patterns |

---

## What NOT to Add — Complete Anti-List

| Library | Why Not |
|---------|---------|
| `framer-motion` | 30–60 KB gzipped for effects achievable with 10-line CSS transitions; forces `'use client'` on static sections; version churn (v10→v11→v12 renamed the package) |
| `motion` (Framer's rebranded standalone) | Same objection — smaller bundle but still unnecessary |
| `@react-spring/web` | Spring physics not needed; fade-up is linear/ease — no spring |
| `react-intersection-observer` | Thin wrapper; the underlying `IntersectionObserver` API is native and stable |
| `lenis` | Smooth scroll hijacking; accessibility concerns; over-engineered for this app |
| `react-scroll` | Anchor scrolling library; CSS `scroll-behavior: smooth` suffices if needed |
| `gsap` | Professional animation toolchain; 50+ KB; massive overkill |
| `aos` (Animate on Scroll) | jQuery-era library; adds CSS and JS overhead; the `FadeInSection` component does the same thing in < 20 lines |
| `swiper` | Carousel library; no carousel needed in v1.5 |
| `@headlessui/react` | No new modal/popover patterns in v1.5 |
| `clsx` / `classnames` | Template literals already used throughout the codebase |

---

## Sources

- Codebase inspection (HIGH confidence): `Toast.tsx`, `CampaignTabs.tsx`, `globals.css`, `package.json`, `page.tsx` — all read directly in this research session
- `IntersectionObserver` API: Web platform standard, Living Standard; universal browser support in 2026 (HIGH confidence — established platform knowledge)
- `{ passive: true }` event listener flag: MDN documented Web API (HIGH confidence)
- Next.js App Router RSC composition (Server children in Client wrappers): Core RSC model, documented in Next.js App Router docs (HIGH confidence — training data through August 2025, stable API)
- Framer Motion bundle size (~30–60 KB gzipped): Training data; bundlephobia.com is the authoritative source for live verification (MEDIUM confidence — live npm registry was inaccessible during this research session)
- Tailwind CSS 4 `backdrop-blur-sm`, `opacity-0`, `translate-y-*` utilities: Confirmed by existing codebase usage patterns (HIGH confidence)

---

*Research completed: 2026-03-13*
*Ready for roadmap: yes*
