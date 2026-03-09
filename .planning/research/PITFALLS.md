# Domain Pitfalls

**Domain:** Next.js 16 / React 19 App Router — adding custom date pickers, share modals, availability exception modelling, and clipboard copy to an existing Prisma-backed app
**Researched:** 2026-03-09
**Confidence:** HIGH for pitfalls grounded in the actual codebase; MEDIUM for Next.js 16 / React 19 specifics (knowledge cutoff August 2025, no live docs available in this session)

---

## Critical Pitfalls

### Pitfall 1: Date picker renders a different value on the server vs client (hydration mismatch)

**What goes wrong:**
A custom date picker that pre-fills "today" or formats dates using `new Date()` at render time will produce a different string on the server (UTC) than in the browser (local timezone). React 19 strict hydration throws a hard error rather than silently recovering. The app already has one instance of this risk: `campaigns/page.tsx` calls `d.toLocaleDateString('en-GB', ...)` on `Date` objects that arrive as UTC midnight from Neon PostgreSQL, which could disagree with the browser's locale at SSR time on Vercel edge workers.

**Why it happens:**
Server-side rendering runs in Node.js with UTC (or whatever TZ the Vercel runtime uses). The browser runs in the user's local timezone. Any date formatting that depends on the local timezone will disagree.

**Consequences:**
Hard React hydration error (`Text content does not match server-rendered HTML`), white-screen crash on the campaign creation page, or on any page that embeds the custom picker.

**Prevention:**
- Never call `new Date()` during render of a Server Component to produce a display value.
- Format all dates with `{ timeZone: 'UTC' }` explicitly, or use ISO string slicing (`isoString.slice(0, 10)`) which is timezone-safe. The existing code in `availability.ts` uses `Date.UTC` and `formatDateKey` correctly — follow that pattern exactly.
- For "today" default in a date picker, set the default on the **client** only (inside a `useEffect` or lazy `useState` initialiser), never during SSR.
- If the picker component must be a Server Component that passes a pre-filled date, pass a `YYYY-MM-DD` string (not a `Date` object) as a prop and slice/compare as strings.

**Detection:**
`Error: Hydration failed because the initial UI does not match what was rendered on the server` in the browser console. Often only reproducible in production or when Vercel's server TZ differs from your local machine.

**Phase:** Custom Date Picker phase (any phase that replaces `<input type="date">`).

---

### Pitfall 2: Custom date picker is a controlled component inside a `useActionState` form — state goes stale after server action error

**What goes wrong:**
`CampaignForm.tsx` and `UpdatePlanningWindowForm.tsx` both use `useActionState`. When the server action returns an error, the form re-renders with `state.error`. A **controlled** date picker (one that stores its value in `useState`) will reset to its initial value (empty or the default prop) because React re-renders the component from the same initial state. The user loses their entered dates.

**Why it happens:**
`useActionState` replaces the `action` prop but the component re-renders normally. A controlled picker that derives its initial value from a prop (`defaultValue`) via `useState(props.defaultValue)` will not re-sync with the prop on re-render — `useState` only uses the initial value on mount.

**Consequences:**
User types a start and end date, hits submit, gets a validation error, and both date fields reset to blank. Extremely frustrating UX.

**Prevention:**
Use the **hidden input pattern**: keep the picker's visual state in local `useState`, but emit a `<input type="hidden" name="planningWindowStart" value={localState} />` alongside it. The hidden input is what the FormData reads. This is the correct pattern for any custom UI control wired to a `useActionState` form in this app.

Example of the safe pattern:
```tsx
'use client'
import { useState } from 'react'

export function DatePicker({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? '')
  return (
    <>
      <input type="hidden" name={name} value={value} />
      {/* custom calendar UI that calls setValue */}
    </>
  )
}
```

The hidden input survives re-renders without losing value because `value` is owned by local state, not derived from a prop on each render.

**Detection:**
Reproduce by submitting a form with invalid dates and checking whether the picker reverts.

**Phase:** Custom Date Picker phase.

---

### Pitfall 3: Showing a share modal after `redirect()` in a server action

