# Domain Pitfalls

**Domain:** Next.js 16 App Router — adding a marketing landing page with scroll animations, sticky nav, and an interactive demo to an existing production app
**Milestone:** v1.5 Marketing Home Page
**Researched:** 2026-03-13
**Confidence:** HIGH for pitfalls grounded in direct codebase inspection and established Next.js/React 19 behaviour; MEDIUM for Framer Motion–specific details (knowledge cutoff August 2025, no live verification available)

---

## Critical Pitfalls

### Pitfall 1: Scroll-triggered animation components cause hydration mismatch because they read `window` or `scrollY` on first render

**What goes wrong:**
Scroll-triggered animations need to know whether a section is in the viewport. The naive implementation uses `window.scrollY` or `document.querySelector` in component body code, or initialises `useIntersectionObserver` state differently on server vs client. The server renders all sections as "not yet visible" (hidden / `opacity-0`). The client hydrates and immediately sees some sections are already in view — so their "visible" state differs from what the server rendered. React throws a hydration warning, and in some cases visually flickers or snaps sections into their end state without animating.

**Why it happens:**
`window`, `document`, and `IntersectionObserver` do not exist in the Node.js SSR environment. Code that references them at module level or in the component body (outside `useEffect`) crashes the server render or produces mismatched output. Conditional guards like `typeof window !== 'undefined'` in component body code are not sufficient — they silence the crash but the render still produces different HTML on server vs client.

**Consequences:**
- Hydration warning in the console (`Expected server HTML to contain a matching...`)
- Visible layout flash as sections snap from `opacity-0` to `opacity-100` without transition on first load
- In production, React 19's stricter hydration may throw and force a full client re-render, removing SSR benefits

**Prevention:**
Two reliable patterns:

**Pattern A — `useEffect` + `useState(false)` for all animation state:**
```tsx
'use client'
import { useEffect, useRef, useState } from 'react'

export function AnimatedSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false) // always false on server

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      {children}
    </div>
  )
}
```

The key: `useState(false)` always renders `opacity-0` on both server and client first paint. `useEffect` only runs client-side, so no mismatch.

**Pattern B — Framer Motion `motion` components with `initial` / `whileInView`:**
Framer Motion's `whileInView` prop internally uses `IntersectionObserver` only on the client. The server-rendered output uses the `initial` state. This matches Pattern A's behaviour when used correctly — but see Pitfall 5 for Framer Motion–specific SSR issues.

**What NOT to do:**
- Do not initialise animation state based on `getBoundingClientRect()` outside `useEffect`
- Do not use `suppressHydrationWarning` on animated elements as a shortcut — it hides the symptom, not the cause
- Do not use CSS `@keyframes` animations without a `prefers-reduced-motion` media query — see Pitfall 9

**Phase:** Scroll-triggered section entrance animations phase.

---

### Pitfall 2: Sticky nav with scroll detection causes hydration mismatch or layout shift when background transition is driven by JS state

**What goes wrong:**
The nav's "scrolled" state (dark background on scroll) requires reading `window.scrollY`. If `scrollY` is read during SSR or used to set initial state, the server always renders the nav as "not scrolled" (transparent), but a returning user with a cached page and existing scroll position sees a flash. More critically: if the sticky nav's height is used in layout calculations (e.g., `scroll-margin-top`, section offsets), a mismatch between SSR height and actual rendered height causes layout shift.

The specific risk for this app: `layout.tsx` has a fixed background gradient and a `fixed` background image overlay. A `position: fixed` sticky nav that adds itself to the DOM flow on the landing page but not on the campaigns page needs to be carefully scoped to avoid affecting the existing logged-in experience.

**Why it happens:**
`scroll` event listeners and `window.scrollY` are client-only. Rendering with different initial state (e.g., `const [scrolled, setScrolled] = useState(window.scrollY > 0)`) crashes on server. Even with a `typeof window !== 'undefined'` guard, the mismatch between server's `false` and client's `true` triggers hydration errors if the guard runs in component body rather than `useEffect`.

**Consequences:**
- Flash of unstyled nav (transparent background briefly visible then switching to dark)
- If nav height is used in any scroll offset calculation, those calculations are wrong on first render
- If the nav is added to `layout.tsx` globally, it appears on the campaigns/dashboard pages (breaking the existing logged-in experience)

