# Architecture Patterns

**Domain:** Marketing landing page + interactive demo — integrated into existing Next.js App Router app
**Researched:** 2026-03-13
**Confidence:** HIGH — based on direct codebase inspection of all relevant files

---

## Context

This is a subsequent milestone on a live app. The existing `app/page.tsx` is a server component that already handles the logged-in/logged-out split via `getSessionDM()`. The task is to replace the sparse logged-out view with a full marketing page while leaving the logged-in redirect and the rest of the app (campaigns, join, auth) entirely untouched.

Existing tech: Next.js 16, React 19, Tailwind CSS 4, App Router. No animation library is currently installed. `WeeklySchedule` and `AvailabilityCalendar` are already pure controlled client components — they accept all state via props and fire callbacks, with no server action coupling.

---

## Recommended Architecture

### Component Boundaries Overview

```
app/page.tsx                              ← Server Component (auth check only — unchanged role)
  └─ getSessionDM() → if DM: redirect('/campaigns')
  └─ <LandingPage />                      ← new "use client" root for all marketing UI

src/components/landing/
  ├─ LandingPage.tsx                      ← "use client" — assembles all sections
  ├─ StickyNav.tsx                        ← "use client" — scroll detection, background transition
  ├─ HeroSection.tsx                      ← static JSX (child of client tree, no own state)
  ├─ FeaturesBlock.tsx                    ← "use client" — step-selector useState
  ├─ AvailabilityDemoWidget.tsx           ← "use client" — self-contained mock, no server actions
  ├─ EasyForPlayersSection.tsx            ← static JSX + embeds AvailabilityDemoWidget
  ├─ FinalCTASection.tsx                  ← static JSX
  └─ ScrollReveal.tsx                     ← "use client" — IntersectionObserver entrance wrapper
```

---

## Question 1: Logged-Out Home Page Coexisting with Logged-In Redirect

**Pattern: Keep `app/page.tsx` as a thin server component. Replace the inline JSX with a single import.**

The current `app/page.tsx` already has the correct structure:

```tsx
// app/page.tsx — minimal change: replace inline JSX with LandingPage import
export default async function HomePage() {
  const dm = await getSessionDM()
  if (dm) redirect('/campaigns')
  return <LandingPage />
}
```

The server component is responsible for exactly one thing: check session, redirect if authenticated, otherwise render the landing page. `LandingPage` is a `"use client"` component. The redirect fires server-side before any HTML ships, so logged-in DMs see zero flash of the marketing page.

**Why not a separate route like `/marketing`?** The home route is the marketing page for logged-out users — a separate URL gives no UX benefit and confuses direct links. The server-side redirect-before-render pattern is the established Next.js pattern and matches what the existing code already does.

**Why `"use client"` for LandingPage?** The entire landing page requires:
- Scroll detection in `StickyNav`
- Step-selector `useState` in `FeaturesBlock`
- `IntersectionObserver` in `ScrollReveal`
- Demo interactivity in `AvailabilityDemoWidget`

Rather than scattering `"use client"` across every section individually, a single client boundary at `LandingPage` is cleaner. Server component performance benefits on a marketing page with no dynamic data are negligible — there is nothing to fetch server-side on this page.

---

## Question 2: Self-Contained Interactive Demo Component

**Pattern: `AvailabilityDemoWidget` — a new component that reuses the leaf UI components (`WeeklySchedule`, `AvailabilityCalendar`) with hardcoded mock data and no server action calls.**

The existing `AvailabilityForm` is tightly coupled to `saveWeeklyPattern` and `toggleDateOverride` server actions, and expects a real `playerSlotId`. It cannot be safely reused as a demo without modification. The correct approach is a new component that shares only the visual leaf components.

### Why This Works Without Changes to Leaf Components

`WeeklySchedule` and `AvailabilityCalendar` are already pure controlled components:

- `WeeklySchedule` accepts `selection: Set<string>` and `onChange: (s: Set<string>) => void` — it has no knowledge of server actions
- `AvailabilityCalendar` accepts `planningWindowStart`, `planningWindowEnd`, `weeklySelection`, `overrides`, and `onDateClick` — it has no knowledge of server actions

