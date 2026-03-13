# Phase 18: How It Works Modal - Research

**Researched:** 2026-03-13
**Domain:** React/Next.js accessible modal — static explainer with numbered step cards, native `<dialog>` focus trap, role toggle
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOW-03 | Modal displays visual numbered step cards (step number + heading + 1-line description) covering both DM and player perspectives | Step card Tailwind pattern confirmed from STACK.md; two-role split confirmed from FEATURES.md; native data is static (no fetch needed) |
| HOW-04 | Modal is dismissible via backdrop click or Escape; focus is properly trapped while open | Native `<dialog>` with `.showModal()` provides built-in focus trap and Escape; `::backdrop` requires a `globals.css` rule — confirmed in STATE.md blocker note |
</phase_requirements>

---

## Summary

Phase 18 creates a single standalone `HowItWorksModal` component and its companion `HowItWorksButton` trigger island. No page wiring happens in this phase (that is Phase 19). The modal is purely presentational: two sets of static step cards (DM perspective, player perspective) displayed via a role toggle inside a native `<dialog>` element.

The v1.4 milestone research resolved all major architectural questions before this phase started. Zero new dependencies are needed. The component follows the `ShareModal.tsx` skeleton (fixed overlay, `z-50`, no URL manipulation) but upgrades to the native `<dialog>` element rather than a div-overlay, giving focus trapping and Escape handling for free. The `::backdrop` pseudo-element for the dimmed overlay behind `<dialog>` requires one new CSS rule in `globals.css` — that is the only new global pattern introduced in this codebase.

The step content is decided (4 DM steps, 3 player steps per FEATURES.md research), the visual card pattern is confirmed (numbered circle + heading + one-liner using existing CSS custom properties), and the role-toggle is implemented as a simple `useState` inside the modal. The component is complete and manually verifiable in isolation before Phase 19 places it on any page.

**Primary recommendation:** Build `HowItWorksModal.tsx` using native `<dialog>` + `.showModal()`, a two-button role toggle (`useState('dm' | 'player')`), and hardcoded step data arrays. Wrap it in `HowItWorksButton.tsx` that owns the open/close `useState`. Deliver both components as Phase 18; Phase 19 places them on pages.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React `useRef` + `useEffect` | 19 (in use) | Call `dialogRef.current.showModal()` when `open` becomes true | The HTML `<dialog>` API requires imperative `.showModal()` — cannot be driven by declarative props alone |
| Native HTML `<dialog>` | Web platform | Focus trap, Escape key, backdrop isolation | Browser-native; no library needed; React 19 supports it without quirks |
| Tailwind CSS 4 + CSS custom properties | In use | Step card layout, role toggle buttons, typography | Consistent with every other component in the codebase |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useState('dm' \| 'player')` | React 19 | Role toggle inside the modal | Simplest possible state — no reducer, no context |
| `globals.css` `::backdrop` rule | CSS | Style the `<dialog>` backdrop overlay | Required once when introducing `<dialog>` — no other way to style it |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<dialog>` | div-overlay (ShareModal pattern) | div-overlay has no built-in focus trap or Escape handling; PITFALLS.md confirms `<dialog>` is the right choice for a modal opened mid-session on a keyboard-interactive page |
| Role toggle (`useState`) | Single unified linear flow | Milestone research (FEATURES.md) confirms the two-role split is clearer; the toggle is a low-complexity differentiator |
| Hardcoded step arrays | Props-driven step content | Step content is static and unlikely to vary by context; hardcoding is simpler and SSR-safe (avoids CSS counter hydration flash — Pitfall 9) |

**Installation:** No new packages. Zero changes to `package.json`.

---

## Architecture Patterns

### Recommended File Structure

```
src/components/
├── HowItWorksModal.tsx   # <dialog>-based modal, receives onClose prop, owns role toggle state
├── HowItWorksButton.tsx  # 'use client' island, owns open useState, renders button + modal
```

Both files are new. No existing component is modified in Phase 18.

### Pattern 1: HowItWorksButton — Narrow Client Island

**What:** A zero-prop `'use client'` component that owns `useState(false)` for open/closed, renders the trigger button, and conditionally renders the modal. Server Component pages import this island without gaining `'use client'` themselves.

**When to use:** Any Server Component page that needs an interactive modal trigger — follows `CopyLinkButton`, `DeleteCampaignButton`, and `ShareModal` precedent already in the codebase.

