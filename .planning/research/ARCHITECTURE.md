# Architecture Patterns

**Domain:** D&D session scheduler — v1.3 feature integration
**Researched:** 2026-03-09
**Confidence:** HIGH — based on direct codebase inspection, not training data assumptions

---

## Context: What Already Exists

The codebase is well-structured. Before detailing integrations, here is the load-bearing
architecture that v1.3 features must work within:

- Server Components own all data fetching (campaign detail page, campaigns list page)
- `useActionState` + Server Actions own all mutations (forms, toggles, updates)
- Client Components are scoped to interactivity only, with `'use client'` at the file boundary
- `redirect()` in Server Actions is called outside try/catch — this is correct and must stay that way
- Cookie identity: DM via `dm_session_token` httpOnly cookie; players via `player_id` cookie
- UTC-everywhere date discipline: all date math uses `Date.UTC`, all keys are `YYYY-MM-DD` strings

---

## Question 1: Where Does DM Unavailability Data Live?

**Recommendation: New `DmAvailabilityException` model, not a Campaign field.**

**Rationale:**

A Campaign field (e.g. a JSON column of date strings) would work for a single set of blocked
dates, but it conflates two concerns: campaign metadata vs. a per-date availability record.
The existing schema already separates these cleanly with `AvailabilityEntry` for players.
DM exceptions follow the same shape — they are date-specific records, not campaign-level config.

A dedicated model also enables the per-campaign toggle (`block` vs `flag` behaviour) to be
stored alongside the exception set, and allows future extensibility (e.g. time-of-day ranges,
recurring DM patterns) without a schema migration.

**Proposed schema addition:**

```prisma
model DmAvailabilityException {
  id         String   @id @default(cuid())
  campaignId String
  date       DateTime // UTC midnight, specific date only
  createdAt  DateTime @default(now())
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([campaignId, date])
}
```

**Campaign model gets one new field** for the toggle behaviour:

```prisma
model Campaign {
  // ... existing fields ...
  dmExceptionMode  String?  // "block" | "flag" | null (null = feature off)
  dmExceptions     DmAvailabilityException[]
}
```

Using `String?` for `dmExceptionMode` follows the existing pattern for `name`, `description`,
and `maxPlayers` — optional strings rather than DB-level enums, validated in the Server Action.
Setting it to `null` means the DM has not enabled this feature for the campaign.

**Data access pattern:**

The campaign detail Server Component already fetches `playerSlots` with `include`. Add
`dmExceptions: true` to the same include. No additional query needed.

```typescript
const campaign = await prisma.campaign.findUnique({
  where: { id },
  include: {
    playerSlots: { include: { availabilityEntries: true }, orderBy: { createdAt: 'asc' } },
    dmExceptions: true,  // new
  },
})
```

Pass `dmExceptions` as a serialized array (date strings) to the `DashboardCalendar` and
`BestDaysList` components, following the same serialisation pattern already used for
`availabilityEntries`.

**Confidence:** HIGH — consistent with existing schema patterns; directly inspected.

---

## Question 2: Share Modal After Campaign Creation

**The core problem:** `createCampaign` in `src/lib/actions/campaign.ts` ends with a hard
`redirect(`/campaigns/${campaign.id}`)`. React renders the destination page as a Server
Component. Server Components cannot open modals — there is no client state at render time.

**Recommended pattern: URL search param as modal trigger.**

This is the idiomatic Next.js App Router solution. It requires no extra state management,
survives page refresh (modal re-opens), and needs minimal changes to existing code.

**Step 1 — Modify `createCampaign` server action to include a flag:**

```typescript
redirect(`/campaigns/${campaign.id}?share=1`)
```

`redirect()` must remain outside try/catch. This line already works correctly; just append
the query string.

**Step 2 — Campaign detail page reads the param and passes it to a Client Component:**

```typescript
// src/app/campaigns/[id]/page.tsx (Server Component)
export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ share?: string }>
}) {
  const { id } = await params
  const { share } = await searchParams
  // ... existing data fetch ...

  return (
    <main>
      {/* ... existing JSX ... */}
      {share === '1' && (
        <ShareModal joinUrl={joinUrl} />
      )}
    </main>
  )
}
```

**Step 3 — `ShareModal` is a Client Component** that opens immediately (no trigger button
needed — it mounts open) and provides one-click copy plus a pre-written paste message:

```typescript
// src/components/ShareModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function ShareModal({ joinUrl }: { joinUrl: string }) {
  const [open, setOpen] = useState(true)
  const router = useRouter()

  function dismiss() {
    setOpen(false)
    // Remove ?share=1 from URL without navigation (clean URL)
    router.replace(window.location.pathname, { scroll: false })
  }

  if (!open) return null

  const pasteMessage = `Join my D&D campaign! Set your availability here: ${joinUrl}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ...">
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={dismiss} />
      {/* panel */}
      <div className="relative ...">
        <h2>Campaign created!</h2>
        <p>Share this link with your players:</p>
        <code>{joinUrl}</code>
        <CopyButton text={joinUrl} label="Copy link" />
        <CopyButton text={pasteMessage} label="Copy invite message" />
        <button onClick={dismiss}>Done</button>
      </div>
    </div>
  )
}
```

`router.replace(window.location.pathname, { scroll: false })` cleans the `?share=1` from the
URL without triggering a navigation or re-render of the Server Component.

**Why not use local state in `CampaignForm`?** `CampaignForm` is a `'use client'` component,
but after `createCampaign` calls `redirect()`, the component tree is fully replaced by the
new page. No client state survives a server-side redirect. The URL param is the only durable
signal that crosses the redirect boundary.

**Why not use a separate `/campaigns/[id]/new-share` route?** That route would need to render
the full campaign detail page anyway. The search param approach adds one conditional render to
the existing page with no route sprawl.

**Confidence:** HIGH — directly follows from how `redirect()` and `searchParams` work in
Next.js App Router; consistent with existing pattern of `searchParams` usage in middleware.

---

## Question 3: Custom Date Picker Integration

**Recommendation: One `DatePicker` Client Component, consumed via a hidden `<input>` for form
submission.**

The existing date pickers are `<input type="date">` elements inside form components. Both
`CampaignForm` (in `/campaigns/new`) and `UpdatePlanningWindowForm` (in the campaign detail
page) use this pattern. The DM availability exception picker on the campaign detail page will
also need date selection, but that is a calendar click (like `AvailabilityCalendar`) rather
than a text-input date.

**Component design:**

```typescript
// src/components/DatePicker.tsx
'use client'
// Props:
// - name: string          — the hidden input name for form submission
// - defaultValue?: string — 'YYYY-MM-DD' initial value
// - min?: string          — 'YYYY-MM-DD' lower bound
// - max?: string          — 'YYYY-MM-DD' upper bound
// - label: string
// - required?: boolean
```

The component renders:
1. A styled trigger button showing the selected date (or placeholder)
2. A dropdown calendar (single-month grid, matching `AvailabilityCalendar`'s existing grid
   builder logic)
3. A `<input type="hidden" name={name} value={selectedDate} />` — this is what
   `useActionState`/form actions read, so no changes to Server Actions are needed

**Key design decision: hidden input, not controlled input.**

`CampaignForm` and `UpdatePlanningWindowForm` submit to Server Actions via `formAction`.
Server Actions read `formData.get('planningWindowStart')`. The hidden input approach means
Server Actions are unchanged — they still call `formData.get('planningWindowStart')` and get
a `YYYY-MM-DD` string back. Only the visible UI changes.

**Reuse in `CampaignForm`:**

```typescript
// Before (CampaignForm.tsx):
<input type="date" name="planningWindowStart" required className={inputCls} />

// After:
<DatePicker name="planningWindowStart" label="Planning window start" required />
```

**Reuse in `UpdatePlanningWindowForm`:**

```typescript
// Before:
<input type="date" name="planningWindowStart" defaultValue={toVal(campaign.planningWindowStart)} required ... />

// After:
<DatePicker name="planningWindowStart" label="Start date" defaultValue={toVal(campaign.planningWindowStart)} required />
```

**Reuse for DM availability exceptions:**

The exception picker is different — the DM clicks dates on a calendar grid (like
`AvailabilityCalendar`) rather than selecting a single date from a picker. This does not need
`DatePicker` at all. It needs a new `DmExceptionCalendar` component that mirrors
`AvailabilityCalendar`'s grid but calls a `toggleDmException` Server Action on click.

**Grid builder extraction:**

Both `AvailabilityCalendar.tsx` and `DashboardCalendar.tsx` currently contain identical
`buildMonthGrid` and `formatDateKey` helper functions (copied, not shared). The custom date
picker needs a month grid too. Extracting these to `src/lib/calendarUtils.ts` is the correct
move — do it as part of this milestone to avoid a third copy.

```typescript
// src/lib/calendarUtils.ts
export function buildMonthGrid(year: number, month: number): (Date | null)[][]
export function formatDateKey(date: Date): string
```

**Confidence:** HIGH — directly follows from inspecting the three files that need date inputs.

---

## Question 4: Best Days Copy-to-Clipboard in a Server Component Context

**`BestDaysList` is currently a Server Component. Clipboard API requires `'use client'`.**

`BestDaysList.tsx` has no `'use client'` directive and no interactivity. It receives `days` and
`playerSlots` as props and renders a static list. `navigator.clipboard.writeText()` is a
browser API — it cannot be called from a Server Component.

**Two valid approaches:**

**Option A (recommended): Extract `CopyBestDaysButton` as a narrow Client Component.**

Add `'use client'` only to a small button component. `BestDaysList` stays a Server Component
and passes the pre-formatted message string as a prop.

```typescript
// src/components/CopyBestDaysButton.tsx
'use client'
import { useState } from 'react'

