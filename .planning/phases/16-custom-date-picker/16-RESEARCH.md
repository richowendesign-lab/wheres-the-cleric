# Phase 16: Custom Date Picker - Research

**Researched:** 2026-03-11
**Domain:** Custom React date picker, Tailwind CSS theming, Next.js Server Actions FormData
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PICK-01 | Planning window fields use a custom themed date picker matching the app's visual style | Custom picker built with existing `buildMonthGrid` + Tailwind CSS design tokens; no native browser popup |
| PICK-02 | Custom picker replaces native date inputs in campaign creation and planning window update forms | Two target components: `CampaignForm.tsx` and `UpdatePlanningWindowForm.tsx`; hidden input pattern preserves Server Action FormData contract |
</phase_requirements>

---

## Summary

This phase replaces four native `<input type="date">` fields (two in `CampaignForm`, two in `UpdatePlanningWindowForm`) with a custom date picker that matches the app's existing purple/dark D&D visual theme. The project uses Next.js 16.1.6, React 19, Tailwind CSS v4, and deliberately keeps its dependency footprint minimal — only `use-debounce` and Prisma as runtime deps beyond Next.js. No new npm packages should be added.

The core pattern is well-established: a Client Component that (1) manages a `Date | undefined` state, (2) renders a styled calendar popover built from the existing `buildMonthGrid` and `formatDateKey` utilities in `src/lib/calendarUtils.ts`, and (3) renders a `<input type="hidden" name="planningWindowStart" value="YYYY-MM-DD">` so that Server Actions read the date from FormData exactly as they do today — no changes to `createCampaign` or `updatePlanningWindow` are needed.

The key risk is date state loss: when `useActionState` returns a validation error, React re-renders the form and uncontrolled inputs reset. The hidden-input pattern solves this because the picker's date is held in React `useState` (not an uncontrolled input), so validation errors leave the picked date intact. The STATE.md blocker about `revalidatePath` in `updatePlanningWindow` is confirmed: the action does NOT call `revalidatePath`, so after success the page does not re-fetch data; this is fine because `CampaignTabs` already handles success via the `onSuccess` callback closing the inline editor.

**Primary recommendation:** Build a self-contained `DatePickerInput` Client Component using only project-internal utilities (`buildMonthGrid`, `formatDateKey` from `calendarUtils.ts`) and Tailwind CSS design tokens. Drop it into `CampaignForm` and `UpdatePlanningWindowForm` as a drop-in replacement for `<input type="date">`. No new dependencies.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (already installed) | 19.2.3 | Client Component state, `useState` for selected date and open/close | Already in project |
| Tailwind CSS (already installed) | ^4 | Styling the calendar grid and popover using existing design tokens | Already in project |
| `calendarUtils.ts` (internal) | — | `buildMonthGrid`, `formatDateKey` — already used in `DashboardCalendar` | Avoids duplicating grid logic |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | — | — | All required logic is present in the codebase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled picker | react-day-picker v9.14.0 | RDP bundles date-fns (~15 KB), adds a dependency, and requires Tailwind classNames overrides to match the DnD theme; hand-rolled is simpler given `buildMonthGrid` already exists |
| Hand-rolled picker | react-datepicker | Much larger, brings its own CSS, requires more override work for dark themes |
| Native `<dialog>` for popover | `position: absolute` / Tailwind `z-50` | `<dialog>` requires imperative `.showModal()` calls which clash with React declarative pattern; absolute-positioned div is simpler and consistent with existing `DashboardCalendar` tooltip pattern |

**Installation:**

No new packages required. The component uses only what is already in the project.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── DatePickerInput.tsx   # New: reusable date picker Client Component
│   ├── CampaignForm.tsx      # Modified: replace <input type="date"> × 2
│   └── UpdatePlanningWindowForm.tsx  # Modified: replace <input type="date"> × 2
└── lib/
    └── calendarUtils.ts      # Unchanged: buildMonthGrid + formatDateKey already here
