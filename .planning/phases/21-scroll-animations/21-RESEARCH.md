# Phase 21: Scroll Animations - Research

**Researched:** 2026-03-13
**Domain:** IntersectionObserver API, CSS transitions, Tailwind CSS 4 animation utilities, prefers-reduced-motion
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANIM-01 | Each page section (Hero, Features, Easy for Players, CTA) animates in with a fade + slide-up as it enters the viewport | `useInView` hook using IntersectionObserver; CSS transition classes toggled on intersection; Tailwind `transition-all`, `opacity`, `translate-y` utilities |
| ANIM-02 | Animations are suppressed for visitors with `prefers-reduced-motion` enabled | Tailwind `motion-reduce:` variant removes transitions; CSS `@media (prefers-reduced-motion: reduce)` hard disables; both approaches verified against official docs |
</phase_requirements>

---

## Summary

Phase 21 adds scroll-triggered fade + slide-up animations to the four primary landing page sections: HeroSection, FeaturesBlock, PlayersSection, and CtaSection. The StickyNav and Footer are excluded from animation (Nav is always visible; Footer is low-priority polish).

The zero-new-dependencies constraint is absolute for v1.5. This rules out Framer Motion, Motion One, AOS, and any npm animation library. The correct approach is a small `useInView` React hook implemented inside the project using the native `IntersectionObserver` API, combined with Tailwind CSS 4 transition utilities applied conditionally. Each section component receives a `ref` and toggles from invisible/translated state to visible/natural state when the IntersectionObserver fires.

Tailwind CSS 4 (already installed) provides `motion-reduce:` and `motion-safe:` variants that apply CSS rules conditionally based on `prefers-reduced-motion`. This, combined with `transition-none` applied under `motion-reduce:`, fully satisfies ANIM-02 with zero extra code.

**Primary recommendation:** Build a single `useInView` hook (25 lines) in `src/hooks/useInView.ts`. Each animatable section wraps in a `<div>` with a ref and toggles Tailwind classes for opacity and translateY. Use Tailwind's `motion-reduce:transition-none` on every animated element to handle ANIM-02 declaratively.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| IntersectionObserver API | Native browser API | Detects when elements enter viewport | Built into all modern browsers; zero bundle cost; designed for this exact use case |
| Tailwind CSS 4 | ^4 (already installed) | Transition utilities, motion variants | Already in project; `motion-reduce:` variant handles ANIM-02 declaratively |
| React hooks (useRef, useEffect, useState) | 19.2.3 (already installed) | Wire IO to component state | Standard React pattern; no extra deps |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS `@keyframes` in `globals.css` | — | Define custom animation | Only needed if CSS-only approach preferred over JS toggle; optional given IO approach |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `useInView` hook | Framer Motion / Motion | Better API but BLOCKED — zero deps constraint for v1.5 |
| Custom `useInView` hook | `react-intersection-observer` npm package | Cleaner API but BLOCKED — zero deps constraint |
| JS class toggle | Pure CSS `:has()` / CSS scroll-driven animations | CSS scroll-driven animations are modern but require Chrome 115+; reduced-motion suppression is more verbose; JS hook is simpler and more compatible |

**Installation:** None. No new packages.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   └── useInView.ts         # New: reusable IntersectionObserver hook
├── components/
│   └── landing/
│       ├── HeroSection.tsx      # Add AnimateIn wrapper
│       ├── FeaturesBlock.tsx    # Add AnimateIn wrapper
│       ├── PlayersSection.tsx   # Add AnimateIn wrapper
│       └── CtaSection.tsx       # Add AnimateIn wrapper
```

The hook lives in `src/hooks/` (conventional Next.js location). Section components get a thin wrapper — no structural changes to existing markup.

### Pattern 1: `useInView` Hook

**What:** A hook that attaches an IntersectionObserver to a ref and returns a boolean `inView` that becomes `true` once the element enters the viewport. Uses `{ once: true }` semantics — fires once and disconnects. This is correct for scroll-in animations (you don't want sections re-animating on scroll back up).

**When to use:** Any component that should animate as it enters the viewport.

**Example:**

```typescript
// src/hooks/useInView.ts
// Pattern: minimal IO hook, fires once, cleans up on unmount
import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
  threshold?: number
  rootMargin?: string
}

