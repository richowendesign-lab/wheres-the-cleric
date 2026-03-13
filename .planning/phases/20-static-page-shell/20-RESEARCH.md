# Phase 20: Static Page Shell - Research

**Researched:** 2026-03-13
**Domain:** Next.js 16 / React 19 / Tailwind CSS 4 — static marketing landing page with Server Component auth guard
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Content Copy:** All copy is verbatim from the Figma design file. Do not substitute or paraphrase.

- Hero heading: `schedule your next D&D Session`
- Hero subtitle: `Beat the final boss - scheduling - and coordinate your group's availability without the back-and-forth.`
- Hero CTAs: Sign up (filled `#ba7df6`), Log in (outlined `#ba7df6`)
- Features heading: `Simple scheduling for your next game`
- Features subtitle: `No more manually creating polls. No more back and forth. Simply create a campaign, share the link, and let your players tell you when they're free, leaving you to focus on practicing your accents for that new NPC.`
- Step 1: "Create and share your campaign" / "Fill in basic details, set a planning window and share the link with players"
- Step 2: "Players mark their availability" / "Everyone sets their free days — you see it live on the calendar."
- Step 3: "Add your unavailable dates" / "Block dates when you cannot run a session in the Settings tab."
- Step 4: "Pick the best day" / "The ranked list shows which days work for everyone - copy it to your group chat."
- Players heading: `Easy for players`
- Player card 1: "Your DM will share a link with you" / "Fill in your name and you're ready to go."
- Player card 2: "Input what days you are free to play" / "You'll be able to select any day in the planning window"
- Player card 3: "That's literally it - you don't even need to save" / "Your availability will show on your DM's dashboard"
- CTA heading: `Ready to plan your next adventure?`
- CTA buttons: Sign up (filled), Log in (outlined)
- Footer: `© Copyright 2026 - Rich Owen Design` in `var(--dnd-text-muted)` (`#a19aa8`)

**Sticky Nav:**
- Full viewport width with horizontal padding; not constrained to content `max-w`
- Left: SVG logo (download from Figma, save to `/public/logo.svg`) + Beta badge (existing style)
- Right: Sign up + Log in buttons — rendered hidden by default (`opacity-0 pointer-events-none` or `hidden`); scroll-reveal deferred to Phase 24
- No HowItWorksButton in the nav
- `<header>` with `position: sticky; top: 0; z-index: 50`
- Background: transparent in Phase 20; scroll-triggered dark background deferred to Phase 24

**FeaturesBlock (Static Shell):**
- Step 1 active by default — full visual distinction coded in Phase 20 (not deferred)
- Active step (step 1): number badge uses `var(--dnd-border-card)` (`#572182`) bg with white text; description paragraph visible
- Inactive steps (2, 3, 4): number badge uses `var(--dnd-accent)` (`#ba7df6`) bg with black text; no description paragraph
- Right column: 308×308px image area showing step 1 illustration as static `<img src="/features-step-1.png" />`
- Phase 22 adds click interactivity on top of this static foundation

**Illustration assets — all 4 saved to `/public` in Phase 20:**
- `/public/features-step-1.png` — scroll/map with magnifying glass
- `/public/features-step-2.png` — quill/feather pen on parchment
- `/public/features-step-3.png` — sleeping wizard with spellbook
- `/public/features-step-4.png` — adventurer party

**Section Backgrounds:**
- All sections sit transparently on the global radial gradient in `globals.css`
- No per-section background overrides; no alternating section colors

**Component Structure:**
- `page.tsx` — Server Component; auth guard first lines; imports and renders `<LandingPage />`
- `src/components/LandingPage.tsx` — `'use client'` boundary; renders all sections
- Sections can be co-located in `LandingPage.tsx` or split into `src/components/landing/` — planner's discretion

**Auth pattern (must preserve):**
```ts
const dm = await getSessionDM()
if (dm) redirect('/campaigns')
```

