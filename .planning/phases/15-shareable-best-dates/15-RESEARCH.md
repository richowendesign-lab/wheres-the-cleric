# Phase 15: Shareable Best Dates — Research

**Researched:** 2026-03-11
**Domain:** Clipboard API, message formatting, React client component button
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COPY-01 | DM can copy a formatted best-dates message from the campaign dashboard with one-click "Copied!" feedback | navigator.clipboard.writeText pattern already proven in CopyLinkButton and ShareModal; add a sibling "Copy best dates" button in BestDaysList section |
| COPY-02 | Copied message lists top 3 dates with day name, full date, and plain-English availability ("everyone free" / "3/4 free, Alex busy") | computeBestDays returns DayAggregation[]; slice top 3 after applying dmExceptionMode filter; build string using formatBestDayLabel + freeCount/totalPlayers + playerStatuses lookup |
</phase_requirements>

---

## Summary

Phase 15 is a small, self-contained UI addition. The DM needs a single "Copy best dates" button on the Availability tab that places a human-readable scheduling message on the clipboard. The project already has two working examples of this exact clipboard pattern: `CopyLinkButton` (a standalone reusable component) and the `CopyButton` inside `ShareModal` (an unexported local helper). The implementation follows the same `useState` + `navigator.clipboard.writeText` approach used across both prior implementations.

The message content is derivable entirely from data already passed to `BestDaysList`: `days: DayAggregation[]`, `playerSlots: { id: string; name: string }[]`, and `dmExceptionMode`. The `computeBestDays` function already produces the ranked list; slicing it to 3 and formatting each entry as "Day DD Mon — everyone free" or "Day DD Mon — 3/4 free, Alex busy" requires only a small pure utility function. No new API routes, server actions, or data fetching are needed.

The natural home for the button is inside or directly above `BestDaysList`, which lives in `CampaignTabs` (a `'use client'` component). `BestDaysList` itself is already a Client Component, so clipboard access is permitted. The "Copied!" snackbar/feedback can follow the existing 2-second timeout pattern used in both existing copy buttons.

**Primary recommendation:** Add a self-contained "Copy best dates" Client Component (modelled on `CopyLinkButton`) that accepts the top-3 best days data and renders a button; place it in the `BestDaysList` section header row inside `CampaignTabs`. No new dependencies required.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `navigator.clipboard` (Web API) | Browser built-in | Write formatted string to clipboard | Already used in 2 existing components; async/await pattern established |
| React `useState` | 19.2.3 | Toggle "Copied!" label for 2s | Already used in all copy buttons in the project |
| Tailwind CSS v4 | `^4` | Styling the button | Project-wide utility class convention |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `computeBestDays` from `@/lib/availability` | Internal | Produces ranked DayAggregation[] | Used by BestDaysList already; reuse same call |
| `formatBestDayLabel` from `@/lib/availability` | Internal | 'Sat 8 Mar' short label | Already produces weekday + day + month; extend to full date for message |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `navigator.clipboard.writeText` | `document.execCommand('copy')` | Legacy, deprecated, no async; not used anywhere in project |
| Inline button in `BestDaysList` | New standalone component | Standalone is more testable; inline keeps it co-located — either works, planner decides |
| `formatBestDayLabel` (short) | Custom long format | Requirement says "day name, full date" — need weekday + full date (e.g. "Saturday 8 March 2026") |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── BestDaysList.tsx        # Add "Copy best dates" button here, or extract helper
│   └── CopyBestDatesButton.tsx # Optional: self-contained button component
├── lib/
│   └── availability.ts         # Add formatCopyMessage() pure utility function here
```

### Pattern 1: Clipboard Button (established project pattern)

**What:** Client Component with `useState(false)` copied flag; `onClick` calls `navigator.clipboard.writeText(text)`, sets `copied = true`, resets after 2 seconds.

**When to use:** Any one-click copy-to-clipboard interaction.

**Example (from `CopyLinkButton.tsx`, production code):**

```typescript
'use client'
import { useState } from 'react'

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="px-3 py-1 rounded text-sm bg-[var(--dnd-accent)] text-black hover:bg-[var(--dnd-accent-hover)] transition-colors"
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}
```

The `CopyBestDatesButton` for Phase 15 should follow this exact pattern, accepting pre-built message text rather than computing it internally (separation of concerns).

### Pattern 2: Message Formatting as Pure Utility

**What:** Pure function in `@/lib/availability.ts` that takes `DayAggregation[]`, `{ id, name }[]`, `dmExceptionMode`, and returns a formatted string. No React dependency.

**When to use:** Logic that transforms domain data into a text string — belongs in `lib/`, not in a component.

**Proposed function signature:**

```typescript
// In src/lib/availability.ts
export function formatBestDatesMessage(
  days: DayAggregation[],
  playerSlots: { id: string; name: string }[],
  dmExceptionMode: 'block' | 'flag' | null,
): string
```

**Message format derivation from COPY-02:**

```
Saturday 8 March — everyone free
Sunday 9 March — 3/4 free, Alex busy
Tuesday 11 March — 2/4 free, Alex, Sam busy
```

Logic:
1. Apply dmExceptionMode filter (same as `BestDaysList` display filter): `dmExceptionMode === 'block'` → exclude `dmBlocked` days before ranking
2. Take top 3 from `computeBestDays(filtered)` (or call `computeBestDays` on all days then filter, matching existing `BestDaysList` logic exactly)
3. For each day:
   - Date label: full weekday + day + month (e.g. "Saturday 8 March") — `toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })`
   - If `day.allFree` → "everyone free"
   - Else → `"${day.freeCount}/${day.totalPlayers} free"` + list of busy player names

**Busy player name logic:**

```typescript
const busyNames = playerSlots
  .filter(slot => day.playerStatuses[slot.id] !== 'free')
  .map(slot => slot.name)