**Example:**
```tsx
// Source: ARCHITECTURE.md confirmed pattern
'use client'
import { useState } from 'react'
import { HowItWorksModal } from './HowItWorksModal'

export function HowItWorksButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How it works"
        className="text-sm text-[var(--dnd-text-muted)] hover:text-white transition-colors"
      >
        ?
      </button>
      {open && <HowItWorksModal onClose={() => setOpen(false)} />}
    </>
  )
}
```

### Pattern 2: HowItWorksModal — Native `<dialog>` with `.showModal()`

**What:** A `'use client'` component that uses `useRef<HTMLDialogElement>` and calls `.showModal()` / `.close()` via `useEffect`. Receives only `onClose` — no open prop needed because it mounts only when open (conditional render in `HowItWorksButton`).

**When to use:** All new modals in this codebase going forward. This is the upgrade from the div-overlay pattern.

**Example:**
```tsx
// Source: PITFALLS.md Option A — confirmed as recommended approach
'use client'
import { useEffect, useRef, useState } from 'react'

const DM_STEPS = [
  { number: 1, heading: 'Create your campaign', description: 'Set a planning window and share the link with your players.' },
  { number: 2, heading: 'Players mark their availability', description: 'Everyone sets their free days — you see it live on the calendar.' },
  { number: 3, heading: 'Add your unavailable dates', description: 'Block dates when you cannot run a session in the Settings tab.' },
  { number: 4, heading: 'Pick the best day', description: 'The ranked list shows which days work for everyone — copy it to your group chat.' },
]

const PLAYER_STEPS = [
  { number: 1, heading: 'Open the link', description: 'Your DM shares a link — enter your name to get started.' },
  { number: 2, heading: 'Set your weekly pattern', description: 'Tick the days you are usually free each week.' },
  { number: 3, heading: 'Add exceptions', description: 'Override specific dates if a particular week is different.' },
]

export function HowItWorksModal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [role, setRole] = useState<'dm' | 'player'>('dm')

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const steps = role === 'dm' ? DM_STEPS : PLAYER_STEPS

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="how-it-works-title"
      className="bg-[var(--dnd-input-bg)] border border-[#ba7df6]/30 rounded-lg p-6 max-w-lg w-full mx-4"
    >
      <h2 id="how-it-works-title" className="font-fantasy text-xl text-white mb-4">
        How it works
      </h2>
      {/* role toggle */}
      {/* step cards */}
      <button onClick={onClose} className="...">Close</button>
    </dialog>
  )
}
```

### Pattern 3: `::backdrop` Rule in globals.css

**What:** Native `<dialog>` uses the `::backdrop` pseudo-element for the overlay behind it. Tailwind 4 cannot target `::backdrop` via utility classes — a single CSS rule in `globals.css` is required.

**When to use:** Any time `<dialog showModal()>` is used. One rule covers all dialogs.

**Example:**
```css
/* globals.css — new rule needed for Phase 18 */
dialog::backdrop {
  background: rgba(0, 0, 0, 0.6);
}
```

This mirrors the `bg-black/60` colour used on the `ShareModal` backdrop div.

### Pattern 4: Role Toggle

**What:** Two `<button>` elements at the top of the modal that toggle a `'dm' | 'player'` state. The active button gets the accent border/background; inactive gets muted styling.

**When to use:** Any modal or panel that needs to display different content per user role — no library, no tabs component needed.

**Example:**
```tsx
<div className="flex gap-2 mb-5">
  <button
    type="button"
    onClick={() => setRole('dm')}
    className={`flex-1 py-1.5 text-sm rounded border transition-colors ${
      role === 'dm'
        ? 'border-[var(--dnd-accent)] text-white bg-[var(--dnd-accent)]/20'
        : 'border-[var(--dnd-border-muted)] text-[var(--dnd-text-muted)]'
    }`}
  >
    I'm the DM
  </button>
  <button
    type="button"
    onClick={() => setRole('player')}
    className={`flex-1 py-1.5 text-sm rounded border transition-colors ${
      role === 'player'
        ? 'border-[var(--dnd-accent)] text-white bg-[var(--dnd-accent)]/20'
        : 'border-[var(--dnd-border-muted)] text-[var(--dnd-text-muted)]'
    }`}
  >
    I'm a player
  </button>
</div>
```