Both are already isolated from I/O at the component level. `AvailabilityForm` is the layer that connects them to server actions — the demo bypasses that layer entirely.

### Isolation Strategy

```
src/components/landing/AvailabilityDemoWidget.tsx
```

This component:
- Is `"use client"` (needs `useState` for interactive selection)
- Has **no props** — all data is module-level constants defined in the file
- Has **no server actions** — click handlers update local state only, no debounced saves, no `setSaveStatus`
- Reuses `WeeklySchedule` and `AvailabilityCalendar` unchanged
- Displays a "Demo — changes not saved" label to set expectations

### Mock Data Shape

```tsx
// Constants inside AvailabilityDemoWidget.tsx — no imports from lib/actions
const MOCK_WINDOW_START = '2026-04-01'
const MOCK_WINDOW_END   = '2026-05-31'

// Matches WeeklySchedule's expected format: Set of day-of-week number strings
const INITIAL_WEEKLY = new Set(['5', '6'])  // Fri + Sat pre-selected

// Matches AvailabilityCalendar's expected overrides format
const INITIAL_OVERRIDES = new Map<string, 'free' | 'busy'>([
  ['2026-04-12', 'busy'],   // one example override
])
```

The component maintains `weeklySelection` and `overrides` state with `useState`, and the click handlers call `setWeeklySelection` / `setOverrides` directly — the same local logic as `AvailabilityForm` but without the network calls. Clicking days and dates works visually exactly as in the real form.

### What Does Not Change

| Component | Used by demo | Change needed |
|-----------|-------------|---------------|
| `WeeklySchedule.tsx` | Yes — rendered in demo | None |
| `AvailabilityCalendar.tsx` | Yes — rendered in demo | None |
| `lib/calendarUtils.ts` | Yes — used by AvailabilityCalendar | None |
| `AvailabilityForm.tsx` | Not used by demo | None |

---

## Question 3: Scroll-Triggered Animations in App Router

**Pattern: `IntersectionObserver` in a reusable `ScrollReveal` client wrapper component. No animation library needed.**

### Why No Library

No animation library is installed. The milestone requirement is "sections animate in smoothly on scroll" — standard fade-up entrance animations. This does not require Framer Motion or GSAP. The `IntersectionObserver` API is baseline-supported (all modern browsers since 2018) and can be wrapped in ~25 lines.

### ScrollReveal Component

```tsx
// src/components/landing/ScrollReveal.tsx
'use client'
import { useRef, useEffect, useState } from 'react'

export function ScrollReveal({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()  // fire once — sections do not re-animate on scroll-up
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
```

Each marketing section is wrapped in `<ScrollReveal>`. The observer disconnects after first trigger — this prevents re-animation on scroll-up and also frees the observer from watching elements that are already visible.

### Server vs Client Component Split for Animations

`LandingPage` is `"use client"`, so all components in the landing subtree can freely use client features. `ScrollReveal` must be `"use client"` because it uses `useRef`, `useState`, and `useEffect`. Section components like `HeroSection` and `FinalCTASection` do not need their own `"use client"` boundary unless they have state — as children of a client component, React renders them in the client bundle automatically. Where a section has its own interactivity (e.g. `FeaturesBlock` step-selector), mark it `"use client"` explicitly for clarity.

---

## Question 4: Sticky Nav with Scroll Detection

**Pattern: `useEffect` scroll listener inside `StickyNav` component. No library needed.**

