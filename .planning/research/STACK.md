# Technology Stack — v1.3 Additions

**Project:** Where's the Cleric — D&D Session Planner
**Milestone:** v1.3 DM Experience & Scheduling Flow
**Researched:** 2026-03-09
**Scope:** NEW capabilities only — existing stack validated and not re-researched

---

## Context: What Already Exists

The following are confirmed working and require no additions:

| Capability | Implementation | File |
|------------|---------------|------|
| Clipboard copy | `navigator.clipboard.writeText()` | `CopyLinkButton.tsx` |
| Calendar grid rendering | Hand-rolled with `Date.UTC()` math | `DashboardCalendar.tsx` |
| Date input | Native `<input type="date">` with CSS icon fix | `CampaignForm.tsx`, `UpdatePlanningWindowForm.tsx` |
| Dark purple theming | CSS custom properties on `:root` | `globals.css` |
| React 19 state | `useActionState` from `react` | Multiple components |

**Critical finding:** The clipboard API (`navigator.clipboard.writeText`) is already proven in production in this codebase. No new library is needed for clipboard. The calendar grid algorithm is also already implemented. The only genuine new capability is a styled custom date picker to replace `<input type="date">`.

---

## Recommendation: No New Dependencies for v1.3

After examining the three stated needs against the existing codebase:

### 1. Clipboard Copy (Share Modal + Best-Day Messages)

**Verdict: No new library needed. Confidence: HIGH.**

`CopyLinkButton.tsx` already uses `navigator.clipboard.writeText()` directly with `useState` for the "Copied!" feedback. This pattern handles the share modal and best-day copy requirements identically — just different string content.

`navigator.clipboard.writeText()` requires:
- HTTPS context (Vercel satisfies this; localhost is exempt)
- No user permission prompt for write-only

The existing pattern is correct and complete. Extend it, do not replace it.

### 2. Two-Month Calendar Display

**Verdict: No new library needed. Confidence: HIGH.**

`DashboardCalendar.tsx` already renders an arbitrary number of months — it loops `months[]` based on the planning window span. A two-month calendar is this component constrained to exactly two entries in that array. The `buildMonthGrid()` function, `formatDateKey()`, player dot rendering, and tooltip logic are all present.

The v1.3 redesign (Basecamp-style layout) requires restructuring the page layout and adding new data types (best days ranked list, DM exception markers) — not a new calendar library.

### 3. Custom Date Picker

**Verdict: Build without a library. Confidence: MEDIUM.**

This is the only genuinely new UI pattern. The decision is between:

| Option | Bundle cost | Tailwind CSS 4 compatibility | Theme fit | Verdict |
|--------|-------------|------------------------------|-----------|---------|
| Hand-rolled popover calendar | 0 KB | Perfect — pure Tailwind | Exact match | **Recommended** |
| `react-day-picker` v9 | ~18 KB gzipped | Requires overriding their CSS | Good with effort | Avoid |
| `react-aria-components` DatePicker | ~40 KB gzipped | Unstyled, full control | Good with effort | Overkill |
| Radix UI Popover + hand-rolled grid | ~8 KB gzipped | Good | Good | Partial option |

**Why hand-rolled wins here:**

