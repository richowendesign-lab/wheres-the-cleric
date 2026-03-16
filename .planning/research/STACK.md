# Technology Stack — v1.6 Additions

**Project:** Where's the Cleric — D&D Session Planner
**Milestone:** v1.6 Campaign Detail Rework
**Researched:** 2026-03-16
**Scope:** NEW capabilities only — two-column campaign detail layout, flat settings UI, and DM availability sync across campaigns. Existing stack (Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma 7, SQLite/Neon PostgreSQL, bcryptjs, server actions) is validated and not re-researched.

---

## Verdict Up Front

**Zero new dependencies. All three features are achievable with what already exists.**

The two-column layout is a Tailwind CSS grid restructure. The flat settings UI is an HTML change (remove `<details>`). The sync propagation is a server action extended with a Prisma bulk-write — the `dmId` FK and `DM → Campaign[]` relation are already in the schema. Nothing in v1.6 requires adding a library.

---

## Feature-by-Feature Analysis

### Feature 1: Two-Column Layout (Large Calendar + Persistent Sidebar)

**Current state:** The Availability tab renders a vertical `space-y-8` stack inside `CampaignTabs.tsx`. The date detail panel is a `fixed inset-y-0 right-0 w-80` full-page overlay that slides in over all content.

**What needs to change:**
- The Availability tab body becomes a CSS grid: `grid-cols-1` on mobile, `grid-cols-[1fr_320px]` (or similar) on `lg:` breakpoint. Left column: calendar + awaiting-response. Right column: Best Days list + join link (persistent, always visible).
- The date detail slide-in overlays the sidebar only. The overlay can remain `fixed right-0` and sized to match the sidebar column width, or it can be rendered inline replacing the sidebar content when a date is selected. Either approach is pure CSS + conditional rendering — no library.

**Implementation pattern:** Tailwind CSS responsive grid. The existing `max-w-5xl` page container already supports this width.

```
<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
  <div>  {/* left: calendar, awaiting response */}  </div>
  <div>  {/* right: best days, join link, or date detail panel */}  </div>
</div>
```

**No new dependency.** Pure Tailwind utility classes already in the project.

---

### Feature 2: Flat Settings UI (No Stacked Accordions)

**Current state:** Settings tab uses `<details>/<summary>` HTML elements to collapse the Players and My Unavailable Dates sections. The ChevronDownIcon rotates on open via `group-open:rotate-180`.

**What needs to change:** Remove the `<details>/<summary>` wrappers. Render each settings section as a flat, always-visible card or bordered group. All content is visible without interaction.

**Grouping approach:** Use a `border border-[var(--dnd-border-muted)] rounded-lg p-5` card per logical section (Join Link, Planning Window, Players, My Unavailable Dates, Danger Zone). This matches the visual language already used for the inline planning window editor in the Availability tab.

**No new dependency.** HTML structure + existing Tailwind tokens.

---

### Feature 3: DM Availability Sync Across Campaigns

**Current state:** `toggleDmException` in `src/lib/actions/campaign.ts` writes to a single `campaignId`. The `DmAvailabilityException` model has `@@unique([campaignId, date])`. The `Campaign` model has `dmId` (FK to `DM`). The `DM → Campaign[]` relation already exists in `prisma/schema.prisma`.

**What needs to change:**

**Schema addition (one field):**
```prisma
model Campaign {
  // ... existing fields ...
  syncExceptions  Boolean  @default(true)
}
```

This field drives the per-campaign opt-out toggle. `@default(true)` means sync is on by default for all campaigns including existing ones after migration.

**Server action extension:**
The updated `toggleDmException` action, when `isBlocked` is true (adding an exception), must:
1. Look up the current campaign to confirm ownership (already done).
2. Look up all other campaigns owned by the same DM where `syncExceptions = true`.
3. Upsert the same date into `DmAvailabilityException` for each of those campaigns.
4. When `isBlocked` is false (removing an exception), delete from all `syncExceptions = true` campaigns owned by the DM.