**What goes wrong:**
`createCampaign` calls `redirect(`/campaigns/${campaign.id}`)`. You cannot open a modal from a server-side redirect — the redirect is a 307 HTTP response, the browser navigates, and any client state (modal open flags) is thrown away. Attempting to use `useActionState`'s returned state to trigger a modal will not work because a successful redirect means the component is unmounted.

**Why it happens:**
`redirect()` in Next.js throws a special error internally (NEXT_REDIRECT) that is caught by the framework, terminates the action, and issues a navigation. The `state` returned by `useActionState` is never updated — the page simply changes.

**Consequences:**
If you try to conditionally render `{state?.showModal && <ShareModal />}` in `CampaignForm`, it will never fire after a successful creation because the page has navigated away.

**Prevention:**
Two reliable patterns:

1. **URL search param as modal trigger** (recommended for this app):
   Change the `redirect` destination to include `?created=1`:
   ```ts
   redirect(`/campaigns/${campaign.id}?created=1`)
   ```
   On the campaign detail page (a Server Component), read `searchParams.created` and pass `showShareModal={true}` to a client component that opens itself on mount via `useEffect`:
   ```tsx
   // Server Component
   export default async function CampaignPage({ searchParams }) {
     const showModal = searchParams.created === '1'
     return <CampaignDetailClient showShareModal={showModal} ... />
   }
   ```
   ```tsx
   // Client Component
   'use client'
   export function CampaignDetailClient({ showShareModal }) {
     const [open, setOpen] = useState(showShareModal)
     // ...
   }
   ```
   This is the safest pattern because it survives hard refresh and is shareable.

2. **Skip redirect, return modal data from action** (only viable if redirect is removed):
   Return `{ success: true, campaignId, joinUrl }` from the server action instead of calling `redirect()`. The `useActionState` state will include this data, and the form component can render the modal inline. Requires adding router.push navigation manually after modal is dismissed. Adds complexity.

**What NOT to do:**
- Do not append `#share` as a URL hash — server components cannot read the fragment (it is client-only).
- Do not store modal state in a cookie — that adds server round-trips and complexity.
- Do not call `redirect()` inside `try/catch` — the existing codebase correctly avoids this (documented in PROJECT.md key decisions), and this pattern must be maintained.

**Phase:** Share Modal phase.

---

### Pitfall 4: The `@@unique([playerSlotId, date])` constraint blocks DM unavailability if reusing `AvailabilityEntry`

**What goes wrong:**
If DM unavailability is modelled by adding a special `PlayerSlot` for the DM (or by adding a `dmId` column to `AvailabilityEntry`), the constraint `@@unique([playerSlotId, date])` will conflict: a DM can only have one override entry per date, which is fine — but if the schema reuses `AvailabilityEntry` for both player and DM entries, Prisma's upsert accessor `playerSlotId_date` assumes `playerSlotId` is always present. A DM entry would need a `NULL` playerSlotId, which breaks the composite unique index (NULLs are not equal in PostgreSQL unique constraints, so this technically works but creates confusing duplicates).

**Why it happens:**
The schema has no concept of a DM-owned availability entry. `AvailabilityEntry` is tightly coupled to `PlayerSlot`. Bolting on DM entries by nulling the FK silently bypasses the unique constraint, leading to duplicate entries that the toggle logic (`toggleDateOverride`) won't deduplicate correctly.

**Consequences:**
Multiple DM-unavailability entries accumulate for the same date. `computeDayStatuses` ignores DM entries entirely (it iterates `playerSlots` only), so the ranking logic silently misses DM unavailability unless a new code path is added. Silent data corruption that only manifests when the DM marks the same date twice.

**Prevention:**
Model DM unavailability as a **separate, first-class table** tied directly to `Campaign`, not as a variant of `AvailabilityEntry`:

```prisma
model DmUnavailableDate {
  id         String   @id @default(cuid())
  campaignId String
  date       DateTime
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([campaignId, date])
}
```

