# Technology Stack — v1.4 Additions

**Project:** Where's the Cleric — D&D Session Planner
**Milestone:** v1.4 UI Clarity (onboarding modal + calendar legend/date modal polish)
**Researched:** 2026-03-12
**Scope:** NEW capabilities only — existing stack is validated (Next.js 16 App Router, React 19, Tailwind CSS 4, Prisma 7 + Neon, bcryptjs, CSS-only tooltips, clipboard API, custom date picker with hidden input pattern, optimistic UI).

---

## Verdict Up Front

**Zero new dependencies.** Both new features — the "How it works" modal and the calendar legend/date modal polish — are fully achievable by extending the patterns already in production in this codebase. Adding a modal library, animation library, or any other package would be gold-plating.

---

## Context: What Already Exists and Is Directly Reusable

| Capability | File | Relevance to v1.4 |
|------------|------|-------------------|
| Fixed-overlay modal with backdrop dismiss + Escape close | `ShareModal.tsx` | Direct template for "How it works" modal — same `useState(open)` pattern, same overlay `<div>`, same dismiss flow |
| Slide-in side panel with CSS `translate-x` transition | `CampaignTabs.tsx` lines 116–153 | This IS the date click modal — needs legend row + DM unavailable indicator added in-place |
| Inline legend swatches (Free, No response) | `CampaignTabs.tsx` lines 256–263 | DM unavailable swatch is a third `<span>` added to the existing flex row |
| CSS custom properties for theming | `globals.css` | `--dnd-accent`, `--dnd-card-bg`, `--dnd-border-card` etc. — all new modal/card elements inherit these |
| `useEffect` keyboard listener (Escape key) | `CampaignTabs.tsx` lines 73–79 | Already handles Escape to close the side panel |
| Numbered visual cards (none yet, but the grid/card pattern) | `CampaignTabs.tsx`, `campaigns/page.tsx` | Existing card structure (`border`, `rounded-lg`, `bg-[var(--dnd-card-bg)]`) is the visual base |

---

## Feature 1: "How It Works" Modal

### What it needs

A modal with visual numbered step cards. Each card has: a step number (styled circle), heading, one-line description. Two perspectives: DM and Player. Triggered from home page, DM campaigns page, and player-facing pages.

### Technology verdict

**Pattern:** Extend `ShareModal.tsx` directly. The component is small (60 lines), uses `useState(true/false)` for open state, a fixed backdrop `<div>` with `onClick={dismiss}`, and a centred content panel. The "How it works" modal is this pattern with different inner content.

**Numbered cards:** Pure Tailwind. A numbered circle is `w-8 h-8 rounded-full bg-[var(--dnd-accent)] text-black flex items-center justify-center text-sm font-bold shrink-0`. No icon library. No external component.

**Trigger button:** A plain `<button>` or `<Link>` styled with `text-[var(--dnd-text-muted)] hover:text-white transition-colors` — same pattern as the "Log out" button in `campaigns/page.tsx`.

**State management:** `useState(false)` in the trigger component (`'use client'`). Modal is rendered conditionally (`if (!open) return null`). No portal, no `createPortal` — the modal is fixed-positioned so z-index stacking handles visual layering correctly without a DOM portal. This is exactly what `ShareModal.tsx` does and it works in production.

**No `<dialog>` element needed.** The `<dialog>` element has full browser support (Chrome 37+, Firefox 98+, Safari 15.4+) and native focus-trapping, but this app's existing modals use the fixed-overlay-div pattern and it works. Switching to `<dialog>` would require new CSS patterns (the `::backdrop` pseudo-element, `showModal()` JS API) for no user-visible benefit at this app's scale. Maintain consistency with `ShareModal.tsx`.

**Accessibility minimum:** `aria-modal="true"` on the panel div, `role="dialog"`, `aria-labelledby` pointing to the heading. `Escape` key close via `useEffect` (same as `CampaignTabs.tsx`). No focus-trap library needed — the modal is simple enough that a `tabIndex` on the close button and logical DOM order are sufficient.