**Hero and "Easy for players" screenshot placeholders:** Static `<img>` at 672×329px in a rounded card with box shadow. Phase 23 replaces with interactive demos.

**Figma SVG logo:** Must be downloaded from Figma asset URL and saved to `/public/logo.svg`.

### Claude's Discretion

- Whether to split sections into `src/components/landing/` sub-components or keep them co-located in `LandingPage.tsx` (decide based on file size)
- Whether to make `StickyNav` a separate client component from the start, or keep inline in `LandingPage.tsx` (either is fine — just ensure `'use client'` boundary is at or above nav level)

### Deferred Ideas (OUT OF SCOPE)

- **Phase 21:** Scroll-triggered section entrance animations (IntersectionObserver + CSS transitions)
- **Phase 22:** FeaturesBlock click interactivity — highlight, description expand, image swap
- **Phase 23:** Interactive demo embeds
- **Phase 24:** Nav scroll behavior — background transitions to dark opaque; nav CTA buttons revealed on scroll past hero CTAs
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NAV-01 | Visitor sees a sticky nav with the app logo, "Beta" badge, and Sign up / Log in buttons on every page scroll position | Server/Client component boundary pattern; sticky positioning with Tailwind; existing Beta badge styles from `page.tsx` |
| HERO-01 | Visitor sees a hero section with the app icon, large heading, subtitle copy, and Sign up / Log in CTA buttons | Existing button and icon patterns from `page.tsx`; `font-fantasy` Cinzel heading; `/public/dnd-icon.png` at 82×82px |
| FEAT-01 | Visitor sees a "Simple scheduling for your next game" section with descriptive copy | Static HTML structure; active/inactive step badge logic; `<img>` for step 1 illustration |
| FEAT-03 | Step 1 is active by default on page load | Static markup — no JS needed in Phase 20; active state is hard-coded via CSS classes |
| PLAY-01 | Visitor sees an "Easy for players" section with a 3-card grid explaining the player onboarding flow | Card styles from `HowItWorksModal.tsx`; 3-column grid; 672×329px static screenshot placeholder |
| CTA-01 | Visitor sees a final "Ready to plan your next adventure?" section with Sign up / Log in buttons | Same button styles as hero; reuses existing patterns |
| CTA-02 | Visitor sees a footer with copyright text | One-line `<footer>` with `text-[var(--dnd-text-muted)]` |
| INT-01 | Logged-in DMs visiting `/` are still redirected to `/campaigns` — landing page renders only for logged-out visitors | Auth guard must be first lines of `page.tsx` Server Component — pattern already exists |
</phase_requirements>

---

## Summary

Phase 20 is a pure UI build — no new dependencies, no new API routes, no schema changes. The work is entirely replacing the current minimal `page.tsx` centred layout with a full marketing landing page consisting of five sections (Nav, Hero, Features, Easy for Players, CTA + Footer). The codebase is Next.js 16 / React 19 / Tailwind CSS 4.

The critical architectural constraint is that `page.tsx` must remain a Server Component to preserve the `getSessionDM()` auth redirect. All interactive/stateful markup goes into a `LandingPage` client component. In Phase 20 all interactivity is deferred — the FeaturesBlock is purely static HTML with step 1 visually active via hard-coded CSS classes.

The logo SVG must be fetched from Figma and persisted to `/public/logo.svg`. The four illustration PNGs are provided by the user in the conversation and must be saved to `/public/features-step-1.png` through `features-step-4.png`. No new npm packages are needed.