This keeps the player availability pipeline (`computeDayStatuses`, `toggleDateOverride`, `saveWeeklyPattern`) entirely untouched. DM unavailability is a separate read in `computeDayStatuses` or a post-processing step in `computeBestDays`. The toggle behaviour for per-campaign blocking vs. flagging becomes a field on the `Campaign` model (e.g., `dmUnavailableMode String @default("block")`), not a property of individual entries.

**Detection:**
Mark the same date as DM-unavailable twice and query `DmUnavailableDate` (or equivalent) — duplicate rows are the symptom.

**Phase:** DM Availability Exceptions phase.

---

### Pitfall 5: DM unavailability changes the ranking logic — `computeBestDays` must be extended, not replaced

**What goes wrong:**
`computeBestDays` currently sorts by `freeCount` descending, then date ascending. If you add DM unavailability as a filter, the naive approach is to filter out DM-blocked days before ranking. But this changes the semantics: a day with 4/4 players free but blocked by the DM disappears from the list entirely. The DM may want to see flagged days (not blocked) at the bottom of the list, not omitted.

**Why it happens:**
Two modes are planned: "block" (exclude day entirely) and "flag" (show day but with a warning). If `computeBestDays` is modified to filter, the "flag" mode has no natural expression. If it's modified to rank flagged days last, the sort is no longer a pure `freeCount` sort.

**Consequences:**
Switching modes requires changing the ranking function, which touches the existing calendar and best-days UI components. Risk of regressions in `AvailabilityCalendar` and `BestDaysList`.

**Prevention:**
Add a `dmBlocked: boolean` field to `DayAggregation` in `availability.ts`. Keep `computeBestDays` returning the same shape. Let the **rendering components** (`BestDaysList`, `DashboardCalendar`) decide whether to show/hide/style blocked days. This keeps all display logic in the UI layer and the ranking function pure.

```ts
export interface DayAggregation {
  date: string
  playerStatuses: Record<string, PlayerDayStatus>
  freeCount: number
  totalPlayers: number
  allFree: boolean
  dmBlocked: boolean  // new field
}
```

**Phase:** DM Availability Exceptions phase.

---

## Moderate Pitfalls

### Pitfall 6: `navigator.clipboard.writeText` is not available in SSR or in non-HTTPS contexts

**What goes wrong:**
`CopyLinkButton.tsx` already uses `navigator.clipboard.writeText` correctly behind an `onClick` handler in a `'use client'` component, so it only runs in the browser. The new share modal will need the same clipboard call for two strings: the raw join URL and the pre-written paste message. If the modal component is not fully isolated as a client component, calling `navigator.clipboard` during render (e.g., in `useEffect` with an immediate copy-on-mount) will fail in non-HTTPS environments (localhost without HTTPS) and throw in SSR.

**Why it happens:**
`navigator.clipboard` is only available in secure contexts (HTTPS or localhost). Vercel deployments are always HTTPS, but local dev uses `http://localhost:3000`. The Clipboard API also requires user gesture for `writeText` in some browsers — calling it from `useEffect` without a preceding user action may be silently blocked.

**Prevention:**
- Keep clipboard calls exclusively inside `onClick` handlers (as `CopyLinkButton` already does).
- Always guard with `typeof navigator !== 'undefined' && navigator.clipboard` before calling.
- For the share modal's "copy message" button, follow the exact same pattern as `CopyLinkButton`: `useState(false)` for the "Copied!" transient state, reset after 2000ms.
- Do not attempt to auto-copy on modal open — this requires a user gesture and will fail silently in most browsers.

**Phase:** Share Modal phase.

---

### Pitfall 7: `useSearchParams()` in a Server Component subtree causes a Suspense boundary requirement in Next.js App Router

**What goes wrong:**
The recommended pattern for the share modal trigger is `?created=1` in the URL. The campaign detail page is currently a Server Component (`app/campaigns/[id]/page.tsx`). Reading `searchParams` in a Server Component is fine — it's passed as a prop. But if any child client component calls `useSearchParams()` directly (to read `?created=1`), Next.js App Router requires it to be wrapped in `<Suspense>` or the build will fail with a static generation error.

**Why it happens:**
`useSearchParams()` in a client component opts the entire subtree into dynamic rendering. Without a `<Suspense>` boundary, Next.js cannot statically pre-render the parent segment.