### Pattern 5: Numbered Step Card

**What:** A flex row with a numbered circle (using `--dnd-accent`), a heading, and a one-line description. Rendered from a hardcoded step array — numbers are explicit values, not array indices, to avoid SSR/hydration mismatch (Pitfall 9).

**Example:**
```tsx
// Source: STACK.md confirmed pattern, globals.css custom property values verified
<div className="flex items-start gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-4 py-3">
  <span className="w-7 h-7 rounded-full bg-[var(--dnd-accent)] text-black flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
    {step.number}
  </span>
  <div>
    <p className="text-sm font-semibold text-white">{step.heading}</p>
    <p className="text-sm text-[var(--dnd-text-muted)] mt-0.5">{step.description}</p>
  </div>
</div>
```

### Anti-Patterns to Avoid

- **Putting open state in the modal itself:** `HowItWorksModal` must not own `useState(open)` — `HowItWorksButton` owns it. The modal mounts only when open (conditional render). This keeps the two components' concerns clean and prevents re-render thrash on the button side.
- **Calling `router.push/replace` in this modal:** `ShareModal` uses `router.replace` to clean a URL param. `HowItWorksModal` has no URL param — any router manipulation would break the browser Back button (Pitfall 8).
- **Using `'use client'` on Server Component pages:** The trigger is a narrow island. `campaigns/page.tsx` and other pages must not gain `'use client'` (Pitfall 3).
- **Rendering the modal via `createPortal`:** Not needed — `<dialog>` with `.showModal()` creates its own top-layer stacking context, above all other content, independent of DOM position.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap within modal | Manual `tabIndex` management, `keydown` interceptor on all focusable children | Native `<dialog>` + `.showModal()` | Browser handles focus cycle automatically; custom implementations miss shadow DOM, dynamically added elements |
| Escape key dismiss | `window.addEventListener('keydown', ...)` checking `e.key === 'Escape'` | Native `<dialog>` + `.showModal()` | `<dialog>` fires its `close` event on Escape natively — no listener needed |
| Modal stacking context | `z-index` arithmetic, manual stacking order management | `<dialog>` top-layer | `.showModal()` places the dialog in the browser's top layer — guaranteed above everything else regardless of z-index |
| Backdrop overlay | `fixed inset-0 bg-black/60` div sibling | `dialog::backdrop` CSS rule | `<dialog>` generates `::backdrop` automatically when opened with `.showModal()` |

**Key insight:** The entire focus-trap + Escape + backdrop problem that the div-overlay pattern requires custom code for is solved for free by `<dialog>` + `.showModal()`. The one cost is a single `dialog::backdrop` rule in `globals.css` — a new pattern in the codebase, but a one-time cost with no ongoing maintenance burden.

---

## Common Pitfalls

### Pitfall 1: Missing `dialog::backdrop` rule — modal opens without overlay
**What goes wrong:** `<dialog>` opened with `.showModal()` shows focus-trapped content but without the dimming overlay — the page is fully visible and interactive-looking behind the modal.
**Why it happens:** The `::backdrop` pseudo-element is separate from the dialog itself and cannot be styled with Tailwind utility classes. It only responds to a CSS rule targeting `dialog::backdrop`.
**How to avoid:** Add `dialog::backdrop { background: rgba(0, 0, 0, 0.6); }` to `globals.css` as the very first task in Phase 18. This is flagged as a known blocker in STATE.md.
**Warning signs:** Modal opens but page content is fully visible/clickable behind it.

### Pitfall 2: `useEffect` dependency array missing `onClose` causes stale closure
**What goes wrong:** If `onClose` is used inside the `useEffect` that listens for the `<dialog>` `close` event (e.g., `dialog.addEventListener('close', onClose)`), and `onClose` is excluded from the deps array, the component captures a stale reference to the first `onClose` passed in.
**Why it happens:** Natural mistake when setting up event listeners in `useEffect`.
**How to avoid:** Wire `onClose` through the `onClose` prop on the `<dialog>` JSX element itself (`<dialog onClose={onClose}>`) — React 19 supports this synthetic event directly. Avoid imperative `addEventListener` for the close event.
**Warning signs:** Closing the modal via Escape stops working after the first open/close cycle.