```tsx
// src/components/landing/StickyNav.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export function StickyNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'bg-[#140326]/90 backdrop-blur-sm border-b border-[var(--dnd-border-muted)]'
          : 'bg-transparent'
      }`}
    >
      {/* logo, Beta badge, Sign up / Log in links */}
    </nav>
  )
}
```

`{ passive: true }` is required on the scroll listener — it tells the browser the handler will not call `preventDefault()`, enabling scroll optimisations on mobile. The background transition is CSS `transition-colors` on the nav element; the class swap drives the visual change with no JS animation loop.

The `StickyNav` is rendered inside `LandingPage` only — it does not live in `app/layout.tsx` and therefore does not appear on campaigns, auth, or player pages.

---

## Component Inventory

### New Components (create)

| Component | Location | Type | Purpose |
|-----------|----------|------|---------|
| `LandingPage` | `src/components/landing/LandingPage.tsx` | `"use client"` | Root marketing page wrapper — assembles all sections |
| `StickyNav` | `src/components/landing/StickyNav.tsx` | `"use client"` | Scroll-aware navigation bar |
| `HeroSection` | `src/components/landing/HeroSection.tsx` | (child of client tree) | Hero heading, subtitle, CTA buttons |
| `FeaturesBlock` | `src/components/landing/FeaturesBlock.tsx` | `"use client"` | Step-selector with expanding descriptions and image swap |
| `AvailabilityDemoWidget` | `src/components/landing/AvailabilityDemoWidget.tsx` | `"use client"` | Self-contained mock availability form, no server actions |
| `EasyForPlayersSection` | `src/components/landing/EasyForPlayersSection.tsx` | (child of client tree) | 3-card player onboarding grid + second demo embed |
| `FinalCTASection` | `src/components/landing/FinalCTASection.tsx` | (child of client tree) | Final CTA heading and Sign up / Log in buttons |
| `ScrollReveal` | `src/components/landing/ScrollReveal.tsx` | `"use client"` | Reusable viewport entrance animation wrapper |

### Modified Components

| Component | Change | Risk |
|-----------|--------|------|
| `app/page.tsx` | Replace inline JSX with `<LandingPage />` after the auth check | Very low — one-line swap, auth logic untouched |

### Unchanged Components (reused by demo)

| Component | Used by | Notes |
|-----------|---------|-------|
| `WeeklySchedule.tsx` | `AvailabilityDemoWidget` | Zero changes — already a pure controlled component |
| `AvailabilityCalendar.tsx` | `AvailabilityDemoWidget` | Zero changes — already a pure controlled component |
| `lib/calendarUtils.ts` | `AvailabilityCalendar` | Zero changes |

All other existing components (`CampaignTabs`, `AvailabilityForm`, `DashboardCalendar`, auth pages, etc.) are completely untouched by this milestone.

---

## Data Flow

### Landing Page (no data)

```
HTTP GET /
  → Server Component: getSessionDM() [reads httpOnly cookie, queries DB]
    → Authenticated DM: redirect('/campaigns') — no HTML rendered
    → Logged-out visitor: return <LandingPage />
      → LandingPage: static JSX + local component state only
        → No DB calls, no API calls, no props drilled from server
```

### Demo Component (pure local state, no network)

```
AvailabilityDemoWidget (client)
  ├─ MOCK_WINDOW_START / MOCK_WINDOW_END  ← module-level constants
  ├─ useState(INITIAL_WEEKLY)             → weeklySelection
  ├─ useState(INITIAL_OVERRIDES)          → overrides
  ├─ <WeeklySchedule>                     ← receives weeklySelection, calls setWeeklySelection
  └─ <AvailabilityCalendar>               ← receives all four props, calls setOverrides
       No network I/O at any point in the tree