export function CopyBestDaysButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false)
  async function handleClick() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleClick} className="...">
      {copied ? 'Copied!' : 'Copy best days'}
    </button>
  )
}
```

In `BestDaysList.tsx` (stays Server Component):

```typescript
import { CopyBestDaysButton } from './CopyBestDaysButton'

// Build the message from bestDays in the Server Component:
const message = bestDays
  .map((day, i) => `${i + 1}. ${formatBestDayLabel(day.date)} — ${day.freeCount}/${day.totalPlayers} players free`)
  .join('\n')

// Render:
<CopyBestDaysButton message={message} />
```

**Why Option A over Option B (promoting BestDaysList to `'use client'`):**

Adding `'use client'` to `BestDaysList` would work but is unnecessary. The component does
no interactivity beyond the copy button. Keeping it as a Server Component means React does
not hydrate it — smaller client bundle. This follows the existing project principle of using
Client Components only where interactivity is required.

**The `message` format for the paste text:**

```
Best days for our next session:

1. Sat 15 Mar — 4/4 players free
2. Sun 16 Mar — 3/4 players free
3. Sat 22 Mar — 3/4 players free
```

Build this string in `BestDaysList` before passing to `CopyBestDaysButton`. No computation
needed in the Client Component.

**Confidence:** HIGH — directly follows from inspecting `BestDaysList.tsx` and
`CopyLinkButton.tsx`; consistent with existing pattern used for `CopyLinkButton`.

---

## Component Boundaries Summary

| Component | Type | Status | Notes |
|-----------|------|--------|-------|
| `CampaignForm` | Client | Modify | Replace `<input type="date">` with `<DatePicker>` |
| `UpdatePlanningWindowForm` | Client | Modify | Replace `<input type="date">` with `<DatePicker>` |
| `BestDaysList` | Server | Modify | Add `CopyBestDaysButton`; build message string here |
| `CopyBestDaysButton` | Client | New | Clipboard only; receives pre-built message string |
| `DatePicker` | Client | New | Styled calendar picker with hidden input |
| `ShareModal` | Client | New | Mounts open; reads `joinUrl` prop; cleans URL on dismiss |
| `DmExceptionCalendar` | Client | New | Calendar grid for marking DM unavailability |
| `campaigns/[id]/page.tsx` | Server | Modify | Add `searchParams`, pass `share` and `dmExceptions` |
| `createCampaign` action | Server | Modify | Append `?share=1` to redirect target |
| Prisma schema | — | Modify | Add `DmAvailabilityException` model; add `dmExceptionMode` to Campaign |
| `src/lib/calendarUtils.ts` | Utility | New | Extract shared `buildMonthGrid` + `formatDateKey` |
| `src/lib/actions/campaign.ts` | Server | Add | `toggleDmException` Server Action |

---

## Data Flow Changes

### Share Modal Flow

```
User submits CampaignForm
  → createCampaign Server Action runs
  → prisma.campaign.create()
  → redirect('/campaigns/[id]?share=1')   ← only change to existing action
  → CampaignDetailPage Server Component renders
  → searchParams.share === '1' → passes joinUrl to ShareModal
  → ShareModal Client Component mounts open
  → User clicks dismiss
  → router.replace(pathname)              ← removes ?share=1 from URL
```

### DM Exception Flow

```
DM clicks date on DmExceptionCalendar
  → optimistic UI update (toggle in local state)
  → toggleDmException(campaignId, dateKey) Server Action called
  → prisma.dmAvailabilityException upsert/delete
  → return { success: true } or { error: '...' }
  → on error: revert optimistic state, show toast

DashboardCalendar receives dmExceptions array (serialized date strings)
  → computeDayStatuses (or new computeDayStatusesWithDmExceptions) marks days
  → mode='block': excluded from best days computation
  → mode='flag': shown with visual indicator in calendar + still ranked
```

### Custom Date Picker Flow

```
DatePicker mounted with name="planningWindowStart"
  → User opens dropdown calendar
  → User selects date → selectedDate state updates
  → Hidden <input type="hidden" name="planningWindowStart" value={selectedDate} />
  → Form submits → Server Action reads formData.get('planningWindowStart')
  → Unchanged from current behaviour