**Prevention:**

**Scoping:** Do NOT add the sticky nav to `layout.tsx`. The nav is landing-page–only. Keep it inside the landing page's own component tree. The existing campaigns page has its own header pattern — a global nav would visually conflict with it.

**Correct scroll-detection pattern:**
```tsx
'use client'
import { useEffect, useState } from 'react'

export function StickyNav() {
  const [scrolled, setScrolled] = useState(false) // always false on server

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // sync on mount without waiting for scroll event
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
      scrolled ? 'bg-[#140326]/90 backdrop-blur-sm' : 'bg-transparent'
    }`}>
      {/* ... */}
    </nav>
  )
}
```

`{ passive: true }` is essential — scroll listeners without `passive: true` block the main thread and cause jank on mobile. The `onScroll()` call on mount ensures the state is correct immediately after hydration without waiting for the user to scroll.

**z-index:** The existing app uses `z-50` for modals (`ShareModal`, `HowItWorksModal`). The sticky nav must use `z-40` or lower to stay below modals. The `HowItWorksButton` on the home page opens a `<dialog>` at `z-50` — if the nav is at `z-50`, the modal backdrop will render behind it.

**Phase:** Sticky nav phase.

---

### Pitfall 3: The existing `page.tsx` redirect-to-`/campaigns` for logged-in DMs breaks when the page becomes long-form — the server auth check must stay at the top

**What goes wrong:**
The current home page (`page.tsx`) has `const dm = await getSessionDM(); if (dm) redirect('/campaigns')`. This redirect fires on every server render for logged-in DMs. When the page becomes a full landing page with many sections, this redirect is still the right behaviour — but there is a temptation to restructure the file during the conversion (e.g., splitting into many components, changing the export default structure). Any restructuring that moves the `getSessionDM()` call lower in the component, or wraps it in a condition that skips it, silently removes the auth redirect for logged-in DMs.

**Why it happens:**
Large component files with many sections invite refactoring. A developer building the FeaturesBlock or DemoEmbed component might extract the entire page body and inadvertently move the auth check inside a sub-component — which no longer has access to the await before the render returns.

**Consequences:**
Logged-in DMs see the marketing landing page instead of being sent to their campaigns list. This is a UX regression with no error — it silently breaks the existing flow.

**Prevention:**
Keep the auth check and redirect as the very first thing in the `page.tsx` default export, before any JSX is returned or any section component is rendered. Document this constraint with a comment:

```tsx
export default async function HomePage() {
  // Auth guard: logged-in DMs always go directly to /campaigns
  const dm = await getSessionDM()
  if (dm) redirect('/campaigns')

  // Marketing landing page for logged-out visitors
  return (
    <main>
      <StickyNav />
      <HeroSection />
      {/* ... */}
    </main>
  )
}
```

Do not move `getSessionDM()` into a child Server Component or a shared layout. The redirect must fire before any page content is sent to the client.

**Phase:** All landing page phases — this risk is present whenever `page.tsx` is modified.

---

### Pitfall 4: The interactive demo component accidentally imports or calls real Prisma / server action code

**What goes wrong:**
The interactive demo component is a self-contained client component that simulates the player availability experience with placeholder data. It visually resembles `AvailabilityCalendar.tsx` and `WeeklySchedule.tsx`. The most common mistake is importing one of those real components (which themselves are `'use client'`) and passing fake props — but those components may import utilities from `@/lib/calendarUtils` or `@/lib/availability` that in turn import from Prisma client or server-only modules.

If any component in the demo's import tree imports `@/lib/prisma` (even indirectly), Next.js will throw during the build or at runtime:
```
Error: PrismaClient is not supported in the browser
```

**Why it happens:**
The real availability components are display-only and look safe to reuse. Developers import `AvailabilityCalendar` into the demo to avoid duplicating UI. But `AvailabilityCalendar` imports from `@/lib/calendarUtils` which may share a module boundary with `@/lib/prisma` through re-exports or barrel files.

**Consequences:**
Build failure or runtime error in the demo component. The entire landing page fails to render. Because this error appears at build time on Vercel, it blocks deployment.

**Prevention:**
The demo component must be **fully self-contained** — it must not import from any `@/lib/` module that has a server-side dependency chain. Specifically:
- Do not import `AvailabilityCalendar` directly — copy only the visual/display logic needed
- Do not import from `@/lib/calendarUtils` unless you have verified that file has zero imports from `@/lib/prisma`, `@/lib/actions/`, or any module marked `server-only`
- Add `'use client'` at the top of every file in the demo component tree
- Use hardcoded placeholder data defined inline in the demo file, not fetched or derived from server utilities

**Detection:**
Run `next build` and watch for "PrismaClient is not supported in the browser" errors. Better: run the dev server and check the browser console for module resolution errors before shipping.

**Phase:** Interactive demo component phase.

---

### Pitfall 5: Framer Motion's `LazyMotion` / `m` component strategy is skipped, bloating the landing page bundle

**What goes wrong:**
Framer Motion's full bundle is approximately 100–140 KB gzipped. If the entire `framer-motion` package is imported with `import { motion } from 'framer-motion'`, the full animation engine ships on the first page load for every visitor — including the CSS and JS for features like gestures, drag, and layout animations that the landing page will never use.

For a landing page that only needs simple entrance animations (fade-in, slide-up), shipping 140 KB of animation library is disproportionate. This matters because the landing page is the first thing users see — a slow load undermines the credibility of the product it markets.

**Why it happens:**
`import { motion } from 'framer-motion'` is the canonical example in Framer Motion's README. Developers copy it without reading the optimisation docs.

**Consequences:**
- Slower first contentful paint on the landing page (the only page new users see)
- Lighthouse performance score degrades
- The app was previously zero-animation-library — adding 140 KB for what could be achieved with Tailwind CSS transitions is hard to justify

**Prevention:**
Two alternatives in order of preference:

**Option A — No Framer Motion (preferred for this app):**
CSS Tailwind transitions with `IntersectionObserver` (Pattern A from Pitfall 1) achieve all required landing page effects: fade-in, slide-up, scale. The existing codebase uses this approach already for the side panel and snackbar in `CampaignTabs.tsx`. Zero new dependencies, zero bundle impact. The FeaturesBlock step selector is pure state toggling — no animation library needed.

**Option B — Framer Motion with `LazyMotion` + `domAnimation`:**
If Framer Motion is chosen, use `LazyMotion` with the `domAnimation` feature bundle (~18 KB gzipped) instead of the full bundle:
```tsx
import { LazyMotion, domAnimation, m } from 'framer-motion'