### What NOT to add

| Library | Why Not |
|---------|---------|
| `@radix-ui/react-dialog` | Adds ~12 KB gzipped; the ShareModal pattern already handles the same use case in production |
| `@headlessui/react` Dialog | Requires Tailwind CSS 4 config alignment; unnecessary at this scale |
| `framer-motion` | Animation overkill — CSS `transition-opacity` on the overlay (already used in CampaignTabs snackbar) is sufficient |
| `focus-trap-react` | Not needed — modal content is simple (heading + cards + close button); native tab order suffices |

---

## Feature 2: Calendar Legend + Date Click Modal Polish

### What it needs

1. A DM unavailable colour swatch added to the Group Availability legend.
2. The date side panel (slide-in at `right-0`) shows a DM unavailable indicator when the clicked date has a DM exception.
3. The side panel shows a clear "No players available" message instead of listing everyone as "No response" when zero players are free.

### Technology verdict

**Legend swatch:** One additional `<span>` element added to the existing flex legend row in `CampaignTabs.tsx` (lines 256–263). No new component. Colour: amber (`bg-amber-400/60` or `bg-amber-400`) — this already appears in `DashboardCalendar.tsx` as `ring-amber-400/60` on DM-blocked dates, so the colour is already established in the visual language.

**Side panel DM indicator:** The `agg` object (`DayAggregation`) is already available in the side panel render at lines 119–153 of `CampaignTabs.tsx`. `dmBlocked` is already a field on `DayAggregation` (used in `DashboardCalendar.tsx` line 143: `agg?.dmBlocked`). Adding a DM unavailable indicator is a conditional `{agg?.dmBlocked && <div>...</div>}` inside the existing panel body. No new data fetch, no schema change.

**"No players available" message:** The side panel iterates `playerSlots.map(...)` to render each player. Wrap this with a check: if all statuses are `'no-response'`, render a single message instead of the list. Pure conditional logic in JSX.

### What NOT to add

Nothing. These are surgical inline changes to `CampaignTabs.tsx` and the legend JSX block.

---

## Stack Delta: v1.4 Adds Nothing to `package.json`

| Package | Action | Rationale |
|---------|--------|-----------|
| Any modal/dialog library | Do NOT add | `ShareModal.tsx` pattern is already proven in production and handles this case |
| Any animation library | Do NOT add | CSS `transition-opacity` / `transition-transform` (already in CampaignTabs snackbar and side panel) is sufficient |
| Any icon library | Do NOT add | Numbered circles and step indicators are pure Tailwind + inline SVG; consistent with existing pattern |
| Any focus-trap library | Do NOT add | Modal content is simple; `aria-modal` + logical tab order satisfies accessibility at this scale |
| `@radix-ui/react-popover` | Do NOT add | Not needed — trigger for "How it works" is a simple `useState` toggle |

---

## Implementation Patterns for New Components

### HowItWorksModal Component

Create `src/components/HowItWorksModal.tsx` as a `'use client'` component. Accept an `open` prop and `onClose` callback, or own its open state internally depending on trigger placement.

Skeleton structure mirrors `ShareModal.tsx`:

```tsx
// Fixed backdrop
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="fixed inset-0 bg-black/60" onClick={onClose} />
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="how-it-works-title"
    className="relative bg-[var(--dnd-input-bg)] border border-[#ba7df6]/30 rounded-lg p-6 max-w-lg w-full mx-4"
  >
    {/* close button + heading + step cards */}
  </div>
</div>
```

Numbered step card:

```tsx
<div className="flex items-start gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-4 py-3">
  <span className="w-7 h-7 rounded-full bg-[var(--dnd-accent)] text-black flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
    {stepNumber}
  </span>
  <div>
    <p className="text-sm font-semibold text-white">{heading}</p>
    <p className="text-sm text-[var(--dnd-text-muted)] mt-0.5">{description}</p>
  </div>
</div>
```

Escape key handling:

```tsx
useEffect(() => {
  if (!open) return
  function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}, [open, onClose])
```

This pattern is taken directly from `CampaignTabs.tsx` lines 73–79. No new patterns introduced.

### Legend DM Unavailable Swatch

Add a third swatch to the existing legend block in `CampaignTabs.tsx`:

```tsx
<span className="flex items-center gap-1.5">
  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400/60 ring-1 ring-amber-400/60" />
  DM unavailable
</span>
```

Uses `rounded-sm` (square-ish) to visually distinguish from the circular player dots, matching the amber ring already used on calendar cells.

### Date Side Panel Enhancements

Both changes go inside the existing `{selectedDate && (() => { ... })()}` IIFE in `CampaignTabs.tsx`:

1. DM unavailable indicator — add before the player list:
```tsx
{agg?.dmBlocked && (
  <div className="flex items-center gap-2 px-1 py-2 border-b border-gray-800 mb-1">
    <span className="w-3 h-3 rounded-sm bg-amber-400/60 shrink-0" />
    <span className="text-sm text-amber-300">DM unavailable</span>
  </div>
)}
```

2. "No players available" message — replace the player list when all are non-responsive:
```tsx
{playerSlots.every(slot => (agg?.playerStatuses[slot.id] ?? 'no-response') === 'no-response') ? (
  <p className="text-sm text-[var(--dnd-text-muted)]">No players available on this date.</p>
) : (
  playerSlots.map(slot => { /* existing per-player row */ })
)}
```

---

## Shared Component Extraction Opportunity

The "How it works" trigger button will appear on three pages (home, campaigns, player-facing). Create a small `HowItWorksButton.tsx` (`'use client'`) that owns the `useState(open)` and renders both the trigger button and the modal inline. Import this on each page. This avoids prop-drilling the open state upward into Server Components.

---

## Confidence Assessment

| Area | Level | Basis |
|------|-------|-------|
| Modal — no library needed | HIGH | `ShareModal.tsx` is already identical pattern in production; verified by reading source |
| Legend swatch — inline change | HIGH | Legend JSX read directly from `CampaignTabs.tsx`; one `<span>` addition |
| Date panel DM indicator | HIGH | `agg.dmBlocked` is already on `DayAggregation`; confirmed in `DashboardCalendar.tsx` line 143 |
| "No players" message | HIGH | Pure JSX conditional logic on existing data; no new data shape |
| Accessibility (aria-modal, Escape) | MEDIUM | Patterns used are correct for simple modals; full WCAG audit not performed |
| Zero new package.json deps | HIGH | All capabilities traced to existing working code in this codebase |

---

## What NOT to Add — Complete Anti-List

| Library | Why Not |
|---------|---------|
| `@radix-ui/react-dialog` | `ShareModal.tsx` already handles modal in production |
| `@headlessui/react` | Heavyweight; requires Tailwind CSS 4 config compatibility work |
| `framer-motion` | CSS transitions already handle all animation in the app |
| `focus-trap-react` | Unnecessary for content this simple |
| `react-modal` | Old library; fixed-div pattern is more compatible with Next.js App Router |
| Any icon library | All visual indicators are inline Tailwind `<span>` elements or inline SVG |
| `clsx` / `classnames` | Template literals already used throughout; no complex class merging in these features |

---

## Sources

- Codebase analysis (HIGH confidence): `ShareModal.tsx`, `CampaignTabs.tsx`, `DashboardCalendar.tsx`, `globals.css`, `package.json` — all read directly
- `DayAggregation.dmBlocked` field existence: confirmed in `DashboardCalendar.tsx` line 143 `agg?.dmBlocked` usage
- `<dialog>` browser support: established Web platform knowledge, Chrome 37+ / Firefox 98+ / Safari 15.4+ (MEDIUM confidence — not verified via MDN in this session due to WebSearch unavailability, but universally documented)
- Existing amber colour token: confirmed in `DashboardCalendar.tsx` line 143 `ring-amber-400/60` class