// "no-response" players are treated as busy (consistent with BestDaysList unavailable logic)
// BestDaysList decision from STATE.md: unavailable = !free (playerStatuses is 'free' | 'no-response')
```

**If fewer than 3 best days exist:** The function should return whatever is available (1 or 2 dates). This is an edge case — COPY-02 says "exactly 3 dates, no more" but the success criteria says "top 3 dates." If fewer than 3 exist with free players, include all available. Document in code comment.

### Anti-Patterns to Avoid

- **Computing message inside the button's `onClick`:** Message computation should be done before render (pure function called at render time, passed as a prop to the button), not inside the async click handler — simpler, testable, avoids stale closure bugs.
- **Using `document.execCommand('copy')`:** Deprecated. The project already uses `navigator.clipboard.writeText` everywhere.
- **Fetching fresh data on button click:** The data is already on the client (passed via props to CampaignTabs and BestDaysList). No server round-trip needed.
- **Putting the button in a Server Component:** `navigator.clipboard` is browser-only. Must be in a `'use client'` component. Both `CampaignTabs` and `BestDaysList` are already client components.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard write | Custom textarea + select + execCommand | `navigator.clipboard.writeText()` | Project already uses this; async, clean, modern |
| Best day ranking | Custom sort/filter | `computeBestDays()` from `@/lib/availability.ts` | Already implemented, tested-by-use in Phase 14 |
| "Copied!" feedback | Toast/snackbar system | Simple `useState` + `setTimeout` toggle on button label | The project pattern is label toggle, not a toast (see CopyLinkButton and ShareModal CopyButton) |

**Key insight:** This phase is almost entirely composition of existing primitives. The only new code is a format function and a button component.

---

## Common Pitfalls

### Pitfall 1: Date Formatting Timezone Drift

**What goes wrong:** Using `new Date(dateKey).toLocaleDateString(...)` without UTC forcing produces incorrect day names in non-UTC timezones (e.g. a UTC midnight date appears as the previous day in UTC-5).

**Why it happens:** JavaScript `new Date('2026-03-08')` parses as UTC midnight, but `toLocaleDateString` uses local timezone by default.

**How to avoid:** Use the same pattern established in `calendarUtils.ts` and `availability.ts` — parse the YYYY-MM-DD string manually, construct `new Date(Date.UTC(y, m-1, d))`, and pass `timeZone: 'UTC'` to `toLocaleDateString`.

**Warning signs:** Date labels show the wrong weekday for users in negative-offset timezones (Americas).

```typescript
// WRONG
new Date(dateKey).toLocaleDateString('en-GB', { weekday: 'long' })