```

---

## Build Order (Dependency-Aware)

1. **Schema migration first** — `DmAvailabilityException` model + `dmExceptionMode` on
   Campaign. Everything downstream depends on the schema being in place.

2. **`src/lib/calendarUtils.ts` extraction** — Both `DatePicker` and `DmExceptionCalendar`
   need the grid builder. Extract before writing either component. Also update
   `AvailabilityCalendar` and `DashboardCalendar` to import from the shared util (removes
   duplication).

3. **`DatePicker` component** — No dependencies beyond `calendarUtils`. Swap into
   `CampaignForm` and `UpdatePlanningWindowForm` once complete. Visual regression is easy to
   spot immediately.

4. **Share modal** — Two parts in sequence: (a) modify `createCampaign` to append `?share=1`,
   (b) build `ShareModal` and wire into campaign detail page. Part (a) is a one-line change.

5. **`CopyBestDaysButton` + `BestDaysList` modification** — Narrow change; can be done in
   parallel with share modal since there are no shared dependencies.

6. **`DmExceptionCalendar` + `toggleDmException` action** — Depends on schema (step 1) and
   `calendarUtils` (step 2). Wire into campaign detail page. Connect `dmExceptions` data to
   `computeDayStatuses` logic last, after visual component is working.

---

## Patterns to Follow

### Pattern: Narrow Client Component Islands

Existing codebase uses this consistently. `CopyLinkButton`, `EditableCampaignField`,
`DeleteCampaignButton` are all small Client Components embedded in a Server Component page.
New `CopyBestDaysButton`, `ShareModal`, and `DmExceptionCalendar` follow the same pattern.

### Pattern: Hidden Input for Form Actions

`CampaignForm` and `UpdatePlanningWindowForm` use `formAction` from `useActionState`.
Server Actions read `formData.get(name)`. The `DatePicker` hidden input preserves this
contract without requiring any change to Server Actions.

### Pattern: Optimistic UI + Toast Error Recovery

`AvailabilityForm` uses optimistic state updates with rollback on error and a Toast component.
`DmExceptionCalendar` should follow exactly the same pattern as `AvailabilityForm` →
`toggleDateOverride`. The existing `Toast` component (inside `AvailabilityForm.tsx`) should
be extracted to a shared `src/components/Toast.tsx` and reused.

### Pattern: UTC-Everywhere Date Discipline

All existing date math uses `Date.UTC(y, m, d)` and `YYYY-MM-DD` string keys. `DatePicker`
and `DmExceptionCalendar` must follow this without exception. Do not use `new Date(dateString)`
directly — it interprets `YYYY-MM-DD` as UTC midnight on some engines but local midnight on
others.

### Pattern: Serialize Dates Before Passing to Client Components

The campaign detail Server Component serializes `availabilityEntries` dates to ISO strings
before passing to Client Components. `dmExceptions` must be serialized the same way:
`date.toISOString().split('T')[0]` → `YYYY-MM-DD` string.

---

## Anti-Patterns to Avoid

### Anti-Pattern: Using `useEffect` to detect post-redirect state via localStorage/sessionStorage

Some approaches use `sessionStorage.setItem('showModal', '1')` in the action and
`useEffect` to read it on mount. This is fragile (race conditions, SSR hydration mismatch,
storage not available in all contexts). The URL search param approach is simpler and more
reliable.

### Anti-Pattern: Promoting BestDaysList to a Client Component for clipboard

Adding `'use client'` to `BestDaysList` means React hydrates the entire component tree,
including the ranked list computation. There is no reason to run that in the browser.
Use the narrow `CopyBestDaysButton` island instead.

### Anti-Pattern: Adding a JSON column to Campaign for DM exceptions

```prisma
// Do not do this:
dmUnavailableDates  String?  // JSON-encoded string[]
```

JSON columns in Prisma require manual serialization/deserialization, bypass the ORM's type
system, cannot be queried by date, and violate the schema's existing per-record pattern for
availability data.

### Anti-Pattern: Duplicating buildMonthGrid a third time

`buildMonthGrid` already exists in both `AvailabilityCalendar.tsx` and
`DashboardCalendar.tsx`. Adding it to `DatePicker.tsx` would be a third copy. Extract to
`calendarUtils.ts` before writing any new calendar component.

---

## Sources

- Direct inspection of `/Users/richardowen/Desktop/wheres-the-cleric/src/` (all files listed above)
- Next.js App Router `searchParams` in Server Components: consistent with Next.js 15/16 docs
  pattern where `searchParams` is an async prop on page components
- Next.js `router.replace` with `{ scroll: false }` for URL cleanup without navigation:
  standard pattern in App Router; `useRouter` from `next/navigation`
- Confidence: HIGH throughout — all claims derived from direct codebase inspection