// Wrap the landing page sections:
<LazyMotion features={domAnimation}>
  <m.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}>
    ...
  </m.section>
</LazyMotion>
```
`m` is the tree-shaken component, `domAnimation` is the minimal feature set. This keeps the bundle under 20 KB for the animation use case here.

**Decision for this milestone:** Given the animation requirements (scroll-entrance only, no drag, no layout, no gestures), Option A is recommended. Framer Motion adds a dependency with ongoing maintenance cost; Tailwind CSS transitions handle the same effects at zero cost.

**Phase:** All animation phases.

---

## Moderate Pitfalls

### Pitfall 6: The `FeaturesBlock` step-selector image swap causes layout shift if images are not sized explicitly

**What goes wrong:**
The `FeaturesBlock` component shows a step list on one side and a swappable image on the other. When the user clicks a step, the image changes. If the image container does not have fixed dimensions (or `aspect-ratio`), the block reflowing as the new image loads causes visible layout shift. This is especially jarring because the block is interactive and the shift happens on user action.

**Why it happens:**
`next/image` with `width` and `height` props reserves space — but only if the image container itself has defined dimensions. If the image is rendered with `fill` mode inside a container that has no height, the container collapses to zero before the image loads, then expands. When switching between step images of different aspect ratios, the container height jumps between renders.

**Consequences:**
Visual jank on every step click. Users on slow connections see a flash of empty space before the new image appears. The interactive feature that is supposed to demonstrate the app's quality instead makes the landing page feel unpolished.

**Prevention:**
- Define the image container with a fixed `aspect-ratio` (e.g., `aspect-video` or `aspect-[4/3]`) and `overflow-hidden`
- Use `next/image` with `fill` and `object-cover` inside this fixed-aspect container
- All step images must be the same aspect ratio, or the container must be sized to accommodate the largest
- Pre-load all step images: `<link rel="preload" as="image" />` or use `priority` on the first visible step image

**Phase:** FeaturesBlock / interactive step-selector phase.

---

### Pitfall 7: The interactive demo component uses `new Date()` for its planning window, causing SSR/client mismatch

**What goes wrong:**
The demo component shows a calendar with a planning window. If the window start/end dates are computed with `new Date()` (i.e., "today + 30 days"), the server renders the calendar with one date range, and the client hydrates with a different date range if the time-of-day or date has changed between server render and client hydration. React flags a hydration mismatch.

More subtly: even if the dates match, `new Date().toLocaleDateString()` produces different output depending on the server's locale vs the client's locale. The server (Vercel Node.js) may use a different locale than the user's browser.

**Why it happens:**
Using `new Date()` for demo/placeholder dates feels natural — "show a calendar starting from today." It is not obvious that this creates an SSR mismatch.

**Consequences:**
Hydration mismatch warning. Depending on how React 19 handles it, the demo calendar may flicker or re-render entirely on mount, causing a visible flash.

**Prevention:**
Use **static, hardcoded placeholder dates** in the demo component — not dynamic dates. Example:
```tsx
const DEMO_PLANNING_WINDOW_START = '2025-06-01'
const DEMO_PLANNING_WINDOW_END = '2025-06-30'
```
The demo is illustrative, not real-time. A fixed date range is more predictable and communicates "here is an example" more clearly than "here is a calendar starting today."

If the demo truly needs to feel current, compute the date on the client side only inside `useEffect` and update state there — ensuring the server always renders the static fallback and the client updates after hydration without a mismatch.

**Phase:** Interactive demo component phase.

---

### Pitfall 8: Multiple `IntersectionObserver` instances per section component creates performance problems on long pages

**What goes wrong:**
If each animated section creates its own `IntersectionObserver` with `new IntersectionObserver(...)` in a `useEffect`, a page with 6 sections creates 6 observer instances. While browsers can handle this, it is wasteful — each observer adds overhead per scroll event. On low-end devices, multiple observers firing simultaneously on fast scrolls can cause frame drops.

**Why it happens:**
The per-component `useEffect` pattern (Pattern A from Pitfall 1) naturally creates one observer per component. This is fine for a small number of sections but not for a page with many repeated animated elements (e.g., the 3-card grid in "Easy for players" where each card animates independently).

**Consequences:**
Scroll jank on low-end mobile devices. More pronounced with staggered animations on card grids where all 3 cards have independent observers.

**Prevention:**
- Use a single shared `IntersectionObserver` that observes multiple elements, implemented as a React context or a shared hook
- Or: use `once: true` in the observer options and disconnect after the first intersection (already done in Pattern A above with the `observer.disconnect()` in the callback) — this means each observer only fires once and the overhead is time-limited
- For card grids: animate the grid container as one unit rather than animating each card independently with staggered observers. Use CSS `animation-delay` with a single observer on the parent:

```tsx
// Parent container observed once
// Children use CSS animation-delay
<div className={visible ? 'animate-in' : 'opacity-0'}>
  {cards.map((card, i) => (
    <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
      {card}
    </div>
  ))}
