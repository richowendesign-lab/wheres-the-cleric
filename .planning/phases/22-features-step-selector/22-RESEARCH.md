# Phase 22: Features Step-Selector - Research

**Researched:** 2026-03-13
**Domain:** React useState, Tailwind CSS conditional classes — interactive step-selector within existing 'use client' component
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FEAT-02 | Visitor can click any of the 4 step cards; the selected step is highlighted, its description text expands, and a paired illustration image is shown | useState for activeStep index; conditional Tailwind classes for badge colour + opacity; conditional description paragraph render; dynamic img src derived from activeStep |
</phase_requirements>

---

## Summary

Phase 22 is a minimal interactivity layer added on top of the static FeaturesBlock.tsx shell built in Phase 20. The component is already `'use client'` and already in the correct file (`src/components/landing/FeaturesBlock.tsx`). The only work is: introduce one `useState<number>` hook for the active step index, convert the four hard-coded step cards into a data-driven array map, and derive badge colour, opacity, description visibility, and illustration image src from that index.

No new dependencies, no new files, no new hooks, no new API routes. The four illustration PNGs are already in `/public`. The step copy is already defined in Phase 20 CONTEXT.md. The only code change is inside `FeaturesBlock.tsx`.

**Primary recommendation:** Add `useState(1)` for activeStep (1-indexed, matching the existing badge numbers). Replace the four hard-coded card divs with a `steps.map(...)` loop. Derive all visual differences from `activeStep === step.id`. Swap the illustration `src` via template literal `/features-step-${activeStep}.png`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 (pinned) | `useState` for active step index | Already in use; `FeaturesBlock.tsx` is already `'use client'` |
| Tailwind CSS | ^4 | Conditional utility classes for active/inactive states | Already in use; all design tokens in `globals.css` |

### Supporting

None required beyond what is already imported in `FeaturesBlock.tsx`.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useState` | `useReducer` | Overkill for a single integer — `useState` is correct here |
| Data-driven `steps.map()` | Four hard-coded divs with conditional classes | Map is cleaner and guarantees consistency; hard-coded is error-prone at 4 items |
| Template literal for img src | Four conditional `src` strings | Template literal `/features-step-${activeStep}.png` is direct and safe given the files are named consistently |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Component Structure

The entire change lives in one file:

```
src/components/landing/FeaturesBlock.tsx   # Only file modified
```

No new files. No new hooks. No new components.

### Pattern 1: Data-Driven Step Cards with useState

**What:** Define a `steps` array above the component (or inside — either works). Map over it to render each card. Derive active/inactive styles from `activeStep === step.id`.

**When to use:** Any time you have N items with shared structure where exactly one is "selected".

**Example:**

```typescript
// Source: React docs useState pattern + project globals.css tokens
'use client'

import { useState } from 'react'
import { useInView } from '@/hooks/useInView'

const steps = [
  { id: 1, title: 'Create and share your campaign', description: 'Fill in basic details, set a planning window and share the link with players' },
  { id: 2, title: 'Players mark their availability', description: 'Everyone sets their free days — you see it live on the calendar.' },
  { id: 3, title: 'Add your unavailable dates', description: 'Block dates when you cannot run a session in the Settings tab.' },
  { id: 4, title: 'Pick the best day', description: 'The ranked list shows which days work for everyone - copy it to your group chat.' },
]