export function useInView(options: UseInViewOptions = {}) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect() // fires once only
        }
      },
      {
        threshold: options.threshold ?? 0.15,
        rootMargin: options.rootMargin ?? '0px',
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return { ref, inView }
}
```

### Pattern 2: Section Animation Wrapper

**What:** Each section uses the hook and applies Tailwind classes conditionally. The initial state is `opacity-0 translate-y-6`; the visible state is `opacity-100 translate-y-0`. The transition applies to both properties.

**When to use:** All four animated sections (Hero, Features, Players, CTA).

**Example:**

```typescript
// In HeroSection.tsx (and equivalent for other sections)
// Source: Tailwind CSS docs — transition-all, opacity, translate utilities
'use client'  // Not needed — LandingPage is already 'use client' boundary

import { useInView } from '@/hooks/useInView'

export function HeroSection() {
  const { ref, inView } = useInView({ threshold: 0.1 })

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={[
        'flex flex-col items-center justify-center text-center px-8 py-16 gap-6',
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      ].join(' ')}
    >
      {/* existing content unchanged */}
    </section>
  )
}
```

**Key detail:** `motion-reduce:transition-none` disables the transition for reduced-motion users. When `transition-none` is applied, the class toggles still fire (so `opacity-100` is eventually set) but without animation — the section just appears instantly. This satisfies ANIM-02: sections appear, they just don't animate.

### Pattern 3: Tailwind CSS 4 `motion-reduce:` Variant

**What:** Tailwind's `motion-reduce:` variant applies styles only when `prefers-reduced-motion: reduce` is active. It maps directly to `@media (prefers-reduced-motion: reduce)`.

**Source:** https://tailwindcss.com/docs/animation (verified current docs)

```html
<!-- Apply on every animated element -->
<div class="transition-all duration-700 ease-out motion-reduce:transition-none ...">
```

This is the idiomatic Tailwind approach — no manual `@media` blocks needed.

### Pattern 4: `'use client'` Boundary

**What:** The landing section components (HeroSection, FeaturesBlock, etc.) are currently plain server components (no `'use client'` directive). Adding `useRef`/`useEffect`/`useState` via `useInView` requires them to be client components.

**Correct approach:** Since `LandingPage.tsx` is already `'use client'`, all its child components inherit client context even without their own directive. However, best practice is to add `'use client'` to each component that uses hooks directly — this makes the client boundary explicit and avoids confusion.

**Rule from STATE.md:** `page.tsx` must never gain `'use client'`. This is not affected — `page.tsx` remains a server component. Only the `landing/` sub-components change.

### Anti-Patterns to Avoid

- **Animating `width`, `height`, `top`, `left`:** These cause layout reflow and are not GPU-accelerated. Only animate `opacity` and `transform` (translateY). The ui-designer skill explicitly states: "Animate ONLY `transform` and `opacity`."
- **No `once: false` (re-triggering):** Don't make sections re-animate when scrolled back into view — this is disorienting. Use `observer.disconnect()` after first intersection.
- **Animating HeroSection at page load with a threshold that misses:** Hero is above the fold on page load. Use `threshold: 0` or a tiny rootMargin so it fires immediately on mount. Consider `inView` defaulting to `true` for HeroSection since it's always visible on load, OR use `rootMargin: '0px 0px -50px 0px'` to trigger just before entry.
- **Large `translate-y` values:** Keep slide distance subtle — 24px (`translate-y-6`) is appropriate. Larger values feel over-designed and can cause visible layout shift on fast devices.
- **Forgetting stagger:** If animating multiple elements within a section (e.g., the three PlayersSection cards), add stagger with `delay-[Xms]` classes. The ui-designer skill recommends 50-80ms stagger. This is optional polish — ANIM-01 requires section-level animation, not sub-element.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `prefers-reduced-motion` detection | Custom `useMediaQuery('prefers-reduced-motion: reduce')` hook | Tailwind `motion-reduce:transition-none` | CSS handles it natively without JS; simpler, no state |
| IntersectionObserver polyfill | Any polyfill | None needed | All target browsers (modern Chrome/Firefox/Safari) support IO natively; global support is ~98% |
| Animation library abstraction | Custom animation state machine | `useInView` hook (25 lines) | This problem is small enough for a direct hook; no abstraction layer needed |

**Key insight:** This phase is intentionally low-complexity. The entire implementation is one 25-line hook and four component edits. Over-engineering (custom context providers, animation queues, stagger orchestration) would violate the simplicity intent.

---

## Common Pitfalls

### Pitfall 1: HeroSection Never Animates (Too High a Threshold)

**What goes wrong:** HeroSection is at the top of the page. On page load it is already in the viewport, so IntersectionObserver fires immediately — but only if the threshold is met. If `threshold: 0.5` (50% visible), and the hero is partially clipped on a short viewport, it may never trigger.

**Why it happens:** IO fires only when the threshold percentage of the element is visible. A tall section on a small viewport may never reach 50%.

**How to avoid:** Use `threshold: 0.1` (10%) for HeroSection. Or use `rootMargin: '0px'` with `threshold: 0`. The hero should feel instant on page load — consider `threshold: 0`.

**Warning signs:** Hero stays invisible after page load in testing on small viewport heights (e.g., 600px).

### Pitfall 2: TypeScript Ref Type Mismatch

**What goes wrong:** `useRef<HTMLElement>` is assigned to a `<section>` element's `ref` prop. TypeScript complains because `HTMLElement` is broader than `HTMLElement | null` and the ref typing doesn't align.

**Why it happens:** `useRef` returns `RefObject<T>` where T must match the element type exactly.

**How to avoid:** Type the ref as `useRef<HTMLDivElement | null>(null)` or cast in the component: `ref={ref as React.RefObject<HTMLDivElement>}`. Alternatively, make the hook generic: `useInView<T extends HTMLElement>()` returning `ref: RefObject<T>`.

**Warning signs:** TypeScript error on `ref={ref}` prop assignment.

### Pitfall 3: SSR Flash of Invisible Content

**What goes wrong:** On server render, `inView` is `false`, so all sections render with `opacity-0`. Before JS hydrates and IO fires, the user sees a blank page briefly.

**Why it happens:** The initial state is `opacity-0` (pre-animation state). During SSR + hydration gap, this is rendered to HTML with no JS running.

**How to avoid:** For the HeroSection specifically, consider initializing `inView` to `true` for above-fold content, OR ensure the duration is short enough (300-400ms) that the flash is imperceptible after hydration. Most scroll animation implementations accept this trade-off — the sections are very briefly invisible then fade in quickly on hydration.

**Warning signs:** Slow network test (Chrome DevTools throttle to Slow 3G) shows blank white/invisible sections before hydration.

### Pitfall 4: `'use client'` Not Added to Section Components

**What goes wrong:** Adding `useInView` (which uses `useRef`/`useEffect`) to a component that lacks `'use client'` causes a Next.js build error: "You're importing a component that needs useEffect. It only works in a Client Component."

**Why it happens:** Next.js App Router components are Server Components by default. Hooks require client context.

**How to avoid:** Add `'use client'` as the first line of each section component that uses `useInView`. LandingPage.tsx already has it but the sub-components need their own directive when using hooks directly.

**Warning signs:** Build error mentioning `useEffect` or `useState` in a server component.

### Pitfall 5: Observer Not Cleaned Up

**What goes wrong:** Memory leak from IntersectionObserver instances that are not disconnected when components unmount.

**Why it happens:** Forgetting `return () => observer.disconnect()` in the `useEffect` cleanup.

**How to avoid:** The `useInView` hook pattern above includes cleanup. Use `observer.disconnect()` both in the intersection callback (once=true) AND in the useEffect cleanup return.

**Warning signs:** Memory growth in long-running sessions; React dev tools warnings about state updates on unmounted components.

---

## Code Examples

Verified patterns from official sources:

### Tailwind CSS 4 `@theme` Custom Animation (globals.css)

```css
/* Source: https://tailwindcss.com/docs/animation — v4 CSS-first approach */
/* Optional: define named animation if CSS-only approach preferred */
@theme {
  --animate-fade-slide-up: fade-slide-up 0.6s ease-out both;

  @keyframes fade-slide-up {
    from {
      opacity: 0;
      transform: translateY(1.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

This approach (CSS-only animate-fade-slide-up class) is an alternative to JS class toggling, but requires CSS scroll-driven animations (not yet universally supported) to trigger on scroll. For this phase, the **JS class toggle approach with Tailwind transitions is preferred** because it gives precise control over the trigger point and works in all browsers.

### Tailwind `motion-reduce:` Variant (verified)

```html
<!-- Source: https://tailwindcss.com/docs/animation — motion-safe/motion-reduce variants -->
<section class="transition-all duration-700 ease-out motion-reduce:transition-none opacity-0 translate-y-6 ...">
```

### Complete `useInView` Hook

```typescript
// Source: MDN IntersectionObserver API + React hooks pattern
// src/hooks/useInView.ts
import { useEffect, useRef, useState } from 'react'

export function useInView(options: { threshold?: number; rootMargin?: string } = {}) {
  const ref = useRef<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: options.threshold ?? 0.1,
        rootMargin: options.rootMargin ?? '0px',
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return { ref, inView }
}
```

### Section Component Usage Pattern

```typescript
// Each animated section follows this pattern
'use client'
import { useInView } from '@/hooks/useInView'

export function CtaSection() {
  const { ref, inView } = useInView({ threshold: 0.15 })

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className={[
        // existing classes...
        'flex flex-col items-center justify-center text-center px-8 py-16 gap-6',
        // animation classes
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      ].join(' ')}
    >
      {/* existing content unchanged */}
    </section>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `scroll` event listener + getBoundingClientRect | IntersectionObserver API | Chrome 51+ (2016), universal by 2020 | No scroll performance overhead; browser-native; cleaner API |
| Framer Motion `whileInView` | Native IO + CSS (when zero-deps required) | N/A — context-dependent | For zero-dep projects, native IO is the correct choice |
| CSS `animation-play-state: paused` toggle | CSS class toggle (opacity/transform) | N/A | Class toggle is simpler and more readable |
| `tailwind.config.js` keyframes | `@theme { @keyframes ... }` in CSS | Tailwind v4 | CSS-first config is the v4 standard |

**Deprecated/outdated:**
- Scroll event + `getBoundingClientRect()`: Not wrong but unnecessary; IntersectionObserver is purpose-built and more performant.
- `tailwind.config.js` for custom animations: Still works in v4 but the CSS-first `@theme` approach is the v4 idiom.

---

## Open Questions

1. **Should `HeroSection` animate at all?**
   - What we know: ANIM-01 explicitly includes Hero. It's always above the fold on page load.
   - What's unclear: Does the hero animate immediately on load (looks like a page load animation) or only when scrolled back to? Since IO fires immediately if the element is already visible on mount, the hero will animate on page load — which is intentional and common for landing pages.
   - Recommendation: Keep threshold at `0` for Hero so it fires immediately, giving a subtle entrance animation on page load. This is desirable UX.

2. **Should the `Footer` animate?**
   - What we know: ANIM-01 specifies Hero, Features, Easy for Players, CTA only. Footer is not listed.
   - What's unclear: Whether the planner should add it as a bonus or strictly exclude it.
   - Recommendation: Implement exactly what ANIM-01 specifies. Footer excluded. The planner should not add it.

3. **Stagger within sections?**
   - What we know: ANIM-01 requires section-level animation, not sub-element stagger.
   - What's unclear: Whether sub-element stagger (e.g., the 3 PlayersSection cards animating with 100ms offsets) is in scope.
   - Recommendation: Not in scope for this phase. Implement section-level animation only. Sub-element stagger is pure polish for a future phase.

---

## Sources

### Primary (HIGH confidence)
- https://tailwindcss.com/docs/animation — Tailwind v4 `@theme` keyframes, `motion-reduce:` and `motion-safe:` variants, built-in animate utilities. Verified current docs.
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion — MDN official reference for `prefers-reduced-motion` syntax and best practices.

### Secondary (MEDIUM confidence)
- https://www.nray.dev/blog/how-to-create-performant-scroll-animations-in-react/ — IntersectionObserver + React hook pattern; consistent with MDN IO API docs.
- https://www.opencoregroup.com/insights/simple-scroll-based-fade-animations-with-react-and-intersection-observer — Simple IO + React fade pattern; cross-references with MDN API.

### Tertiary (LOW confidence)
- None. All critical claims verified against official docs.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; IntersectionObserver is native browser API; Tailwind 4 is already installed and docs verified.
- Architecture: HIGH — `useInView` hook pattern is well-established; TypeScript typing pitfalls identified and documented; existing project structure is clear.
- Pitfalls: HIGH — SSR flash, threshold mismatch, ref typing, and cleanup issues are documented from verifiable patterns; not speculative.

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable APIs — IntersectionObserver is a mature spec; Tailwind 4 motion variants are stable)