</div>
```

**Phase:** Scroll-triggered section entrance animations phase.

---

### Pitfall 9: Scroll animations run at full intensity for users with `prefers-reduced-motion` enabled

**What goes wrong:**
Users who have enabled "Reduce motion" in their OS accessibility settings (`prefers-reduced-motion: reduce`) expect animations to be minimal or absent. Scroll-triggered fade-ins and slide-ups that ignore this preference are an accessibility violation and a poor user experience for motion-sensitive users.

**Why it happens:**
Tailwind CSS utility classes for transitions and `IntersectionObserver`-driven state changes do not automatically respect `prefers-reduced-motion`. The developer must explicitly handle it.

**Consequences:**
Motion-sensitive users experience the full scroll animation sequence. On a landing page with 6+ animated sections, this is a significant accessibility issue.

**Prevention:**
Tailwind CSS 4 provides the `motion-reduce:` variant. Apply it to all animation-related classes:

```tsx
className={`transition-all duration-700 motion-reduce:transition-none ${
  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
}`}
```

Or use a custom hook that detects the preference and disables animation state changes entirely:
```tsx
const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')
const [visible, setVisible] = useState(prefersReduced) // immediately visible if reduced motion
```

For Framer Motion, use the built-in `useReducedMotion()` hook.

**Phase:** All animation phases.

---

### Pitfall 10: The home page becomes a mixed Server/Client component tree that conflicts with the existing redirect-first pattern

**What goes wrong:**
The landing page requires several Client Components (`StickyNav`, `FeaturesBlock`, `AnimatedSection`, the demo component). A common mistake is making the top-level `page.tsx` a Client Component by adding `'use client'` to accommodate one of these — which breaks the `getSessionDM()` server-side auth check and the `redirect('/campaigns')` call.

`redirect()` from `next/navigation` must be called in a Server Component (or a Server Action). It throws an error if called in a Client Component. `getSessionDM()` uses `cookies()` from `next/headers` and makes a Prisma database query — both are server-only.

**Why it happens:**
Large pages with many interactive sections tempt developers to make the whole page `'use client'` to avoid thinking about the Server/Client boundary. This pattern was already flagged in v1.4 for the campaigns page — the landing page has the same risk with even more client-interactive sections.

**Consequences:**
- `page.tsx` with `'use client'` causes `getSessionDM()` to throw (`cookies()` is not available in Client Components)
- The auth redirect disappears silently — logged-in DMs see the marketing page
- Any server data (if added later, e.g., showing a live player count) requires an `api/` route call instead of a direct Prisma query

**Prevention:**
Keep `page.tsx` as a Server Component — it has no `'use client'` at the top. All interactive sections are separate Client Component files imported into the server page. The pattern established in v1.2/v1.3 is: Server Component page → imports → Client Component islands. Follow the same pattern:

```tsx
// page.tsx — Server Component, no 'use client'
import { getSessionDM } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StickyNav } from '@/components/landing/StickyNav'       // 'use client'
import { HeroSection } from '@/components/landing/HeroSection'   // Server Component (static)
import { FeaturesBlock } from '@/components/landing/FeaturesBlock' // 'use client'
import { DemoEmbed } from '@/components/landing/DemoEmbed'       // 'use client'