```

### Pattern 1: Hidden Input + Controlled Date State

**What:** The picker holds `selectedDate: Date | undefined` in React state. It renders:
- A styled trigger button showing the formatted date (or placeholder)
- A dropdown calendar popover (absolute-positioned, Tailwind `z-50`)
- A `<input type="hidden" name="..." value={formattedDate}>` that submits to FormData

**When to use:** Any time a custom UI control must integrate with an HTML `<form>` and a Server Action that reads `formData.get(name)`.

**Why it preserves the Server Action contract:** `createCampaign` and `updatePlanningWindow` both call `formData.get('planningWindowStart')` and `formData.get('planningWindowEnd')` and pass the raw string to `new Date(startVal)`. The hidden input emits exactly the same `YYYY-MM-DD` string the native input did.

**Example:**

```typescript
// src/components/DatePickerInput.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { buildMonthGrid, formatDateKey } from '@/lib/calendarUtils'

interface DatePickerInputProps {
  name: string                   // FormData field name — e.g. "planningWindowStart"
  defaultValue?: string          // 'YYYY-MM-DD' — for edit forms with existing value
  required?: boolean
  placeholder?: string
}

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export function DatePickerInput({ name, defaultValue, required, placeholder = 'Pick a date' }: DatePickerInputProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Date | undefined>(
    defaultValue ? parseDateKey(defaultValue) : undefined
  )
  const [viewYear, setViewYear] = useState(() => selected?.getUTCFullYear() ?? new Date().getUTCFullYear())
  const [viewMonth, setViewMonth] = useState(() => selected?.getUTCMonth() ?? new Date().getUTCMonth())

  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const formattedValue = selected ? formatDateKey(selected) : ''
  const displayLabel = selected
    ? selected.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : placeholder

  const grid = buildMonthGrid(viewYear, viewMonth)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  function selectDay(date: Date) {
    setSelected(date)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input — submits YYYY-MM-DD to FormData */}
      <input type="hidden" name={name} value={formattedValue} required={required} />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full text-left rounded bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] px-3 py-2 text-gray-100 focus:outline-none"
      >
        <span className={selected ? 'text-gray-100' : 'text-gray-500'}>{displayLabel}</span>
      </button>

      {/* Calendar popover */}
      {open && (
        <div className="absolute z-50 mt-1 rounded-lg bg-[#140326] border border-[var(--dnd-border-card)] shadow-2xl p-3 min-w-[260px]">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 text-[var(--dnd-text-muted)] hover:text-white" aria-label="Previous month">&#8592;</button>
            <span className="text-sm font-semibold text-gray-200">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="p-1 text-[var(--dnd-text-muted)] hover:text-white" aria-label="Next month">&#8594;</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map(h => (
              <div key={h} className="text-xs text-gray-500 text-center py-1">{h}</div>
            ))}
          </div>

          {/* Date grid */}
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((date, di) => {
                if (!date) return <div key={di} />
                const dateKey = formatDateKey(date)
                const isSelected = selected && formatDateKey(selected) === dateKey
                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => selectDay(date)}
                    className={`rounded py-1.5 text-sm text-center transition-colors
                      ${isSelected
                        ? 'bg-[var(--dnd-accent)] text-black font-semibold'
                        : 'text-gray-300 hover:bg-[var(--dnd-border-card)] hover:text-white'}`}
                  >
                    {date.getUTCDate()}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
```

**Usage in CampaignForm:**

```typescript
// Replace:
<input type="date" name="planningWindowStart" required className={inputCls} />

// With:
<DatePickerInput name="planningWindowStart" required placeholder="Planning window start" />
```

**Usage in UpdatePlanningWindowForm:**

```typescript
// Replace:
<input type="date" name="planningWindowStart" defaultValue={planningWindowStart ?? ''} required
  className="..." />

// With:
<DatePickerInput name="planningWindowStart" defaultValue={planningWindowStart ?? undefined} required />
```

### Pattern 2: State Persistence on Validation Error

**What:** Because the picked date lives in React `useState` (not an uncontrolled DOM input), a Server Action returning `{ error: '...' }` via `useActionState` re-renders the form but does NOT reset the date picker — state is preserved in the Client Component.

**Contrast with native `<input type="date">`:** Uncontrolled native inputs DO reset on re-render when the form re-submits and the server returns an error, causing the user to re-pick the date. The custom picker with `useState` avoids this entirely.

### Pattern 3: `updatePlanningWindow` — No `revalidatePath` Needed

**What:** `updatePlanningWindow` already returns `{ success: true }` without `revalidatePath`. `CampaignTabs` handles success by calling `onSuccess()` which closes the inline editor. The surrounding `DashboardCalendar` displays stale window data until a page refresh — this pre-existing behavior is unchanged by this phase.

**STATE.md blocker resolved:** The blocker note asks to confirm whether `updatePlanningWindow` calls `revalidatePath` before implementing a key-based remount. Confirmed: it does NOT. The custom date picker does NOT need a key-based remount strategy. The existing `onSuccess` callback pattern is sufficient.

### Pattern 4: Popover Positioning

**What:** The calendar panel uses `position: absolute` with `z-50` (Tailwind). The trigger's parent container has `position: relative` (enforced via the `<div ref={containerRef} className="relative">`).

**Known concern:** In `CampaignForm`, the date fields are inside `<div className="grid grid-cols-2 gap-4">`. The popover will overflow the grid cell. This is acceptable — `z-50` ensures it paints above other content. The popover should open downward (`mt-1`), which works for both forms since there's always space below the date fields.

**Anti-patterns to avoid:**
- **Do NOT use `position: fixed`** for the popover — the form may be inside a scrolling container and fixed positioning breaks scroll-relative alignment.
- **Do NOT place the hidden input before any other hidden inputs** in the form — a documented Next.js issue (#50087) where hidden inputs at the very start of a form can conflict with the internal `$ACTION_ID` hidden field. Place hidden inputs after other inputs or in the middle of the form.

### Anti-Patterns to Avoid

- **Uncontrolled input for date value:** Using a visible `<input type="text">` that the user can type into creates date parsing complexity. The picker is click-only; a hidden input carries the value.
- **Importing date-fns or dayjs:** The project has zero date libraries. `buildMonthGrid` and `formatDateKey` cover all grid construction and serialization needs.
- **Using `useFormStatus` from react-dom:** Not needed here — the picker does not need to know if the form is pending. `isPending` from `useActionState` in the parent form component handles the submit button.
- **Closing the popover on date hover:** Only close on explicit day selection or outside click/Escape.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month grid construction | Custom calendar grid logic | `buildMonthGrid` from `calendarUtils.ts` | Already exists, tested, handles UTC correctly |
| Date serialization | Custom YYYY-MM-DD formatter | `formatDateKey` from `calendarUtils.ts` | Already exists, uses UTC methods consistently |
| Outside-click detection | Custom event delegation | Standard `document.addEventListener('mousedown', ...)` pattern with `containerRef.contains()` | Simple, well-understood, no library needed |

**Key insight:** The hardest part of a date picker (building the month grid with correct day-of-week alignment) is already solved in `calendarUtils.ts`. The custom picker is primarily a UI composition task.

---

## Common Pitfalls

### Pitfall 1: Timezone Drift in Date Construction

**What goes wrong:** Using `new Date('2026-04-01')` in JavaScript parses as UTC midnight, but `new Date(2026, 3, 1)` (local constructor) creates a local-time Date. If the user's timezone is west of UTC, the local date could be 2026-03-31 when serialized to ISO.

**Why it happens:** JavaScript `Date` is notorious for timezone mixing. The project consistently uses UTC.

**How to avoid:** Always use `new Date(Date.UTC(y, m - 1, d))` when constructing dates from YYYY-MM-DD parts (as `parseDateKey` does in the example above). Always use `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` for display. Use `formatDateKey` for serialization. This is the established pattern in `calendarUtils.ts` and `DashboardCalendar.tsx`.

**Warning signs:** Dates appear one day off for users in UTC-5 or earlier. The month grid renders the wrong first day of week.

### Pitfall 2: Hidden Input Resets on Uncontrolled Re-render

**What goes wrong:** If the hidden input's `value` prop is derived from state that is initialized outside React (`defaultProps` or static string), a server-side re-render can reset it.

**Why it happens:** `UpdatePlanningWindowForm` receives `planningWindowStart` / `planningWindowEnd` as props from the server component. If the form re-renders (e.g., parent page revalidates), the props may change.

**How to avoid:** Initialize picker `useState` from `defaultValue` prop. The `defaultValue` prop is the server-fetched value — once the picker is mounted, local `useState` owns the value. This is the same pattern as controlled inputs elsewhere in the project.

### Pitfall 3: Hidden Input Name Collision with `$ACTION_ID`

**What goes wrong:** A hidden input placed as the first element in a `<form>` can conflict with Next.js's internally injected `$ACTION_ID` hidden field, causing the server action to receive the wrong data.

**Why it happens:** Next.js App Router injects a hidden `$ACTION_ID` field to route the form to the correct server action. If a custom hidden field with the same order appears before it, the FormData may be malformed.

**How to avoid:** Do not place the `<input type="hidden">` as the very first element in the form. In `DatePickerInput`, it is rendered first within the component's own `<div>`, but it appears after other fields because `CampaignForm` renders the campaign name field first. Verify the DOM order is safe.

**Warning signs:** Server action receives `null` for `planningWindowStart` even though the picker shows a date.

### Pitfall 4: Popover Clips Inside Overflow-Hidden Container

**What goes wrong:** If any ancestor element has `overflow: hidden`, the absolute-positioned popover will be clipped and invisible.

**Why it happens:** Tailwind's responsive utilities often apply `overflow-hidden` on card wrappers. The `UpdatePlanningWindowForm` is rendered inside `CampaignTabs` inside a border-radius card.

**How to avoid:** Inspect the DOM ancestry for `overflow: hidden`. In the current code, the inline editor div (`<div className="border border-[var(--dnd-border-muted)] rounded-lg px-4 pt-4 pb-2 mb-4 bg-[#140326]/80">`) does not have overflow-hidden — confirmed safe. If overflow clipping occurs at runtime, switch the popover to `position: fixed` with calculated coordinates.

**Warning signs:** Calendar popover disappears when it would extend past the card boundary.

### Pitfall 5: Mobile — No Touch-Friendly Popover Dismiss

**What goes wrong:** On mobile, tapping outside the popover may not fire `mousedown`. The popover stays open.

**Why it happens:** Touch events do not always dispatch `mousedown` on all browsers.

**How to avoid:** Listen for both `mousedown` and `touchstart` in the outside-click handler. Alternatively, use a full-screen invisible overlay (as used in `CampaignTabs` for the date side panel) — a `<div className="fixed inset-0 z-40">` behind the popover that fires `onClick` to close.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Building the Month Grid (from existing calendarUtils.ts)

```typescript
// Source: src/lib/calendarUtils.ts (already in project)
import { buildMonthGrid, formatDateKey } from '@/lib/calendarUtils'

// Year = 2026, Month = 3 (April, 0-indexed)
const grid = buildMonthGrid(2026, 3)
// Returns: (Date | null)[][] — array of weeks, each week 7 cells
// null = padding cell before/after the month

grid.map(week => week.map(date => date ? formatDateKey(date) : null))
// [['2026-03-29', '2026-03-30', '2026-03-31', '2026-04-01', ...], ...]
```

### Parsing YYYY-MM-DD to UTC Date (safe)

```typescript
// Safe UTC construction — matches the pattern in toggleDmException
function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
```

### Hidden Input for FormData

```typescript
// Pattern: hidden input carries the date value to the Server Action
// Server Action reads: formData.get('planningWindowStart') -> 'YYYY-MM-DD'
// No change to createCampaign or updatePlanningWindow needed.
<input type="hidden" name="planningWindowStart" value={formattedValue} />
```

### Outside-Click Dismiss (from DashboardCalendar pattern)

```typescript
// Consistent with existing CampaignTabs overlay pattern
useEffect(() => {
  if (!open) return
  function onClick(e: MouseEvent) {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }
  document.addEventListener('mousedown', onClick)
  return () => document.removeEventListener('mousedown', onClick)
}, [open])
```

### Removing the Existing CSS for Native Date Icon

The `globals.css` has:

```css
/* Make native date picker calendar icon visible on dark backgrounds */
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}
```

Once the native `<input type="date">` fields are replaced, this rule becomes dead code. It can be removed or left in place (it is harmless since no `type="date"` inputs will remain in scope).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Native `<input type="date">` with browser popup | Custom React calendar component with styled popover | This phase | Consistent purple/dark theme, no browser-native UI intrusion |
| `react-day-picker` v8 (required date-fns peer dep) | `react-day-picker` v9 (bundles date-fns internally) | v9.0.0 (2024) | Simpler install, but still adds ~15KB; not needed here |
| `useFormState` (deprecated) | `useActionState` from React (already used in project) | React 19 | `CampaignForm` and `UpdatePlanningWindowForm` already use `useActionState` correctly |

**Deprecated/outdated:**
- `useFormState` from `react-dom/server`: Replaced by `useActionState` from `react`. Already migrated in this project.
- CSS `::-webkit-calendar-picker-indicator` override in `globals.css`: Becomes dead code after this phase.

---

## Open Questions

1. **Should the calendar popover open above or below the trigger?**
   - What we know: Both forms have visible space below the date fields before the submit button
   - What's unclear: On very short viewports or when the inline editor is near the bottom of the screen, downward opening may clip
   - Recommendation: Default to downward (`mt-1`); add a `popover-up` variant if visual testing shows clipping on the planning window inline editor

2. **Should `required` validation be enforced client-side for the hidden input?**
   - What we know: `<input type="hidden" required>` does NOT trigger browser validation — browsers ignore `required` on hidden inputs
   - What's unclear: The Server Actions already validate `if (!startVal || !endVal) return { error: '...' }` and return errors via `useActionState`
   - Recommendation: Rely on server-side validation as before. Optionally add visual feedback (red trigger border) if `state?.error` mentions the date field

3. **Should `DatePickerInput` accept a `min` / `max` date constraint?**
   - What we know: `createCampaign` validates that end > start server-side; there is no constraint on how far in the past/future dates can be
   - What's unclear: UX expectation — should the picker prevent selecting a past date?
   - Recommendation: Omit min/max for now; the success criteria do not mention date constraints, and Server Actions enforce business rules

---

## Sources

### Primary (HIGH confidence)

- Codebase: `src/components/CampaignForm.tsx` — confirmed `<input type="date">` targets, `useActionState` pattern
- Codebase: `src/components/UpdatePlanningWindowForm.tsx` — confirmed `<input type="date">` targets, `defaultValue` prop
- Codebase: `src/lib/actions/campaign.ts` — confirmed `formData.get('planningWindowStart')` reads raw string, `new Date(startVal)` construction
- Codebase: `src/lib/calendarUtils.ts` — confirmed `buildMonthGrid` and `formatDateKey` are available and correct
- Codebase: `src/components/DashboardCalendar.tsx` — confirmed grid rendering pattern and UTC date discipline
- Codebase: `src/app/globals.css` — confirmed design tokens (`--dnd-accent`, `--dnd-input-bg`, etc.)
- Official Next.js docs: [Forms Guide](https://nextjs.org/docs/app/guides/forms) — hidden input FormData pattern
- React DayPicker docs: [Styling](https://daypicker.dev/docs/styling) — confirmed `classNames` prop and CSS variable support

### Secondary (MEDIUM confidence)

- [React DayPicker v9 Changelog](https://daypicker.dev/changelog) — v9.14.0 current, date-fns bundled internally
- [Next.js issue #50087](https://github.com/vercel/next.js/issues/50087) — hidden input placement caveat re: $ACTION_ID
- [Next.js issue #72949](https://github.com/vercel/next.js/issues/72949) — form input reset behavior on Server Action re-render; confirms useState preserves value

### Tertiary (LOW confidence)

- WebSearch: General patterns for outside-click dismiss with `containerRef.contains()` — standard React pattern, widely documented

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — codebase directly examined; all utilities verified to exist
- Architecture: HIGH — hidden input + useState pattern is well-established; confirmed against Server Action code
- Pitfalls: HIGH (timezone, hidden input placement) / MEDIUM (overflow clipping, mobile touch) — timezone issue verified against existing code patterns; overflow clipping unconfirmed by runtime testing

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain — React, Next.js, Tailwind APIs are stable)