**Primary recommendation:** Build the full static HTML structure first (page.tsx → LandingPage.tsx → section components), wire in all Figma copy verbatim, handle the logo/image asset saves as a separate early task, then verify the auth redirect is still intact.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 (pinned) | Routing, Server Components, image optimisation | Already in use; `page.tsx` pattern established |
| React | 19.2.3 (pinned) | Client components, hooks | Already in use |
| Tailwind CSS | ^4 | Utility-first styling | Already in use; all tokens in `globals.css` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/image | (built-in) | Optimised `<Image>` | For the dnd-icon.png 82×82px (existing pattern); NOT for illustration PNGs where plain `<img>` is specified |
| next/link | (built-in) | Client-side navigation for CTAs | All Sign up / Log in button links |
| next/font/google | (built-in) | Cinzel + Inter font loading | Already configured in layout.tsx; `font-fantasy` class available |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain `<img>` for feature illustrations | `next/image` | CONTEXT.md explicitly specifies `<img src="/features-step-1.png" />` — keep plain img |
| Co-located sections in LandingPage.tsx | `src/components/landing/` sub-components | Sub-components preferred if LandingPage.tsx exceeds ~200 lines; planner decides |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── page.tsx                     # Server Component — auth guard + renders <LandingPage />
├── components/
│   ├── LandingPage.tsx              # 'use client' — all landing sections
│   └── landing/                     # Optional sub-components if LandingPage grows large
│       ├── StickyNav.tsx            # header sticky nav (could be inline)
│       ├── HeroSection.tsx
│       ├── FeaturesBlock.tsx
│       ├── PlayersSection.tsx
│       └── CtaSection.tsx
public/
├── logo.svg                         # Download from Figma in Wave 1
├── features-step-1.png              # Save from conversation attachments
├── features-step-2.png
├── features-step-3.png
└── features-step-4.png
```

### Pattern 1: Server Component Auth Guard with Client Boundary

**What:** `page.tsx` stays async Server Component. First two lines check session and redirect. Then renders a single `'use client'` child component containing all landing markup.

**When to use:** Any Next.js page that needs server-side auth guard AND client-side interactivity in later phases.

**Example:**
```typescript
// src/app/page.tsx — Server Component
import { redirect } from 'next/navigation'
import { getSessionDM } from '@/lib/auth'
import { LandingPage } from '@/components/LandingPage'

export default async function HomePage() {
  const dm = await getSessionDM()
  if (dm) redirect('/campaigns')
  return <LandingPage />
}
```

```typescript
// src/components/LandingPage.tsx — Client boundary
'use client'

export function LandingPage() {
  return (
    <>
      <StickyNav />
      <HeroSection />
      <FeaturesBlock />
      <PlayersSection />
      <CtaSection />
      <Footer />
    </>
  )
}
```

### Pattern 2: Sticky Nav with Hidden Buttons

**What:** Nav rendered at full page width, transparent background, buttons present in DOM but visually hidden. Avoids layout shift in Phase 24 when scroll-reveal is added.

**When to use:** Phase 20 — static shell. Phase 24 will add scroll event logic on top.

**Example:**
```typescript
// Sticky nav — buttons hidden, ready for Phase 24 scroll-reveal
<header className="fixed top-0 left-0 right-0 z-50 px-8 py-4 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <img src="/logo.svg" alt="Where's the Cleric?" className="h-8 w-auto" />
    <span className="text-xs font-semibold bg-[#ba7df6]/20 text-[var(--dnd-accent)] border border-[#ba7df6]/40 rounded px-2 py-0.5">
      Beta
    </span>
  </div>
  <div className="flex gap-3 opacity-0 pointer-events-none">
    <Link href="/auth/signup" className="px-6 py-3 rounded bg-[var(--dnd-accent)] text-black font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors">
      Sign up
    </Link>
    <Link href="/auth/login" className="px-6 py-3 rounded border border-[var(--dnd-accent)] text-[var(--dnd-accent)] font-semibold hover:bg-[#ba7df6]/10 transition-colors">
      Log in
    </Link>
  </div>
