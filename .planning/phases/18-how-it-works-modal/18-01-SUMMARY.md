---
phase: 18-how-it-works-modal
plan: "01"
subsystem: ui-components
tags: [modal, dialog, accessibility, focus-trap, role-toggle]
dependency_graph:
  requires: []
  provides: [HowItWorksModal, HowItWorksButton]
  affects: [src/app/globals.css]
tech_stack:
  added: []
  patterns: [native-dialog-showModal, client-island, conditional-render]
key_files:
  created:
    - src/components/HowItWorksModal.tsx
    - src/components/HowItWorksButton.tsx
  modified:
    - src/app/globals.css
key_decisions:
  - "Use margin: auto inline style on dialog element — Tailwind Preflight resets margin on all elements including dialog, breaking native browser centering of showModal() dialogs"
  - "Conditional render pattern (open && <Modal>) ensures showModal() fires on every mount, avoiding stale dialog state"
  - "dialog::backdrop rule added to globals.css (cannot use Tailwind utility classes on pseudo-elements)"
metrics:
  duration: "~14 min"
  completed: "2026-03-13"
  tasks_completed: 3
  files_changed: 3
requirements_satisfied:
  - HOW-03
  - HOW-04
---

# Phase 18 Plan 01: HowItWorksModal Summary

Native dialog modal with role toggle (DM / Player), numbered step cards, focus trap, and backdrop dismiss — delivered as a self-contained client island pair ready for Phase 19 page integration.

## What Was Built

**HowItWorksModal.tsx** — `'use client'` component using `useRef<HTMLDialogElement>` + `useEffect(() => ref.current?.showModal(), [])`. Receives `onClose: () => void` and optional `defaultRole?: 'dm' | 'player'`. Renders a native `<dialog>` with:
- Role toggle (I'm the DM / I'm a player) switching between 4 DM steps and 3 player steps
- Numbered circles using `--dnd-accent` purple background
- X button (top-right) and Got it button (bottom) both calling `onClose`
- Backdrop click handler via `e.target === e.currentTarget` check
- `margin: auto` inline style to restore centering (Tailwind Preflight strips it)

**HowItWorksButton.tsx** — `'use client'` island with `useState(false)`. Renders the trigger button ("How it works" + trailing circled ? icon) and conditionally mounts `<HowItWorksModal>` only when open. No router or URL coupling.

**globals.css** — Added `dialog::backdrop { background: rgba(0, 0, 0, 0.6); }` rule for the native dialog backdrop overlay.

## Commits

| Hash | Description |
|------|-------------|
| 2b13522 | feat(18-01): add HowItWorksModal with native dialog and dialog::backdrop rule |
| 3cbab48 | feat(18-01): create HowItWorksButton client island |
| 299e3b3 | fix(18-01): center modal, update DM step 1 heading, trail circled ? on button |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed native dialog centering**
- **Found during:** Task 3 checkpoint (user feedback)
- **Issue:** Tailwind Preflight CSS resets `margin` on all elements, including `<dialog>`. The native browser centering provided by `showModal()` relies on `margin: auto` being present. Without it, the dialog rendered at top-left instead of centered.
- **Fix:** Added `style={{ margin: 'auto' }}` inline to the `<dialog>` element. This is the minimal correct fix — avoids fighting the top-layer API with `position: fixed` hacks.
- **Files modified:** src/components/HowItWorksModal.tsx
- **Commit:** 299e3b3

### User-Requested Changes (applied before Task 3 approval)

**2. DM step 1 heading updated**
- Changed from "Create your campaign" to "Create and share your campaign" per user feedback
- Commit: 299e3b3

**3. HowItWorksButton icon treatment updated**
- Changed from leading `?` text to trailing circled ? (`<span>` with `rounded-full border`) after the label text
- Button now reads "How it works [?]" — icon is `aria-hidden`
- Commit: 299e3b3

## Verification

- TypeScript: `npx tsc --noEmit` passed after every task with zero errors
- Human verified: modal opens centered, backdrop dims correctly, role toggle switches between 4 DM and 3 player step cards, focus trapped inside modal, Escape closes, backdrop click closes, X and Got it close, URL unchanged after open/close cycle, mobile scroll works