### Pitfall 3: z-index collision on the DM dashboard (future Phase 19 concern — flag now)
**What goes wrong:** When Phase 19 places `HowItWorksButton` on the DM campaigns page (`/campaigns/[id]` or `CampaignTabs`), the date side panel uses `z-20`. With the native `<dialog>` top-layer, this is not a collision problem — `showModal()` always wins. But the existing `z-50` snackbar is also in CampaignTabs, and if `HowItWorksButton` is placed inside `CampaignTabs` rather than at the page level, the snackbar could conceivably appear above the modal on some browsers that handle top-layer differently.
**Why it happens:** Top-layer ordering is last-opened wins, not z-index wins.
**How to avoid:** Phase 18 is standalone — this is not a blocker here. Flag for Phase 19: place `HowItWorksButton` at the Server Component page level, not inside `CampaignTabs`, so it renders outside the snackbar's DOM subtree.
**Warning signs:** Snackbar visible above the open modal.

### Pitfall 4: Backdrop click dismiss requires explicit handling with `<dialog>`
**What goes wrong:** `HOW-04` requires backdrop click to dismiss. With `<dialog>`, clicking the `::backdrop` does not fire `close` by default — only Escape does. Backdrop click requires an explicit `onClick` handler on the `<dialog>` element that checks `event.target === dialogRef.current`.
**Why it happens:** This is a documented HTML `<dialog>` limitation — the spec gives Escape but not backdrop-click for free.
**How to avoid:** Add a click handler on the `<dialog>` element:
```tsx
function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
  if (e.target === e.currentTarget) onClose()
}
// <dialog onClick={handleDialogClick} ...>
```
This fires only when the click lands directly on the `<dialog>` element (the backdrop area), not on the content inside it.
**Warning signs:** Clicking outside the modal content does nothing.

### Pitfall 5: Step numbers rendered via array index — SSR/hydration mismatch
**What goes wrong:** If `steps.map((step, i) => <StepCard number={i + 1} ...>)` is used and anything causes a reorder (step array conditionally filtered, etc.), step numbers in SSR don't match hydration numbers.
**Why it happens:** Array index is a runtime computation; hardcoded numbers are static.
**How to avoid:** Include `number` as an explicit field in each step object. Use `step.number` not `i + 1`.
**Warning signs:** Console hydration mismatch warnings referencing step number content.

---

## Code Examples

### Complete `globals.css` addition

```css
/* Add after existing rules in globals.css */
dialog::backdrop {
  background: rgba(0, 0, 0, 0.6);
}
```

### Backdrop click dismiss handler

```tsx
// Source: HTML dialog spec — confirmed behaviour
function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
  // e.target is the <dialog> element when clicking the ::backdrop area
  if (e.target === e.currentTarget) onClose()
}

<dialog ref={ref} onClose={onClose} onClick={handleBackdropClick} aria-labelledby="how-it-works-title">
  {/* modal content */}
</dialog>
```

### Step data arrays (final copy per FEATURES.md research)

```ts
const DM_STEPS = [
  { number: 1, heading: 'Create your campaign', description: 'Set a planning window and share the link with your players.' },
  { number: 2, heading: 'Players mark their availability', description: 'Everyone sets their free days — you see it live on the calendar.' },
  { number: 3, heading: 'Add your unavailable dates', description: 'Block dates when you cannot run a session in the Settings tab.' },
  { number: 4, heading: 'Pick the best day', description: 'The ranked list shows which days work for everyone — copy it to your group chat.' },
]

const PLAYER_STEPS = [
  { number: 1, heading: 'Open the link', description: 'Your DM shares a link — enter your name to get started.' },
  { number: 2, heading: 'Set your weekly pattern', description: 'Tick the days you are usually free each week.' },
  { number: 3, heading: 'Add exceptions', description: 'Override specific dates if a particular week is different.' },
]
```

### Manual verification steps for HOW-04 (focus trap + dismiss)