export function FeaturesBlock() {
  const { ref, inView } = useInView({ threshold: 0.1 })
  const [activeStep, setActiveStep] = useState(1)

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className={[
      'px-8 py-16 max-w-[800px] mx-auto w-full',
      'transition-all duration-700 ease-out motion-reduce:transition-none',
      inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
    ].join(' ')}>
      {/* heading + subtitle unchanged */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="flex flex-col gap-4">
          {steps.map((step) => {
            const isActive = activeStep === step.id
            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={[
                  'flex items-start gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-4 py-3 cursor-pointer',
                  isActive ? '' : 'opacity-60',
                ].join(' ')}
              >
                <span className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                  isActive ? 'bg-[#572182] text-white' : 'bg-[#ba7df6] text-black',
                ].join(' ')}>
                  {step.id}
                </span>
                <div>
                  <p className="font-semibold text-white">{step.title}</p>
                  {isActive && (
                    <p className="text-[var(--dnd-text-muted)] mt-1 text-sm">{step.description}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-center">
          <img
            src={`/features-step-${activeStep}.png`}
            alt={`Step ${activeStep} illustration`}
            width={308}
            height={308}
            className="w-[308px] h-[308px] object-contain mx-auto"
          />
        </div>
      </div>
    </section>
  )
}
```

### Pattern 2: Active State Visual Tokens

The two visual states use existing design tokens from `globals.css`:

| State | Badge background | Badge text | Card opacity |
|-------|-----------------|------------|--------------|
| Active | `#572182` (= `var(--dnd-border-card)`) | `text-white` | `opacity-100` (no class) |
| Inactive | `#ba7df6` (= `var(--dnd-accent)`) | `text-black` | `opacity-60` |

These tokens match Phase 20's hard-coded static shell exactly — Phase 22 preserves visual parity on load.

### Anti-Patterns to Avoid

- **Adding CSS transitions to the description text reveal:** A `max-height` / `overflow-hidden` animated expand adds complexity with no design requirement. The success criteria says "expands its description text" — a conditional render (`{isActive && <p>...`) satisfies this without animation.
- **Using `next/image` (`<Image>`) for the illustration swap:** The existing static shell uses a plain `<img>`. Phase 20 RESEARCH explicitly warns against switching to `<Image>` here. Keep `<img>`.
- **Introducing a `useEffect` or `useRef` for the image swap:** The image src is purely derived from `activeStep` state — no side effects needed.
- **Keeping any hard-coded step divs alongside the map:** After the refactor, all four cards must come from the map. Mixing hard-coded and map-driven markup is a maintenance trap.
- **0-indexed step array with 1-indexed badge numbers:** Use 1-indexed `step.id` (1–4) to match the badge text and the image filename suffix. Avoid an off-by-one between `step.id` and the filename.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "Only one active at a time" exclusivity | Custom toggle/deactivate logic | `useState(1)` — setting activeStep to a new value implicitly deactivates all others | Single integer state guarantees mutual exclusivity with zero extra logic |
| Description visibility | CSS `display: none` + `display: block` toggling via refs | `{isActive && <p>...</p>}` conditional JSX render | React conditional render is idiomatic, zero-cost, and type-safe |
| Image swap | Preloading all 4 images and toggling visibility | Template literal `src={/features-step-${activeStep}.png}` | Browser caches images on first view; no preload logic needed for 308px PNGs |

**Key insight:** This entire feature is pure controlled component state. One `useState`, one map, one conditional class expression, one conditional JSX element. No library, no hook, no effect needed.

---

## Common Pitfalls

### Pitfall 1: Forgetting to Import useState

**What goes wrong:** `FeaturesBlock.tsx` currently only imports `useInView`. Adding the data-driven map without importing `useState` causes a runtime error.
**Why it happens:** `useInView` is a custom hook that wraps `useState` internally — the component itself has never needed to import `useState` directly.
**How to avoid:** Add `useState` to the React import: `import { useState } from 'react'`.
**Warning signs:** `ReferenceError: useState is not defined` in browser console.

### Pitfall 2: Losing the Existing Section Animation

**What goes wrong:** Rewriting the component JSX structure discards the `useInView` + `inView` conditional class logic on the `<section>` element, breaking the Phase 21 scroll animation.
**Why it happens:** The developer re-creates the structure from scratch rather than editing in place.
**How to avoid:** Keep the `useInView` import, `const { ref, inView } = useInView(...)`, `ref={ref as React.RefObject<HTMLElement>}`, and the three Tailwind transition classes on `<section>` untouched.
**Warning signs:** FeaturesBlock no longer fades in on scroll; section is permanently visible or permanently hidden.

### Pitfall 3: Breaking Step 1 Default Active State

**What goes wrong:** Initialising `useState(0)` (0-indexed) when the badge numbers and filename suffixes are 1-indexed — step 1 would not be highlighted on load, and the image src would resolve to `/features-step-0.png` (404).
**Why it happens:** JavaScript array convention is 0-indexed; the temptation is to match array index.
**How to avoid:** Use `useState(1)` and store `step.id` as 1–4 in the data array. The template literal `/features-step-${activeStep}.png` then always resolves correctly.
**Warning signs:** Step 1 appears inactive on load; broken image in right column.

### Pitfall 4: Making Step Cards Non-Clickable Due to Pointer Events

**What goes wrong:** The `opacity-60` inactive state class does not suppress pointer events, but if a parent element has `pointer-events-none` the click handlers never fire.
**Why it happens:** Phase 20 added `opacity-0 pointer-events-none` to the nav CTA buttons — a developer might cargo-cult this pattern onto the inactive step cards.
**How to avoid:** Do NOT add `pointer-events-none` to inactive step cards. `opacity-60` only affects visual rendering. All four cards must remain clickable.
**Warning signs:** Clicking inactive steps has no effect; no re-render on click.

### Pitfall 5: Step Copy Mismatch

**What goes wrong:** The `steps` array copy diverges from the Phase 20 CONTEXT.md verbatim copy, causing different descriptions than what was approved.
**Why it happens:** Developer paraphrases or edits copy from memory.
**How to avoid:** Copy descriptions verbatim from Phase 20 CONTEXT.md (the canonical source). The exact strings are:
- Step 1: "Fill in basic details, set a planning window and share the link with players"
- Step 2: "Everyone sets their free days — you see it live on the calendar."
- Step 3: "Block dates when you cannot run a session in the Settings tab."
- Step 4: "The ranked list shows which days work for everyone - copy it to your group chat."
**Warning signs:** Description text does not match Figma design.

---

## Code Examples

Verified patterns from existing codebase:

### Deriving Active Badge Classes (Tailwind conditional)

```typescript
// Source: existing phase 20 hard-coded markup in FeaturesBlock.tsx
const badgeClass = isActive
  ? 'bg-[#572182] text-white'     // active: dark purple bg, white text
  : 'bg-[#ba7df6] text-black'     // inactive: light purple bg, black text
```

### Deriving Card Opacity

```typescript
// Source: existing phase 20 hard-coded markup in FeaturesBlock.tsx
const cardClass = isActive ? '' : 'opacity-60'
```

### Dynamic Illustration Image Src

```typescript
// Template literal — resolves to /features-step-1.png through /features-step-4.png
<img
  src={`/features-step-${activeStep}.png`}
  alt={`Step ${activeStep} illustration`}
  width={308}
  height={308}
  className="w-[308px] h-[308px] object-contain mx-auto"
/>
```

### Conditional Description Render

```typescript
// Only render description paragraph for the active step
{isActive && (
  <p className="text-[var(--dnd-text-muted)] mt-1 text-sm">{step.description}</p>
)}
```

### Click Handler on Card Div

```typescript
// onClick on the outer card div — entire card is clickable
<div
  key={step.id}
  onClick={() => setActiveStep(step.id)}
  className={['...', isActive ? '' : 'opacity-60'].join(' ')}
>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard-coded static HTML (Phase 20) | useState-driven map (Phase 22) | This phase | FeaturesBlock becomes interactive; FEAT-02 satisfied |

**There is no ecosystem shift here.** This is idiomatic React controlled component pattern — unchanged since React 16.8 hooks introduction. No library, no API, no framework feature needed beyond `useState`.

---

## Open Questions

1. **Image pre-caching for instant swap**
   - What we know: The 4 PNGs are 308×308px — small files. Browsers cache on first network request.
   - What's unclear: On a cold first load, clicking step 2 immediately after page paint might show a brief loading flicker for `features-step-2.png` if the network is slow.
   - Recommendation: For v1.5, accept the default browser behaviour — no preloading needed. The PNGs are small and will cache after first visit. If flicker is observed, a simple `<link rel="prefetch">` in the document head can be added as a post-phase polish task.

2. **Keyboard accessibility for step cards**
   - What we know: The success criteria only specifies "clicking" — mouse interaction is the scope.
   - What's unclear: Whether `div` click handlers need `role="button"` + `tabIndex={0}` + `onKeyDown` for keyboard users.
   - Recommendation: Out of scope for this phase per the success criteria. Add a note in VERIFICATION.md for a future a11y pass (v1.6+). If the planner wants to add `role="button"` + `tabIndex={0}` as a minimal improvement, it is safe to do so — no risk.

---

## Sources

### Primary (HIGH confidence)

- `src/components/landing/FeaturesBlock.tsx` — directly inspected; current static implementation confirmed
- `.planning/phases/20-static-page-shell/CONTEXT.md` — verbatim step copy, active/inactive visual specification, design token values
- `src/app/globals.css` — confirmed `--dnd-border-card: #572182`, `--dnd-accent: #ba7df6`, `--dnd-text-muted: #a19aa8`
- `.planning/STATE.md` — confirmed "No new dependencies for v1.5"; confirmed FeaturesBlock step 1 active state is hard-coded, Phase 22 adds interactivity
- `src/hooks/useInView.ts` — directly inspected; confirmed hook signature and return values to avoid breaking Phase 21 animation

### Secondary (MEDIUM confidence)

None required — all decisions can be grounded in the existing codebase directly.

### Tertiary (LOW confidence)

None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — React useState is in the project already; no new library needed; all tokens verified in globals.css
- Architecture: HIGH — single file edit; pattern is idiomatic React; full existing component inspected
- Pitfalls: HIGH — all pitfalls derived from directly reading the existing static implementation and Phase 20/21 decisions

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (no fast-moving dependencies; pure React/Tailwind)