This is a Prisma `findMany` + `upsertMany` (or `createMany`/`deleteMany`) pattern. All within a single server action. The existing `getSessionDM()` already provides `dm.id`.

**New server action needed:** `toggleSyncExceptions(campaignId: string, enabled: boolean)` — updates `Campaign.syncExceptions` for one campaign. Same pattern as `setDmExceptionMode`.

**No new dependency.** The `DM → Campaign[]` relation is already modelled. Prisma 7's `createMany` and `deleteMany` handle bulk writes. The existing server action pattern (`'use server'`, `getSessionDM()`, `revalidatePath`) is the correct pattern.

**Prisma migration:** `prisma db push` (dev) or `prisma migrate dev` adds the `syncExceptions` column. This is a non-breaking additive migration — `@default(true)` means no existing rows need backfill.

---

### Opt-Out Toggle UI

The per-campaign sync toggle is a boolean switch. The existing codebase uses radio inputs styled as boxed buttons (see `DmExceptionCalendar.tsx` mode selector). For a single boolean toggle, a `<button role="switch" aria-checked={...}>` is the accessible HTML pattern.

**Implementation:** ~15 lines of Tailwind CSS. No toggle library needed. Pattern:

```tsx
<button
  type="button"
  role="switch"
  aria-checked={syncEnabled}
  onClick={() => handleToggleSync(!syncEnabled)}
  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
    ${syncEnabled ? 'bg-[var(--dnd-accent)]' : 'bg-gray-700'}`}
>
  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform
    ${syncEnabled ? 'translate-x-6' : 'translate-x-1'}`}
  />
</button>
```

**No new dependency.**

---

## Full Stack Delta: v1.6 Adds Nothing to `package.json`

| Package | Action | Rationale |
|---------|--------|-----------|
| Any CSS-in-JS or layout library | Do NOT add | Tailwind CSS grid handles the two-column layout with two utility classes |
| `@radix-ui/react-switch` or `@headlessui/react` | Do NOT add | The toggle is a single `<button role="switch">` — 15 lines of Tailwind. No accessibility utility library needed for one component. |
| `zustand` / `jotai` / any state library | Do NOT add | Sync state is server-side (Prisma write + `revalidatePath`). Client state is `useState` in `CampaignTabs.tsx`. No cross-component state sharing needed. |
| `react-query` / `swr` | Do NOT add | No client-side data fetching. Server actions + `revalidatePath` handle all mutations. |
| Any drag-and-drop library | Do NOT add | Not needed for these features. |

---

## Schema Change Required

One additive field on `Campaign`. This is the only material change to the project's data model:

```prisma
model Campaign {
  // ... all existing fields unchanged ...
  syncExceptions  Boolean  @default(true)
}
```

Migration is non-breaking. Existing campaigns get `syncExceptions = true` by default, which is the correct behaviour (opt-in to sync by default).

---

## Integration Points

### `CampaignTabs.tsx` Changes

`CampaignTabs` is the single `'use client'` boundary for the campaign detail page. All three features are implemented inside this component (or in components it renders). No new `'use client'` boundaries are needed.

Props to add: `syncExceptions: boolean` — passed from the Server Component page after reading `campaign.syncExceptions`.

### Server Component Page (`campaigns/[id]/page.tsx`)

Must read `campaign.syncExceptions` and pass it to `CampaignTabs`. One new prop on an existing query (`prisma.campaign.findUnique` already fetches the campaign — add `syncExceptions` to the select or let Prisma return it as part of the full model read).

### `toggleDmException` Server Action

The sync logic runs entirely inside this existing action. No new action file needed — the action is extended in place. The key query addition:

```typescript
// After confirming DM ownership of the toggled campaign:
const siblingsToSync = await prisma.campaign.findMany({
  where: { dmId: dm.id, syncExceptions: true, id: { not: campaignId } },
  select: { id: true },
})
// Then upsert/delete DmAvailabilityException for each sibling.id
```