export default async function HomePage() {
  const dm = await getSessionDM()
  if (dm) redirect('/campaigns')
  return (
    <main>
      <StickyNav />
      <HeroSection />
      <FeaturesBlock />
      <DemoEmbed />
    </main>
  )
}
```

**Phase:** All landing page phases.

---

### Pitfall 11: The demo component's "fake" availability state is reset on every parent re-render

**What goes wrong:**
The interactive demo component shows player availability that users can toggle (clicking calendar cells marks days free/busy). Its state lives in `useState` inside the demo. If the demo component is embedded inside an `AnimatedSection` wrapper that re-renders on scroll (because `visible` state changes), the demo's internal state resets — days the user just toggled go back to their initial values.

**Why it happens:**
When a parent component re-renders and changes a prop that is part of the JSX key (or React's reconciler loses track of the component identity), the child component unmounts and remounts, resetting all local state. This happens when animated wrappers change their className or when conditional rendering causes the demo to unmount and remount.

**Consequences:**
User interacts with the demo (clicks days to mark them available), then scrolls away and back — the demo resets to its initial state. This is confusing and makes the demo feel broken.

**Prevention:**
- The `AnimatedSection` wrapper must change only CSS classes, never unmount/remount its children. Conditional rendering (`{visible && <Demo />}`) will unmount the demo — use `opacity-0`/`opacity-100` class switching instead
- Keep the demo's state in a `useRef` or in a stable parent component that does not re-render due to scroll events
- Alternatively, lift the demo state one level up into the landing page component so it is immune to animated wrapper re-renders

**Phase:** Interactive demo component phase.

---

### Pitfall 12: The landing page's dark background and the app's existing `html/body` background conflict when the sticky nav `backdrop-blur` is applied

**What goes wrong:**
The existing `globals.css` applies a radial gradient to `html, body` and a fixed `bg-cover` overlay image in `layout.tsx`. The landing page uses a sticky nav with `backdrop-blur-sm`. On Safari, `backdrop-blur` requires the element to be composited — if the background behind the nav is the `html` gradient rather than a painted element, the blur may not work or may produce visual artefacts (particularly with the fixed overlay image).

**Why it happens:**
`backdrop-filter: blur()` blurs whatever is rendered behind the element in the compositing layer. A `position: fixed` overlay image (`pointer-events-none fixed inset-0 opacity-30`) in the layout sits above the background gradient. If the nav is `position: fixed` and `backdrop-blur-sm`, the blur samples from the elements behind it — including the fixed overlay image. The resulting blur may look grey rather than dark-purple because the overlay image blurs into an averaged colour.

**Consequences:**
Nav background looks wrong on Safari (grey blur instead of dark-purple tint). The visual design of the nav dark-on-scroll effect is broken in production (Vercel, which most users will access via a standard browser including Safari).

**Prevention:**
- Test `backdrop-blur` against the existing background stack early (local dev with the fixed overlay image active)
- If the blur effect looks wrong, use `bg-[#140326]/90` (solid dark colour at 90% opacity) instead of `backdrop-blur` — this achieves the "dark nav on scroll" requirement without the compositing risk and is consistent with the existing design tokens (`--dnd-input-bg: #1e0439`)
- The simpler `bg-[var(--dnd-input-bg)]/90` approach with a `transition-colors` on scroll is more reliable cross-browser than `backdrop-filter`

**Phase:** Sticky nav phase.

---

## Minor Pitfalls

### Pitfall 13: Section anchor IDs for in-page navigation are not added, making future links to sections fragile

**What goes wrong:**
The landing page has distinct sections (hero, features, "easy for players," CTA). If any external link or future marketing email needs to link directly to the features section, there is no anchor to target. This is a minor pitfall because v1.5 does not require in-page navigation — but it is cheap to add and expensive to retrofit later if section IDs conflict with other IDs added during development.

**Prevention:**
Add stable `id` attributes to each top-level section element during initial build: `id="features"`, `id="demo"`, `id="how-it-works-players"`, `id="cta"`. The sticky nav can use these for smooth scroll if needed later.

**Phase:** Landing page structure phase.

---

### Pitfall 14: The `suppressHydrationWarning` on `<body>` in `layout.tsx` masks real hydration errors in the new landing page

**What goes wrong:**
`layout.tsx` currently has `suppressHydrationWarning` on `<body>`. This suppresses hydration warnings for the body element and its direct children. If the landing page's animated sections produce hydration mismatches (Pitfall 1), the `suppressHydrationWarning` may mask some of these warnings in development, making them harder to catch before production.

**Why it happens:**
`suppressHydrationWarning` on `<body>` is a common pattern to suppress browser extension injection warnings (password managers, ad blockers add attributes to `<body>`). It is already in this codebase for that reason. Its scope is limited to the element it is applied to and its direct children — but it is easy to misread as suppressing all hydration warnings in the tree.

**Consequences:**
Animation-related hydration mismatches on `<section>` or `<div>` elements deeper in the tree are NOT suppressed by `<body suppressHydrationWarning>`. So this is more a confusion risk than a real masking risk — developers may assume hydration is fine because no warnings appear, not realising the `suppressHydrationWarning` does not cover deep tree mismatches. The actual warning will still appear for animation state mismatches in the section components.

**Prevention:**
When building the landing page, temporarily remove `suppressHydrationWarning` from `<body>` in local development and verify no new warnings appear. Restore it for production (it is legitimate for browser-extension attribute injection). Do not add `suppressHydrationWarning` to any animated element as a substitute for fixing the underlying mismatch.

**Phase:** All landing page phases.

---

### Pitfall 15: Sign up / Log in CTA links in the landing page use the wrong `href` if auth routes change

**What goes wrong:**
The landing page has multiple CTA sections with Sign up / Log in buttons. The existing home page uses `href="/auth/login"` and `href="/auth/signup"`. If these paths are hardcoded in several places across the landing page components, a future auth route change requires updating every occurrence. Currently there are 2 CTAs (hero + final section) plus the sticky nav buttons — that is 6 total link instances if each has both Sign up and Log in.

**Prevention:**
Define auth route constants at the top of `page.tsx` or in a shared `routes.ts` constant file and reference them in all CTA components:
```ts
export const ROUTES = {
  login: '/auth/login',
  signup: '/auth/signup',
}
```
This is a minor discipline improvement that prevents subtle bugs if auth routing changes.

**Phase:** Landing page structure phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Sticky nav | Hydration mismatch from `window.scrollY` in initial render | `useState(false)` + `useEffect` scroll listener with `passive: true`; never read `window` outside `useEffect` |
| Sticky nav | z-index collision with `HowItWorksModal` (`z-50`) | Nav at `z-40`; modals at `z-50`; document the scale |
| Sticky nav | `backdrop-blur` visual artefacts with fixed overlay image (Safari) | Test early; prefer solid `bg-[var(--dnd-input-bg)]/90` over `backdrop-blur` |
| Sticky nav | Nav appears on logged-in campaigns page | Keep nav inside `page.tsx` component tree, NOT in `layout.tsx` |
| Scroll animations | SSR/client mismatch from `IntersectionObserver` initialisation | `useState(false)` always renders hidden on server; observer runs in `useEffect` only |
| Scroll animations | `prefers-reduced-motion` not respected | Apply `motion-reduce:transition-none` to all animated elements |
| Scroll animations | Multiple observers per card grid causing scroll jank | Observe parent container once; use CSS `animation-delay` for stagger |
| FeaturesBlock step selector | Image swap causes layout shift | Fix image container with `aspect-ratio` and `overflow-hidden`; use `next/image fill` |
| Interactive demo | Import chain reaching `@/lib/prisma` | Demo must be fully self-contained; no imports from `@/lib/` with server-side dependencies |
| Interactive demo | `new Date()` for planning window causes hydration mismatch | Use static hardcoded placeholder dates |
| Interactive demo | State resets when animated wrapper re-renders | Use class-switching not conditional render for animation; lift demo state above animation wrapper |
| `page.tsx` (all phases) | `getSessionDM()` and `redirect()` lost if file gains `'use client'` | `page.tsx` must never have `'use client'`; keep auth guard as first lines |
| `page.tsx` (all phases) | Logged-in DM sees marketing page | `getSessionDM()` + `redirect('/campaigns')` must remain at top of Server Component |
| Bundle size | Framer Motion full bundle (~140 KB gzipped) added unnecessarily | Use Tailwind CSS transitions + IntersectionObserver instead; if Framer Motion used, use `LazyMotion` + `domAnimation` |

---

## Sources

- Codebase inspection (HIGH confidence): `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/campaigns/page.tsx`, `src/components/HowItWorksModal.tsx`, `src/components/HowItWorksButton.tsx`, `src/components/AvailabilityCalendar.tsx`, `src/components/CampaignTabs.tsx`, `src/lib/auth.ts`, `package.json` — all read directly
- Project context (HIGH confidence): `.planning/PROJECT.md` — active v1.5 requirements, architectural decisions, existing auth pattern
- Next.js App Router Server/Client boundary rules — `redirect()` and `cookies()` server-only; `'use client'` promotion consequences (HIGH confidence — stable Next.js core behaviour, knowledge cutoff August 2025)
- React 19 hydration strictness — `useState` initial value must match server render; `useEffect` runs client-only (HIGH confidence — React 19 docs, knowledge cutoff August 2025)
- `IntersectionObserver` API — browser-only, must be in `useEffect`; `{ passive: true }` for scroll listeners (HIGH confidence — Web API spec, stable)
- Framer Motion `LazyMotion` / `domAnimation` bundle strategy — bundle sizes and `m` component usage (MEDIUM confidence — knowledge cutoff August 2025, not verified via live docs in this session)
- `prefers-reduced-motion` — Tailwind CSS 4 `motion-reduce:` variant (HIGH confidence — Tailwind 4 docs, knowledge cutoff August 2025)
- `backdrop-filter: blur()` Safari compositing behaviour with fixed-position overlays (MEDIUM confidence — known browser quirk, but exact reproduction not verified against this specific background stack)
- Prisma client browser error — "PrismaClient is not supported in the browser" (HIGH confidence — reproducible error, well-documented in Next.js / Prisma community)