// RIGHT (project pattern)
const [y, m, d] = dateKey.split('-').map(Number)
const date = new Date(Date.UTC(y, m - 1, d))
date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
```

### Pitfall 2: DM Exception Filter Mismatch with BestDaysList

**What goes wrong:** The "copy" message shows different dates than what the DM sees in the ranked list UI.

**Why it happens:** `BestDaysList` filters `dmBlocked` days when `dmExceptionMode === 'block'` AFTER calling `computeBestDays`. If `formatBestDatesMessage` applies a different filter order, the rankings diverge.

**How to avoid:** Mirror `BestDaysList` logic exactly:
```typescript
const bestDays = computeBestDays(days)  // top-5 from all days
const displayDays = dmExceptionMode === 'block'
  ? bestDays.filter(d => !d.dmBlocked)
  : bestDays
const top3 = displayDays.slice(0, 3)
```

Do not pre-filter before `computeBestDays` — this changes which days rank in the top-5.

### Pitfall 3: Clipboard Permissions in Insecure Contexts

**What goes wrong:** `navigator.clipboard.writeText` throws in non-HTTPS contexts (except localhost).

**Why it happens:** Clipboard API requires a secure context (HTTPS or localhost).

**How to avoid:** Production is HTTPS (Neon DB hosted app). Localhost dev works. No special handling needed. Document assumption in code comment.

### Pitfall 4: "everyone free" When There Are No Players

**What goes wrong:** `day.allFree` is `true` when `freeCount === totalPlayers && totalPlayers > 0`, but if there are somehow zero players, the message could read "everyone free" incorrectly.

**Why it happens:** Edge case where campaign has no player slots yet.

**How to avoid:** Guard: if `displayDays.length === 0`, return a fallback string like `"No scheduling data yet."` The button should either be hidden or copy this fallback. Simplest: hide the button when `displayDays.length === 0` (same logic as BestDaysList empty state).

---

## Code Examples

Verified patterns from the project codebase:

### Clipboard Write (from `CopyLinkButton.tsx`)

```typescript
// Source: src/components/CopyLinkButton.tsx
await navigator.clipboard.writeText(text)
setCopied(true)
setTimeout(() => setCopied(false), 2000)
```

### Date Formatting (UTC-safe, from `CampaignTabs.tsx` formatPanelDate)

```typescript
// Source: src/components/CampaignTabs.tsx
function formatPanelDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}
// For the message, omit year (matching the invite message tone: "Saturday 8 March")
```

### BestDaysList Filter Logic (from `BestDaysList.tsx`)

```typescript
// Source: src/components/BestDaysList.tsx
const bestDays = computeBestDays(days)
const displayDays = dmExceptionMode === 'block'
  ? bestDays.filter(d => !d.dmBlocked)
  : bestDays
```

### Proposed `formatBestDatesMessage` Skeleton

```typescript
// To add in: src/lib/availability.ts
export function formatBestDatesMessage(
  days: DayAggregation[],
  playerSlots: { id: string; name: string }[],
  dmExceptionMode: 'block' | 'flag' | null,
): string {
  const bestDays = computeBestDays(days)
  const displayDays = dmExceptionMode === 'block'
    ? bestDays.filter(d => !d.dmBlocked)
    : bestDays
  const top3 = displayDays.slice(0, 3)

  if (top3.length === 0) return 'No scheduling data yet.'

  const lines = top3.map(day => {
    const [y, m, d] = day.date.split('-').map(Number)
    const label = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    })
    if (day.allFree) return `${label} — everyone free`
    const busyNames = playerSlots
      .filter(slot => day.playerStatuses[slot.id] !== 'free')
      .map(slot => slot.name)
    return `${label} — ${day.freeCount}/${day.totalPlayers} free, ${busyNames.join(', ')} busy`
  })

  return `Best dates for our next session:\n\n${lines.join('\n')}`
}
```

### Proposed `CopyBestDatesButton` Component Skeleton

```typescript
// src/components/CopyBestDatesButton.tsx
'use client'
import { useState } from 'react'