**Prevention:**
Read `searchParams` only in the Server Component and pass the result as a plain prop to the client component. Never call `useSearchParams()` in a client component inside a statically-renderable page segment. The existing pattern in `middleware.ts` (reading `searchParams` in a server context) confirms the team already knows the safe path.

**Phase:** Share Modal phase.

---

### Pitfall 8: `defaultValue` vs `value` on date inputs in `UpdatePlanningWindowForm` — form reset after `revalidatePath`

**What goes wrong:**
`UpdatePlanningWindowForm` uses `defaultValue={toVal(campaign.planningWindowStart)}`. After a successful save, `updatePlanningWindow` calls no `revalidatePath` (it returns `{ success: true }` and relies on the parent page to revalidate externally — or it doesn't). If the form uses `defaultValue` (uncontrolled), the displayed value after submit may remain as what the user typed rather than the newly-saved server value. If `revalidatePath` is added and the Server Component re-renders, `defaultValue` will re-sync — but only because the component unmounts and remounts, not because React diffed the prop.

**Why it happens:**
`defaultValue` is uncontrolled — React sets it once on mount and ignores subsequent changes. The component must unmount and remount (via `key` prop change or page navigation) to re-sync. When adding a custom picker as a wrapper around `defaultValue`, this subtlety means the visual state in the picker diverges from the server state after a revalidation.

**Prevention:**
When replacing `<input type="date">` with a custom picker in `UpdatePlanningWindowForm`, add a `key` prop derived from the campaign's `updatedAt` timestamp:
```tsx
<DatePicker key={campaign.updatedAt.toISOString()} name="planningWindowStart" defaultValue={...} />
```
This forces the picker to remount and re-read `defaultValue` after every successful save + revalidation.

**Phase:** Custom Date Picker phase.

---

### Pitfall 9: Date string timezone drift when parsing `YYYY-MM-DD` from FormData in a server action

**What goes wrong:**
The existing `createCampaign` and `updatePlanningWindow` actions call `new Date(startVal)` on the `YYYY-MM-DD` string from FormData. In Node.js, `new Date('2026-03-15')` is interpreted as **UTC midnight**. This is correct for Neon PostgreSQL which stores `DateTime` in UTC. However, if a future action parsing a custom picker value or an exception date uses `new Date(dateString)` without UTC anchoring, the stored date will be off by the server's UTC offset.

**Prevention:**
The existing actions use `new Date(startVal)` on a `YYYY-MM-DD` string — this is technically correct because date-only ISO strings are parsed as UTC per the ECMAScript spec (since ES2015). Maintain this pattern. Do NOT pass a datetime string (`2026-03-15T00:00:00`) without explicit UTC suffix — `new Date('2026-03-15T00:00:00')` is parsed as LOCAL time in Node.js, shifting the stored date.

For new DM unavailability entries, use the same `Date.UTC` pattern already in `toggleDateOverride`:
```ts
const [y, m, d] = date.split('-').map(Number)
const parsedDate = new Date(Date.UTC(y, m - 1, d))
```

**Phase:** DM Availability Exceptions phase, Custom Date Picker phase.

---

## Minor Pitfalls

### Pitfall 10: Tailwind CSS 4 `input[type="date"]` calendar icon override breaks when a custom picker hides the native input

**What goes wrong:**
`globals.css` already overrides the webkit calendar picker indicator:
```css
input[type="date"]::-webkit-calendar-picker-indicator { ... }
```
When the custom picker replaces `<input type="date">` with a `<input type="hidden">` plus a visual calendar component, this CSS rule becomes a dead selector — no visual harm, but it's dead code that may mislead future developers.

**Prevention:**
Remove or comment out the `input[type="date"]` overrides in `globals.css` as part of the custom picker phase. Do this as a cleanup step, not silently.

**Phase:** Custom Date Picker phase (cleanup step).

---

### Pitfall 11: Share modal pre-written message becoming stale if the join URL or campaign name changes

**What goes wrong:**
The share modal will include a pre-written paste message (e.g., "Join my campaign at [URL]"). If this message is computed once at modal open time and cached in state, it will become stale if the DM updates the campaign name between page load and modal open. In practice the modal opens immediately after creation, so this is low risk in v1.3 — but worth noting for the campaign detail page where the DM can edit the name.

**Prevention:**
Compute the share message from props at render time, not in a `useEffect` or `useMemo` with stale deps. Since the campaign name and join URL are passed as props, computing inline is trivially reactive.

**Phase:** Share Modal phase.

---

### Pitfall 12: Modal focus trap and scroll lock — missing `aria` attributes causing accessibility failures

**What goes wrong:**
A share modal that renders as a floating overlay without `role="dialog"`, `aria-modal="true"`, and a focus trap will allow keyboard users to tab into content behind the modal. Closing with Escape requires an explicit `onKeyDown` handler.

**Prevention:**
Use the native `<dialog>` element with the `.showModal()` method for built-in focus trap, backdrop, and Escape handling, or replicate with `role="dialog" aria-modal="true"` plus a focus trap library. Given the app's constraint of minimal dependencies, native `<dialog>` is the lowest-effort correct choice. The `useEffect` + `dialogRef.current.showModal()` pattern works cleanly with React 19.

**Phase:** Share Modal phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Custom Date Picker | Hydration mismatch from timezone-sensitive date formatting at render time | Always format with `timeZone: 'UTC'` or slice ISO strings; never use `new Date()` at SSR render time |
| Custom Date Picker | Controlled picker resets after server action validation error | Hidden input pattern: picker owns local state, emits `<input type="hidden">` |
| Custom Date Picker | `defaultValue` doesn't re-sync after `revalidatePath` | Add `key={campaign.updatedAt.toISOString()}` to force picker remount |
| Share Modal | Cannot open modal after server-side `redirect()` | Encode intent in `?created=1` search param; read in Server Component, pass as prop |
| Share Modal | `useSearchParams()` in client child requires Suspense boundary | Read `searchParams` only in Server Component; pass as prop |
| Share Modal | Clipboard copy fails without user gesture | Keep all clipboard calls in `onClick` handlers, never in effects |
| DM Unavailability | Reusing `AvailabilityEntry` for DM entries corrupts unique constraint semantics | New `DmUnavailableDate` table with `@@unique([campaignId, date])` |
| DM Unavailability | `computeBestDays` cannot express "block" vs "flag" modes if it filters | Add `dmBlocked: boolean` to `DayAggregation`; let UI components handle display logic |
| DM Unavailability | Date parsing drift in new server actions | Use `Date.UTC(y, m-1, d)` pattern from existing `toggleDateOverride`, never `new Date(datetimeString)` without Z suffix |

---

## Sources

- Codebase inspection: `src/lib/actions/campaign.ts`, `src/lib/actions/availability.ts`, `src/lib/availability.ts`, `src/components/CampaignForm.tsx`, `src/components/UpdatePlanningWindowForm.tsx`, `src/components/CopyLinkButton.tsx`, `prisma/schema.prisma` (HIGH confidence — first-party)
- Project context: `.planning/PROJECT.md` key decisions, especially `redirect() outside try/catch` and `useActionState from react not react-dom` (HIGH confidence — first-party)
- Next.js App Router patterns: `redirect()` NEXT_REDIRECT throw behaviour, `searchParams` as Server Component prop, `useSearchParams()` Suspense requirement (HIGH confidence — well-established, knowledge cutoff August 2025)
- React 19 hydration strictness, `useState` initial value semantics, `useActionState` behaviour on error (HIGH confidence — core React behaviour, unchanged across React 18/19)
- ECMAScript date string parsing spec: date-only ISO strings parsed as UTC, datetime strings without Z parsed as local (HIGH confidence — spec behaviour, Node.js consistent)
- Clipboard API secure context requirement, user gesture requirement (HIGH confidence — Web API spec, consistent across browsers)
- Prisma `@@unique` composite constraint with nullable FK in PostgreSQL (MEDIUM confidence — PostgreSQL NULL uniqueness is spec-defined, but Prisma upsert behaviour with nullable FK confirmed from codebase inspection of `playerSlotId_date` accessor)