</header>
```

### Pattern 3: FeaturesBlock Static Active State

**What:** Step 1 active state is hard-coded in markup, not driven by state. This is the Phase 20 static foundation. Phase 22 converts it to a `useState`-driven list.

**When to use:** Phase 20 only. Do not add `useState` to manage active step — that is Phase 22's job.

**Example:**
```typescript
// Step 1 — active (hard-coded)
<div className="flex items-start gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-4 py-3">
  <span className="w-7 h-7 rounded-full bg-[#572182] text-white flex items-center justify-center text-sm font-bold shrink-0">
    1
  </span>
  <div>
    <p className="font-semibold text-white">Create and share your campaign</p>
    <p className="text-[var(--dnd-text-muted)] mt-1">Fill in basic details, set a planning window and share the link with players</p>
  </div>
</div>

// Steps 2–4 — inactive (hard-coded)
<div className="flex items-start gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-4 py-3 opacity-60">
  <span className="w-7 h-7 rounded-full bg-[#ba7df6] text-black flex items-center justify-center text-sm font-bold shrink-0">
    2
  </span>
  <div>
    <p className="font-semibold text-white">Players mark their availability</p>
    {/* No description paragraph on inactive steps */}
  </div>
</div>
```

### Pattern 4: Screenshot Placeholder Cards

**What:** Static `<img>` inside a rounded card with box shadow at 672×329px. Phase 23 replaces with interactive demo components — the card shell stays.

**Example:**
```typescript
<div className="rounded-xl overflow-hidden shadow-2xl border border-[#ba7df6]/20 max-w-[672px] mx-auto">
  <img
    src="/hero-screenshot.png"
    alt="DM dashboard preview"
    width={672}
    height={329}
    className="w-full h-auto"
  />