```

---

## Build Order

Build order follows component dependency: leaf components before sections, sections before the page root.

| Step | Component | Dependency | Notes |
|------|-----------|------------|-------|
| 1 | `ScrollReveal` | None | Needed by all sections — build first |
| 2 | `AvailabilityDemoWidget` | `WeeklySchedule`, `AvailabilityCalendar` (exist) | Build early to confirm demo isolation before surrounding content |
| 3 | `StickyNav` | None | Standalone, no section deps |
| 4 | `HeroSection` | `ScrollReveal` | Static content — straightforward |
| 5 | `FeaturesBlock` | `ScrollReveal` | Step-selector state, placeholder images |
| 6 | `EasyForPlayersSection` | `AvailabilityDemoWidget`, `ScrollReveal` | Depends on demo being done |
| 7 | `FinalCTASection` | `ScrollReveal` | Static content — straightforward |
| 8 | `LandingPage` | All sections above | Assembles and sequences all sections |
| 9 | `app/page.tsx` | `LandingPage` | One-line swap — do last |

---

## Scalability Considerations

| Concern | Now | If page grows |
|---------|-----|---------------|
| Bundle size | All landing components in one client subtree — appropriate for a single marketing page | If multiple marketing pages added, extract to a `(marketing)` route group with its own layout |
| Demo complexity | Hardcoded mock data is correct | If an animated walkthrough is needed, add a `step` state to `AvailabilityDemoWidget` only — does not affect other components |
| Animations | CSS transitions via `ScrollReveal` | If spring physics or stagger effects are needed later, add Framer Motion at that point — it is additive |
| Nav scope | `StickyNav` is inside `LandingPage` only | No leakage to other pages — correct isolation |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Adding `StickyNav` to `app/layout.tsx`

**What:** Placing the marketing nav in the root layout so it appears globally.

**Why bad:** The campaigns page, auth pages, and player availability pages have their own standalone layouts. A marketing nav on those pages is wrong UX. The root layout in this app is intentionally minimal — it has no nav, no providers, and should stay that way.

**Instead:** `StickyNav` lives inside `LandingPage`, which renders only for logged-out visitors on the `/` route.

### Anti-Pattern 2: Modifying `AvailabilityForm` with a `demoMode` Prop

**What:** Adding `demoMode?: boolean` to `AvailabilityForm` and short-circuiting server action calls inside it.

**Why bad:** Pollutes a working production component with demo concerns. Introduces risk of accidentally shipping a form that silently skips saves. Adds conditional logic that is hard to audit.

**Instead:** `AvailabilityDemoWidget` is a separate component that reuses the pure leaf components (`WeeklySchedule`, `AvailabilityCalendar`) without touching `AvailabilityForm`.

### Anti-Pattern 3: Scroll Event Without `{ passive: true }`

**What:** `window.addEventListener('scroll', handler)` without the passive option.

**Why bad:** Without `passive: true`, the browser must wait to see if the handler calls `preventDefault()` before processing scroll events. This blocks the browser's compositor thread and causes jank on mobile.

**Instead:** Always pass `{ passive: true }` for scroll listeners that do not prevent default.

### Anti-Pattern 4: Directly Mutating DOM Classes in `useEffect` for Animations

**What:** Using `element.classList.add('visible')` inside `useEffect` instead of React state.

**Why bad:** Bypasses React's reconciler, can cause hydration mismatches (server renders without the class, client adds it directly), and makes the animation state invisible to React DevTools.

**Instead:** `ScrollReveal` uses `useState(false)` → `setVisible(true)` and Tailwind classes derived from that state. React owns the DOM.

### Anti-Pattern 5: Putting Demo in the Actual Join Route

**What:** Rendering the demo by visiting `/join/demo-token` with a seeded placeholder campaign.

**Why bad:** Requires a real DB record, a real join token, a real cookie, and real server actions that must be no-ops in demo mode. Complex to implement, complex to maintain, creates fake data in production.

**Instead:** `AvailabilityDemoWidget` is a completely self-contained React component with no routing, no cookies, and no DB involvement.

---

## Sources

- Direct inspection of `src/app/page.tsx` — confirmed current auth check + redirect pattern
- Direct inspection of `src/app/layout.tsx` — confirmed minimal server component, no nav, no providers
- Direct inspection of `src/components/AvailabilityForm.tsx` — confirmed server action coupling and `playerSlotId` dependency
- Direct inspection of `src/components/WeeklySchedule.tsx` — confirmed pure controlled component with zero server coupling
- Direct inspection of `src/components/AvailabilityCalendar.tsx` — confirmed pure controlled component with zero server coupling
- Direct inspection of `src/app/join/[joinToken]/availability/page.tsx` — confirmed data serialisation pattern and prop shape passed to `AvailabilityForm`
- Direct inspection of `src/app/globals.css` — confirmed design tokens for landing page styling
- `package.json` reviewed — confirmed no animation library installed; `use-debounce` is the only non-framework dependency
- `IntersectionObserver` API: HIGH confidence, baseline browser API, MDN documented, no library dependency required
- Scroll `{ passive: true }`: established web platform best practice, MDN documented