export function CopyBestDatesButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(message)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="px-3 py-1.5 rounded text-sm bg-[var(--dnd-accent)] text-black hover:bg-[var(--dnd-accent-hover)] transition-colors font-medium"
    >
      {copied ? 'Copied!' : 'Copy best dates'}
    </button>
  )
}
```

### Integration point in `BestDaysList.tsx`

The button should appear in the section header row alongside the "Best Days" heading — or directly below it, above the list. The message is computed before render:

```typescript
// In BestDaysList or in its parent CampaignTabs:
import { formatBestDatesMessage } from '@/lib/availability'

const message = formatBestDatesMessage(days, playerSlots, dmExceptionMode)

// In JSX, alongside the "Best Days" h2:
<div className="flex items-center justify-between mb-2">
  <h2 className="text-white font-semibold text-lg">Best Days</h2>
  {displayDays.length > 0 && <CopyBestDatesButton message={message} />}
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | ~2018 (Chrome 66) | Async, cleaner, no DOM manipulation required |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated in all modern browsers. Not used anywhere in this project. Do not introduce it.

---

## Open Questions

1. **Where exactly should the button live — inside `BestDaysList` or in `CampaignTabs`?**
   - What we know: `BestDaysList` is the natural visual location. It already has all the required data (`days`, `playerSlots`, `dmExceptionMode`). `CampaignTabs` is its parent and also has all this data.
   - What's unclear: Adding the button inside `BestDaysList` keeps it co-located with the list. Moving it to `CampaignTabs` keeps `BestDaysList` a pure display component. Both are valid.
   - Recommendation: Add it inside `BestDaysList` — it needs the same data, the component is already a Client Component, and it avoids prop-drilling message strings through `CampaignTabs`. Planner should confirm.

2. **Header text for the copied message**
   - What we know: COPY-02 specifies content (3 dates, day name, full date, availability summary) but not a preamble line.
   - What's unclear: Should the message begin with an intro line like "Best dates for our next session:" or just list the dates?
   - Recommendation: Include a short intro line (matches the invite message pattern in `ShareModal`). The planner should define the exact string.

3. **Button label: "Copy best dates" vs "Copy to clipboard" vs another variant**
   - What we know: COPY-01 says "Copy best dates" button — use that label literally.
   - Recommendation: Use "Copy best dates" as default, switches to "Copied!" for 2s.

---

## Validation Architecture

> Skipped — `workflow.nyquist_validation` is not set to `true` in `.planning/config.json`.

---

## Sources

### Primary (HIGH confidence)

- `src/components/CopyLinkButton.tsx` — established clipboard copy pattern (`navigator.clipboard.writeText`, `useState` toggle, 2s timeout)
- `src/components/ShareModal.tsx` — second instance of same pattern; `CopyButton` local helper; confirmed 2000ms timeout
- `src/components/BestDaysList.tsx` — confirmed `computeBestDays` + `dmExceptionMode` filter logic; all required data already present as props
- `src/lib/availability.ts` — `DayAggregation` type, `computeBestDays()`, `formatBestDayLabel()`; `playerStatuses` record keyed by slot ID
- `src/components/CampaignTabs.tsx` — `formatPanelDate()` (UTC-safe date formatting); confirmed all data flows to `BestDaysList` already; button goes in availability tab
- `src/app/campaigns/[id]/page.tsx` — data serialization; confirmed `playerSlots` and `dayAggregations` reach client boundary
- `.planning/REQUIREMENTS.md` — COPY-01 and COPY-02 verbatim requirements
- `package.json` — stack confirmation: Next.js 16, React 19, Tailwind v4, no clipboard library needed

### Secondary (MEDIUM confidence)

- MDN Clipboard API spec: `navigator.clipboard.writeText()` requires secure context (HTTPS or localhost); returns Promise<void>; supported in all modern browsers since 2018.

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; pattern verified in 2 production components
- Architecture: HIGH — data flow fully traced; no unknowns
- Pitfalls: HIGH — timezone pitfall verified against project patterns; filter mismatch is a concrete logical risk documented from source code review

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable Web API, stable project codebase)