</div>
```

Note: The screenshot images themselves (`hero-screenshot.png`, `players-screenshot.png`) need to be provided or captured before Phase 20 execution. The CONTEXT.md says "user provides" — confirm assets are in the conversation at execution time.

### Anti-Patterns to Avoid

- **Adding `'use client'` to `page.tsx`:** Breaks the Server Component auth guard — `getSessionDM()` and `redirect()` require server context.
- **Using `next/image` for the feature illustration PNGs:** CONTEXT.md specifies `<img src="/features-step-N.png" />` — keep plain `<img>` for Phase 22 compatibility.
- **Adding `useState` for features step:** Phase 20 is static — hard-code step 1 active. Phase 22 adds interactivity.
- **Adding scroll event listeners in Phase 20:** Nav scroll behavior is Phase 24. Only add the hidden buttons placeholder now.
- **Wrapping content in a constrained `max-w` container for the nav:** Nav is full viewport width.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Client-side routing for CTAs | Custom `<a onClick>` navigation | `next/link` | Prefetching, client-side transitions, a11y |
| Font loading | Manual `@font-face` CSS | `next/font/google` (already configured) | Font already loaded via Cinzel in layout.tsx; just use `font-fantasy` class |
| Image optimisation for hero icon | Raw `<img>` | `next/image` for dnd-icon.png | Already the existing pattern in page.tsx |
| Auth check | Re-implementing session logic | `getSessionDM()` (already exists) | Established pattern across 19 phases |

**Key insight:** Zero new dependencies for this phase. Everything needed is already in the project.

---

## Common Pitfalls

### Pitfall 1: Logo SVG Fetch Timing
**What goes wrong:** Planner assumes the logo SVG file exists at `/public/logo.svg` before execution begins — it does not. It must be downloaded from the Figma export URL during the task.
**Why it happens:** CONTEXT.md notes "download from Figma asset URL" — this is an execution step, not a pre-existing asset.
**How to avoid:** Make "download/save logo.svg to /public/" an explicit first task (Wave 1, before any component work that references `<img src="/logo.svg">`).
**Warning signs:** Dev server shows broken logo image; `ls /public/logo.svg` returns nothing.

### Pitfall 2: Hero/Players Screenshot Placeholders Missing
**What goes wrong:** The hero section and Easy for Players section each need a 672×329px screenshot image. These are not in `/public` yet.
**Why it happens:** They are described as "user-provided in conversation" for Phase 20 execution — they are not pre-existing assets.
**How to avoid:** Either treat these as "to be created" (blank placeholder or solid-colour div) or confirm user provides actual screenshot PNGs. The planner should create a task that handles the missing asset gracefully (e.g., a grey placeholder `div` styled to the correct dimensions until real images arrive).
**Warning signs:** Missing image broken icon in hero and players sections.

### Pitfall 3: Tailwind CSS 4 `@theme` vs `theme.extend`
**What goes wrong:** Adding custom Tailwind classes using the old `tailwind.config.js` `theme.extend` syntax — doesn't work in Tailwind CSS 4.
**Why it happens:** Tailwind CSS 4 uses CSS-based configuration via `@theme` in `globals.css`, not a JS config file.
**How to avoid:** All custom tokens already defined in `globals.css` `@theme` and `:root`. Use existing CSS variables (`var(--dnd-accent)`) via arbitrary values (`text-[var(--dnd-accent)]`) or add new tokens to `globals.css` if needed.
**Warning signs:** Custom class not applying; `tailwind.config.js` not found errors.

### Pitfall 4: `next/image` vs `<img>` for Feature Illustrations
**What goes wrong:** Using `<Image>` component (next/image) for the step illustrations, which then Phase 22 has to change because `<img>` was specified.
**Why it happens:** Next.js encourages `<Image>` for all images, but CONTEXT.md explicitly specifies `<img src="/features-step-1.png" />`.
**How to avoid:** Use plain `<img>` for all four feature illustrations. Use `next/image` only for `/public/dnd-icon.png` in the hero (consistent with existing page.tsx pattern).

### Pitfall 5: Sticky vs Fixed Positioning for Nav
**What goes wrong:** Using `position: fixed` instead of `position: sticky` causes the page content to start at y=0 under the nav rather than after it.
**Why it happens:** CONTEXT.md says `position: sticky; top: 0` but developers often default to `fixed` for navs.
**How to avoid:** Use `sticky top-0 z-50` Tailwind classes (maps to `position: sticky; top: 0; z-index: 50`). Add `pt-[nav-height]` to the first section if sticky causes overlap — or use `fixed` + body padding-top if sticky doesn't work as expected for full-page scroll.
**Warning signs:** Hero content hidden under the nav; nav scrolling away with the page.

### Pitfall 6: HowItWorksButton Left in page.tsx
**What goes wrong:** The existing `page.tsx` imports and renders `<HowItWorksButton />`. The new landing page explicitly excludes it from the nav. Forgetting to remove it.
**Why it happens:** Current page.tsx has it; it's easy to copy existing JSX.
**How to avoid:** The task replacing page.tsx content should explicitly NOT carry over the HowItWorksButton import/render.

---

## Code Examples

Verified patterns from existing codebase:

### Existing Button Styles (from page.tsx)
```typescript
// Filled button (Sign up)
className="px-6 py-3 rounded bg-[var(--dnd-accent)] text-black font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors"

// Outlined button (Log in)
className="px-6 py-3 rounded border border-[var(--dnd-accent)] text-[var(--dnd-accent)] font-semibold hover:bg-[#ba7df6]/10 transition-colors"
```

### Existing Beta Badge (from page.tsx)
```typescript
<span className="text-xs font-semibold bg-[#ba7df6]/20 text-[var(--dnd-accent)] border border-[#ba7df6]/40 rounded px-2 py-0.5 translate-y-[-2px]">
  Beta