The app already has `buildMonthGrid()` implemented and tested. A custom date picker for this app needs to render one month at a time (vs. the dashboard's multi-month view) with click-to-select behaviour — about 80 lines of TSX reusing the existing grid logic. The purple theme (`--dnd-accent`, `--dnd-input-bg`, `--dnd-card-bg`) is already defined as CSS custom properties. A hand-rolled popover perfectly inherits these.

The Tailwind CSS 4 compatibility concern is real: `react-day-picker` v8/v9 ships its own CSS file. In Tailwind CSS 4 (which uses `@import "tailwindcss"` not a config file), overriding third-party CSS is more awkward than in v3. A hand-rolled component has zero conflict.

**If the hand-rolled approach proves unexpectedly complex** (e.g., keyboard navigation requirements emerge), the fallback is `react-day-picker` v9 with `classNames` prop overrides and no imported stylesheet. But only add this if the hand-rolled version proves insufficient.

---

## Stack Delta: v1.3 Adds Nothing to `package.json`

| Package | Action | Rationale |
|---------|--------|-----------|
| Any date picker library | Do NOT add | Hand-rolled reuses existing `buildMonthGrid()` logic |
| Any clipboard library | Do NOT add | `navigator.clipboard.writeText()` already in production |
| Any modal/dialog library | Do NOT add | Tailwind CSS + React `useState` handles share modal |
| Any icon library | Do NOT add | SVG inline icons used throughout; consistent with existing pattern |

---

## Implementation Patterns for New Components

### Custom Date Picker

Build as a controlled `'use client'` component that:

1. Renders a styled `<input>` (display only — shows formatted date string, not native date input)
2. Toggles a popover `<div>` with `position: absolute` and appropriate z-index
3. Reuses `buildMonthGrid()` extracted to a shared utility (currently inlined in `DashboardCalendar.tsx`)
4. Emits an ISO date string (`YYYY-MM-DD`) via `onChange` callback
5. Uses an `<input type="hidden">` for form submission compatibility with Server Actions

Theme classes to use:

```tsx
// Trigger input
"bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] rounded px-3 py-2 text-gray-100"

// Popover container
"absolute z-50 mt-1 bg-[#140326] border border-[var(--dnd-border-card)] rounded-lg p-3 shadow-xl"

// Selected day
"bg-[var(--dnd-accent)] text-black rounded-md"

// Today indicator
"border border-[var(--dnd-accent)] rounded-md"

// Hover state
"hover:bg-[var(--dnd-card-hover)] rounded-md"
```

Close behaviour: click outside via `useEffect` with `mousedown` listener (same pattern as `DashboardCalendar.tsx` uses for the Escape key).

### Share Modal

Build as a `'use client'` component with `useState(false)` for open/closed. Use a `<dialog>` element or a fixed overlay `<div>`. No library needed.

Pattern for copy buttons inside modal — identical to `CopyLinkButton.tsx`:

```tsx
const [copied, setCopied] = useState(false)

async function handleCopy(text: string) {
  await navigator.clipboard.writeText(text)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}
```

### DM Availability Exceptions (Date Selection UI)

DM needs to mark specific dates as unavailable. This is a multi-select calendar (click to toggle dates in/out of an exception set). The `DashboardCalendar.tsx` click handler pattern applies directly — `selectedDate` becomes `Set<string>` instead of a single date.

Store exceptions as a JSON array of ISO date strings in a new Prisma field, or as individual `DmException` rows (separate model). This is a schema decision for the implementation phase, not a library decision.

---

## Extractable Shared Utilities

These should be extracted to `src/lib/calendar.ts` during v1.3 to avoid duplication:

```typescript
// Currently inlined in DashboardCalendar.tsx
export function buildMonthGrid(year: number, month: number): (Date | null)[][]
export function formatDateKey(date: Date): string  // → 'YYYY-MM-DD'
```

Both the new date picker component and the updated dashboard calendar will need these. Extract before building the picker.

---

## Confidence Assessment

| Area | Level | Basis |
|------|-------|-------|
| Clipboard API — no library needed | HIGH | Confirmed working in existing `CopyLinkButton.tsx` |
| Calendar rendering — no library needed | HIGH | Confirmed working algorithm in `DashboardCalendar.tsx` |
| Hand-rolled date picker — feasible | MEDIUM | Training data + codebase evidence; not verified against latest react-day-picker v9 API |
| Tailwind CSS 4 / third-party CSS conflicts | MEDIUM | Known Tailwind v4 architecture change; specific react-day-picker v9 interaction not verified with docs |
| `navigator.clipboard` HTTPS requirement | HIGH | Well-established Web API spec; Vercel enforces HTTPS |

---

## What NOT to Add (Anti-Additions)

| Library | Why Not |
|---------|---------|
| `date-fns` / `dayjs` / `luxon` | All date math already done with `Date.UTC()` — adding a date library for formatting alone is unnecessary weight |
| `shadcn/ui` | Would require Tailwind v4 config changes and introduces Radix primitives; mismatched with current pattern |
| `@headlessui/react` | Heavyweight for what is needed; Tailwind's own popover/modal patterns with React `useState` are sufficient at this scale |
| `react-calendar` | Older library, not designed for Tailwind CSS 4; theming via CSS variables is less clean |
| `flatpickr` | Non-React, requires refs and cleanup; brings its own CSS |

---

## Sources

- Codebase analysis: `CopyLinkButton.tsx`, `DashboardCalendar.tsx`, `CampaignForm.tsx`, `UpdatePlanningWindowForm.tsx`, `globals.css`, `package.json`
- Clipboard API: Web platform standard; confirmed already in production use in this codebase (HIGH confidence)
- react-day-picker: Training knowledge to August 2025 — v8 uses `classNames` prop for styling, v9 released 2024 with similar API (MEDIUM confidence — version and exact API not verified via docs)
- Tailwind CSS 4 + third-party CSS: Training knowledge — v4 uses `@import "tailwindcss"` not a config file, making stylesheet injection from third-party packages harder to override (MEDIUM confidence)