`revalidatePath` must be called for all affected campaign IDs, or called once for `/campaigns` to invalidate the whole segment. The cleanest approach: `revalidatePath('/campaigns', 'layout')` invalidates all campaign sub-pages in one call. Verify this works for the App Router segment cache — if not, loop `revalidatePath('/campaigns/[id]')` for each sibling.

---

## Confidence Assessment

| Area | Level | Basis |
|------|-------|-------|
| Tailwind grid layout | HIGH | Directly verified from existing codebase — `grid`, `grid-cols-*`, `lg:` prefix are all used in current components. `grid-cols-[1fr_320px]` is valid Tailwind 4 arbitrary value syntax. |
| `<details>/<summary>` removal | HIGH | Direct codebase read — these are plain HTML elements with no library backing. Removing them is a markup change only. |
| Prisma `findMany` + `createMany`/`deleteMany` bulk pattern | HIGH | Prisma 7 supports these APIs. The existing codebase uses `deleteMany` in `toggleDmException` (confirmed). `createMany` is documented in Prisma 7 docs. |
| `@default(true)` migration non-breaking | HIGH | Standard Prisma behaviour — boolean column with default does not require backfill. Verified from schema conventions already used in this project. |
| `revalidatePath('/campaigns', 'layout')` segment cache invalidation | MEDIUM | Next.js App Router `revalidatePath` with `'layout'` type invalidates the segment and all children. Documented in Next.js 15+ cache docs. Exact behaviour for nested dynamic segments should be tested; fallback is per-ID invalidation in a loop. |
| Toggle switch HTML pattern (`role="switch"`) | HIGH | ARIA spec; no library dependency. The Tailwind translate pattern for the thumb is standard and used across the ecosystem. |
| Zero new dependencies conclusion | HIGH | All three features traced directly to existing browser APIs, Tailwind utilities, and Prisma patterns already in use in the codebase. |

---

## What NOT to Add — Anti-List

| Library | Why Not |
|---------|---------|
| `@radix-ui/react-switch` | One toggle — implement with `<button role="switch">` + 15 lines of Tailwind. Adding Radix for a single switch is over-engineering. |
| `@headlessui/react` | No new modal, menu, or dialog pattern in v1.6. The flat settings layout removes the one pattern (accordion) that `<details>` was handling. |
| `zustand` / `jotai` | All shared state stays in `CampaignTabs` via `useState`. Sync is server-side — no client-side state synchronisation problem to solve. |
| `react-query` / `swr` | Server actions + `revalidatePath` handle all mutations and cache invalidation. No client-side data fetching needed. |
| `framer-motion` / `motion` | No new animation requirements in v1.6. The sidebar transition is the existing `translate-x` CSS already in `CampaignTabs.tsx`. |
| Any CSS grid library (e.g. `react-grid-layout`) | Two-column layout is two Tailwind classes. |
| `clsx` / `classnames` | Template literals are used throughout. No change to this pattern needed. |

---

## Sources

- Codebase direct inspection (HIGH confidence): `CampaignTabs.tsx`, `DmExceptionCalendar.tsx`, `src/lib/actions/campaign.ts`, `prisma/schema.prisma`, `package.json`, `campaigns/[id]/page.tsx` — all read directly in this research session
- Prisma 7 `createMany` / `deleteMany` APIs: Documented in Prisma docs; consistent with existing use of `deleteMany` in `toggleDmException` (HIGH confidence)
- Next.js App Router `revalidatePath` with segment type: Next.js 15+ cache documentation (MEDIUM confidence — exact behaviour for nested dynamic segments should be integration-tested)
- ARIA `role="switch"` toggle pattern: ARIA specification (HIGH confidence)
- Tailwind CSS 4 arbitrary `grid-cols-[...]` value syntax: Confirmed by existing codebase usage of arbitrary value syntax in Tailwind (HIGH confidence)

---

*Research completed: 2026-03-16*
*Ready for roadmap: yes*