</span>
```

### Existing Card Style (from HowItWorksModal.tsx)
```typescript
// Card container
className="flex items-start gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-4 py-3"
```

### Existing Design Tokens (globals.css)
```css
--dnd-accent:           #ba7df6;   /* primary purple */
--dnd-accent-hover:     #c994f8;   /* button hover */
--dnd-card-bg:          rgba(20, 3, 38, 0.6);
--dnd-border-card:      #572182;   /* active step badge bg */
--dnd-text-muted:       #a19aa8;   /* footer text, secondary */
```

### Fantasy Font Heading
```typescript
// Uses Cinzel via font-fantasy class (set up in layout.tsx)
<h1 className="font-fantasy text-4xl text-white">schedule your next D&amp;D Session</h1>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` theme extension | `@theme {}` in CSS (`globals.css`) | Tailwind CSS 4 | Don't add a config file — extend tokens in globals.css |
| `pages/` directory routing | `app/` directory, Server Components | Next.js 13+ | `page.tsx` is already App Router — maintain that pattern |
| `getServerSideProps` for auth | Server Component + `redirect()` from `next/navigation` | Next.js 13+ | Pattern already established across 19 phases |

**Deprecated/outdated:**
- `pages/_app.tsx` global layout: replaced by `app/layout.tsx` — already using new pattern.
- `next/head` for metadata: replaced by `export const metadata` in `layout.tsx` — already using new pattern.

---

## Open Questions

1. **Hero and Players section screenshot placeholder images**
   - What we know: CONTEXT.md says "672×329px rounded card with box shadow" and "static screenshot images in Phase 20"
   - What's unclear: Whether the user will provide actual screenshot PNG files during execution, or whether a placeholder div/colour block is acceptable for Phase 20
   - Recommendation: Planner should create a task that implements the card shell with a styled placeholder `div` (e.g., `bg-[var(--dnd-card-bg)] border border-[#ba7df6]/20 rounded-xl w-[672px] h-[329px]`) as a safe default. If the user has actual screenshots ready, they can be dropped into `/public` and the `src` attr added.

2. **Figma SVG logo — exact export URL**
   - What we know: CONTEXT.md says "download from Figma, save to `/public/logo.svg`"
   - What's unclear: The exact Figma asset export URL for the logo SVG is not in CONTEXT.md or REQUIREMENTS.md
   - Recommendation: The execution task should prompt the user to provide the Figma asset download URL or exported SVG file, OR attempt to access the Figma design link provided in CONTEXT.md (`https://www.figma.com/design/DkkUL0pVfYBOt7txFselZv/My-Portfolio-—-UI-Capture?node-id=90-2`) via the browser export flow.

3. **Nav `position: sticky` vs `fixed` with page layout**
   - What we know: CONTEXT.md specifies `position: sticky; top: 0`. In Next.js App Router, the `<body>` has a `pointer-events-none fixed` background overlay and a `relative` wrapper div.
   - What's unclear: Whether `sticky` positioning on a `<header>` inside the relative wrapper will behave as expected when sections extend to full page height
   - Recommendation: Start with `sticky top-0 z-50`. If the sticky nav scrolls away (common when parent has `overflow: hidden` or `height: auto`), switch to `fixed top-0` + add `pt-16` (or equivalent nav height) to the hero section. Verify during first dev server run.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase — `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, `src/components/HowItWorksModal.tsx` — directly inspected
- `.planning/phases/20-static-page-shell/CONTEXT.md` — user decisions, verbatim copy, component structure decisions
- `package.json` — confirmed exact versions: Next.js 16.1.6, React 19.2.3, Tailwind CSS ^4

### Secondary (MEDIUM confidence)
- Next.js App Router documentation patterns — Server Component + `redirect()` pattern verified against existing phase implementations across Phases 8–19

### Tertiary (LOW confidence)
- Tailwind CSS 4 `@theme` configuration approach — inferred from existing `globals.css` structure; specific Tailwind 4 docs not fetched via Context7 (existing project usage provides sufficient signal)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries pinned in package.json, directly inspected
- Architecture: HIGH — Server Component + client boundary pattern established across 19 prior phases, CONTEXT.md is prescriptive
- Pitfalls: HIGH for auth/component boundary pitfalls (known from codebase); MEDIUM for logo/image asset availability (execution-time concern)

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable framework versions, no fast-moving dependencies)