```
1. Open modal — verify focus lands inside the dialog (on close button or first interactive element)
2. Press Tab repeatedly — verify focus stays within the modal, never reaching calendar/page behind it
3. Press Escape — verify modal closes
4. Click the backdrop (outside the modal card) — verify modal closes
5. Click inside the modal card — verify modal stays open
6. Open modal, close it, open it again, press browser Back — verify page does NOT navigate away
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| div-overlay modal (`ShareModal` pattern) | Native `<dialog>` + `.showModal()` | HTML `<dialog>` fully supported since Safari 15.4 (2022) | Built-in focus trap, Escape, top-layer stacking — no manual JS needed |
| Manual `window.addEventListener('keydown')` for Escape | `<dialog>` native Escape handling | Same as above | Removes a category of cleanup bugs (forgetting to remove listeners) |
| `z-index` stacking for modal overlay | Top-layer API (`showModal()`) | Same as above | Dialog is always on top — immune to z-index conflicts from other components |

**Deprecated/outdated in this codebase:**
- `ShareModal` div-overlay pattern: still valid for its use case (URL-triggered, simple page context) but `HowItWorksModal` sets a new standard for future modals using native `<dialog>`.

---

## Open Questions

1. **Close button label and position**
   - What we know: `ShareModal` uses a full-width "Done" button at the bottom. The `<dialog>` pattern typically has an X button top-right or a text button at the bottom.
   - What's unclear: Which position works better with a scrollable step card list — X top-right (always visible) vs bottom button (may scroll off).
   - Recommendation: Use an X button top-right as an `absolute`-positioned element within the `relative` modal card, plus a "Got it" text button at the bottom of the step list. This ensures keyboard users can find it at the end of a natural Tab sequence.

2. **Default role shown when modal opens**
   - What we know: The modal appears on both DM and player pages (Phase 19 wiring).
   - What's unclear: Phase 18 delivers the standalone component — Phase 19 may want to pass a `defaultRole` prop to pre-select the relevant perspective based on the page.
   - Recommendation: Default to `'dm'` in Phase 18 (DM is the primary user). Accept an optional `defaultRole?: 'dm' | 'player'` prop so Phase 19 can override without modifying the component.

3. **Modal scroll behaviour on small screens**
   - What we know: 4 DM step cards + role toggle + heading + close button may exceed the viewport height on mobile.
   - What's unclear: Does `<dialog>` overflow clip or scroll by default?
   - Recommendation: Add `max-h-[90vh] overflow-y-auto` to the dialog's inner content wrapper (not the `<dialog>` element itself, which may conflict with top-layer positioning). Verify on a 375px viewport.

---

## Sources

### Primary (HIGH confidence)
- `/Users/richardowen/Desktop/wheres-the-cleric/src/components/ShareModal.tsx` — baseline modal pattern, confirmed 61 lines, div-overlay, `z-50`, no focus trap
- `/Users/richardowen/Desktop/wheres-the-cleric/src/app/globals.css` — confirmed CSS custom properties (`--dnd-accent`, `--dnd-input-bg`, `--dnd-card-bg`, `--dnd-border-card`, `--dnd-text-muted`), no existing `dialog::backdrop` rule
- `.planning/research/STACK.md` — zero new dependencies confirmed; step card Tailwind pattern; HowItWorksModal skeleton
- `.planning/research/ARCHITECTURE.md` — HowItWorksButton island pattern; component boundaries; why no URL coupling
- `.planning/research/PITFALLS.md` — Pitfall 4 (`<dialog>` focus trap recommendation); Pitfall 8 (no URL manipulation); Pitfall 9 (hardcoded step numbers); Pitfall 10 (`aria-labelledby`)
- `.planning/research/FEATURES.md` — confirmed step content (4 DM steps, 3 player steps); role toggle as differentiator; anti-feature list
- `.planning/STATE.md` — confirmed decision: native `<dialog>` with `.showModal()`; confirmed blocker: `dialog::backdrop` needs a `globals.css` rule

### Secondary (MEDIUM confidence)
- HTML `<dialog>` spec — `::backdrop` not styleable via Tailwind; backdrop click requires explicit `onClick` check — established Web platform knowledge, stable since 2022

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all confirmed by direct codebase reading and prior milestone research
- Architecture: HIGH — HowItWorksButton + HowItWorksModal two-file split confirmed; `<dialog>` approach confirmed by PITFALLS.md; all patterns traced to existing codebase precedents
- Pitfalls: HIGH for `::backdrop`, backdrop click, stale closure, URL coupling (all verified against spec or prior research); MEDIUM for small-screen scroll (not tested)
- Step content: HIGH — derived from direct codebase reading of actual user journeys in FEATURES.md

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable domain — no fast-moving dependencies)
