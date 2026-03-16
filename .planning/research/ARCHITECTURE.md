# Architecture Patterns

**Domain:** Campaign detail rework — layout, settings, and DM availability sync
**Researched:** 2026-03-16
**Confidence:** HIGH — based on direct codebase inspection of all relevant files

---

## Context

This is the v1.6 milestone on a live app. Three features are being added to the campaign detail page:

1. **Layout rework** — two-column layout (calendar left, persistent sidebar right with Best Days + join link). Date detail slide-in overlays the sidebar.
2. **Settings cleanup** — flat grouped layout replacing accordion sections. Join link moves from Settings to the persistent sidebar.
3. **DM availability sync** — marking a date unavailable in one campaign propagates to all other sync-enabled campaigns by the same DM. Per-campaign `dmSyncEnabled` boolean, default true.

Existing tech: Next.js 16, React 19, Tailwind CSS 4, Prisma 7, SQLite (local) / Neon PostgreSQL (production).

---

## Current Architecture (Baseline)

```
app/campaigns/[id]/page.tsx              ← Server Component
  getSessionDM() + prisma.campaign.findUnique()
  computeDayStatuses() + serialization
  └─ <CampaignTabs />                    ← "use client" boundary — owns all interactive state

CampaignTabs state:
  activeTab:   'availability' | 'settings'
  selectedDate: string | null             ← shared between BestDaysList + DashboardCalendar
  editingWindow: boolean

Fixed-position side panel (right-0 w-80):
  shown when selectedDate !== null
  contains date detail: player statuses per date

Availability tab (single column):
  Awaiting Response
  BestDaysList (full width)
  DashboardCalendar (full width)

Settings tab (max-w-2xl):
  Join Link (section)
  Planning Window (section)
  Players (details accordion)
  My Unavailable Dates (details accordion)
  Danger Zone
```

---

## Recommended Architecture

### Component Boundaries Overview

```
app/campaigns/[id]/page.tsx              ← Server Component (minimal change — add dmSyncEnabled to props)
  └─ <CampaignTabs />                    ← "use client" boundary — owns all interactive state

CampaignTabs (MODIFIED):
  activeTab:   'availability' | 'settings'
  selectedDate: string | null

Availability tab — new two-column layout:
  ┌─────────────────────┬──────────────┐
  │  DashboardCalendar  │  Sidebar     │
  │  (left, flex-1)     │  (right,     │
  │                     │  w-72 fixed) │
  │                     │  BestDaysList│
  │                     │  JoinLink    │
  └─────────────────────┴──────────────┘
  Date detail panel overlays sidebar (absolute, z-10)

Settings tab — flat layout (MODIFIED, no accordions):
  Planning Window
  Player Cap
  DM Availability (mode toggle + sync toggle)
  Danger Zone
```

---

## Feature 1: Layout Rework

### Integration Points

`CampaignTabs` is the only component that needs structural change. The layout change is contained entirely within the Availability tab render path.

The current side panel is `position: fixed` and slides in from the right edge of the viewport. In the new design the sidebar is an in-flow element on the right side of a flex/grid container. The date detail panel (currently the slide-in itself) becomes an overlay on top of that sidebar column.

### Current Side Panel vs New Sidebar

| Concern | Current (fixed overlay) | New (inline sidebar + overlay) |
|---------|-------------------------|-------------------------------|
| Positioning | `fixed inset-y-0 right-0 w-80` | Sidebar: in-flow `w-72 shrink-0`; detail panel: `absolute inset-0 z-10` inside sidebar column |
| Backdrop | Full-screen `fixed inset-0 z-10` div for click-away | Still needed — or use `onClick` on backdrop div scoped to sidebar |
| Layout impact | Zero (fixed, off-canvas) | Sidebar takes up space when visible; calendar is `flex-1` |
| Mobile | Slides in over full screen | Sidebar stacks below calendar on narrow screens |

### Join Link Migration

The join link currently lives in the Settings tab as section 1. It moves to the persistent sidebar. This means:
- `CopyLinkButton` is rendered in the sidebar regardless of whether a date is selected
- The Settings tab section "Join Link" is removed entirely
- No new props needed — `joinUrl` is already passed to `CampaignTabs`

### New vs Modified Components

| Component | Status | Change |
|-----------|--------|--------|
| `CampaignTabs.tsx` | Modified | Layout restructure — two-column availability tab, Settings tab cleanup, join link moved to sidebar |
| `BestDaysList.tsx` | Unchanged | Receives same props; sidebar context changes nothing about its internal rendering |
| `DashboardCalendar.tsx` | Unchanged | Receives same props; being in the left column vs full-width is a CSS concern in the parent |
| `CopyLinkButton.tsx` | Unchanged | Rendered in new sidebar location instead of Settings section |

### Data Flow

No data flow changes for the layout. All props to `CampaignTabs` remain the same. The sidebar content (`BestDaysList`, `CopyLinkButton`) already receives its data as props from the server component.

---

## Feature 2: Settings Cleanup

### Current Settings Sections

```
1. Join Link           ← moves to sidebar (removed from Settings)
2. Planning Window     ← stays, stays flat
3. Players             ← accordion → flat section
4. My Unavailable Dates ← accordion → flat section
5. Danger Zone         ← stays
```

After v1.6, the DM availability section gains a "sync" toggle (see Feature 3). This makes the section more meaningful as a flat first-class section rather than something hidden in an accordion.

### Integration Points

All Settings child components (`UpdatePlanningWindowForm`, `UpdateMaxPlayersForm`, `DmExceptionCalendar`) are unchanged. The accordion wrapper (`<details>`) is simply removed from around them. No prop changes.

The inline planning window editor in the Availability tab (pencil icon → `editingWindow` state) remains as-is — that is a separate in-context editor distinct from the Settings tab.

### DM Availability Mode + Sync in Settings

The `DmExceptionCalendar` component currently renders the block/flag mode radios inside itself. For the flat Settings layout this stays as-is — the mode radios are already part of `DmExceptionCalendar`.

The new `dmSyncEnabled` toggle is added to the Settings tab as a simple toggle. It lives as a standalone UI element either:
- Directly in `CampaignTabs` settings render (no new component needed — it is a single toggle with a label)
- Or extracted to a `DmSyncToggle` component if the toggle needs optimistic state + server action call

Given the pattern in `DmExceptionCalendar` (optimistic update + rollback), a small `DmSyncToggle` client component is the right call. It follows the same optimistic pattern.

---

## Feature 3: DM Availability Sync

This is the most architecturally significant change. It touches the DB schema, a server action, and adds a new client component.

### DB Schema Changes

Two additions to the `Campaign` model:

```prisma
model Campaign {
  // ... existing fields ...
  dmSyncEnabled Boolean @default(true)   // NEW: opt-out toggle per campaign
}
```

The `DmAvailabilityException` model itself does not change. Exceptions continue to be stored per-campaign with the existing `(campaignId, date)` composite unique constraint.

No migration data risk: `@default(true)` means all existing campaigns get sync enabled without any manual data migration, which matches the stated requirement ("default true").

### Server Action Changes: `toggleDmException`

The sync logic lives in the server action, not in the client. This keeps the client component identical to today — it calls `toggleDmException(campaignId, date, isBlocked)` and the server decides what to propagate.

**New behaviour in `toggleDmException`:**

```
1. Verify DM owns the campaign (existing check)
2. Apply the toggle to the target campaign (existing logic)
3. Find all other campaigns owned by the same DM where dmSyncEnabled = true
4. For each sync-enabled sibling campaign:
   - Apply the same toggle (add or remove the exception for the same date)
   - Only apply if the date falls within that campaign's planning window
     (no point storing exceptions for dates outside the window)
5. revalidatePath for every affected campaign
```

The date-window filter in step 4 is a pragmatic guard. Without it, toggling a date unavailable in Campaign A would silently write exceptions into Campaign B even if that date is never visible to B's DM. This creates confusion if Campaign B's window is later moved to include the date — the exception would appear unexpectedly. Better to apply only when the date is within window.

**Alternative considered:** Store exceptions globally per DM, not per campaign, and let each campaign read from the DM's global exception list. This is architecturally cleaner but requires a schema migration that affects `DashboardCalendar`, `BestDaysList`, `computeDayStatuses`, and every aggregation path. The "write to all relevant campaigns" approach is an additive change to one server action only. Chosen for minimal blast radius.

### What Syncs vs What Does Not

| Data | Syncs? | Rationale |
|------|--------|-----------|
| Exception dates | Yes | Core feature requirement |
| Exception mode (block/flag) | No | Explicitly stated to remain per-campaign |
| `dmSyncEnabled` itself | No | Each campaign opts in/out independently |

### Turn Sync On: Backfill Behaviour

When the DM turns sync on for a campaign (`dmSyncEnabled` changes from false to true), two questions arise:

1. Should all exceptions from other sync-enabled campaigns be copied in? — Probably yes, to make the state consistent immediately.
2. Should this campaign's exceptions be pushed out to other sync-enabled campaigns? — Also probably yes.

This backfill happens in the `setDmSyncEnabled` server action (new action). The simplest correct approach:

```
When setting dmSyncEnabled = true:
1. Collect the union of exception dates across all other sync-enabled campaigns
   (scoped to this campaign's planning window)
2. Upsert those dates into this campaign's exceptions
3. Push this campaign's current exceptions to all other sync-enabled campaigns
4. revalidatePath for all affected campaign pages
```

When setting `dmSyncEnabled = false`: no backfill needed. The campaign keeps its current exceptions but stops receiving future propagation. The exceptions are not deleted — the DM may prefer to keep their manually-set dates even after opting out.

### New Server Action: `setDmSyncEnabled`

```
setDmSyncEnabled(campaignId: string, enabled: boolean)
  → validates DM ownership
  → updates Campaign.dmSyncEnabled
  → if enabled: backfill (see above)
  → revalidatePath for all affected campaigns
  → return { success: true } | { error: string }
```

### New Component: `DmSyncToggle`

A small `"use client"` component that follows the optimistic-update pattern already established in `DmExceptionCalendar`.

```
Props:
  campaignId: string
  initialEnabled: boolean

State:
  enabled: boolean  (initialEnabled)
  status: 'idle' | 'saving' | 'error'

Behaviour:
  Toggle click → optimistic update → call setDmSyncEnabled → rollback on error
```

### Server Component Changes: `app/campaigns/[id]/page.tsx`

One addition to the existing DB fetch:

```ts
// Add dmSyncEnabled to the campaign include — it is already on the Campaign model after migration
const campaign = await prisma.campaign.findUnique({
  where: { id, dmId: dm.id },
  include: { ... }  // add no new includes — dmSyncEnabled is a scalar field
})
```

Pass `dmSyncEnabled` as a new prop to `CampaignTabs`.

### Revalidation Scope

Currently `toggleDmException` calls `revalidatePath('/campaigns/${campaignId}')` once. After sync, it must call `revalidatePath` for every affected campaign page. This is safe — Next.js batches server-side revalidations and the DM only has a small number of campaigns (the app targets small groups).

---

## Component Inventory

### New Components (create)

| Component | Location | Type | Purpose |
|-----------|----------|------|---------|
| `DmSyncToggle` | `src/components/DmSyncToggle.tsx` | `"use client"` | Per-campaign sync opt-out toggle with optimistic update + rollback |

### Modified Components

| Component | Change | Risk |
|-----------|--------|------|
| `CampaignTabs.tsx` | Two-column availability layout; sidebar with BestDaysList + join link; inline date detail overlay; flat Settings; add `dmSyncEnabled` prop; render `DmSyncToggle` in Settings | Medium — significant restructure but all child components unchanged |
| `src/lib/actions/campaign.ts` | `toggleDmException` gains sibling-propagation logic; new `setDmSyncEnabled` action | Medium — sync logic adds new DB queries; existing toggle behaviour unchanged |
| `app/campaigns/[id]/page.tsx` | Pass `dmSyncEnabled` prop to `CampaignTabs` | Very low — one new prop |
| `prisma/schema.prisma` | Add `dmSyncEnabled Boolean @default(true)` to Campaign | Low — additive field with default |

### Unchanged Components

| Component | Notes |
|-----------|-------|
| `BestDaysList.tsx` | Same props, same rendering — only its position in the layout changes |
| `DashboardCalendar.tsx` | Same props, same rendering — only its position in the layout changes |
| `DmExceptionCalendar.tsx` | Same props; mode radios stay internal; no sync awareness needed (server handles sync) |
| `UpdatePlanningWindowForm.tsx` | Unchanged — just loses accordion wrapper |
| `UpdateMaxPlayersForm.tsx` | Unchanged — just loses accordion wrapper |
| `CopyLinkButton.tsx` | Unchanged — rendered in sidebar instead of Settings |
| `DeleteCampaignButton.tsx` | Unchanged |
| `EditableCampaignField.tsx` | Unchanged |
| `ShareModal.tsx` | Unchanged |
| `AppNav.tsx` | Unchanged |
| All player/auth/landing components | Completely untouched |

---

## Data Flow

### Existing Flow (unchanged)

```
HTTP GET /campaigns/[id]
  → Server Component: getSessionDM() + prisma.campaign.findUnique()
  → computeDayStatuses(slots, windowStart, windowEnd, dmExceptionDates)
  → serialize all data
  → <CampaignTabs {...all serialized props} />
    → DashboardCalendar (receives dayAggregations)
    → BestDaysList (receives dayAggregations)
    → DmExceptionCalendar (receives dmExceptionDates)
    → [toggle click] → toggleDmException server action → revalidatePath → re-render
```

### New Flow: Sync Propagation

```
DM clicks date in DmExceptionCalendar
  → DmExceptionCalendar: optimistic update
  → toggleDmException(campaignId, date, isBlocked)
      → DB: apply to target campaign
      → DB: find sibling campaigns (same DM, dmSyncEnabled=true)
      → DB: apply to each sibling (date within window)
      → revalidatePath for each affected /campaigns/[id] page
  → CampaignTabs re-renders (revalidated)
  → [all sibling campaign pages now stale — will refresh on next visit]
```

### New Flow: Sync Toggle

```
DM clicks DmSyncToggle
  → DmSyncToggle: optimistic update
  → setDmSyncEnabled(campaignId, enabled)
      → DB: update Campaign.dmSyncEnabled
      → if enabled=true: backfill exceptions (bi-directional)
      → revalidatePath for affected campaign pages
  → CampaignTabs re-renders (revalidated)
```

---

## Build Order

Dependencies drive the order: schema before actions, actions before components, components before layout.

| Step | Task | What It Touches | Why Here |
|------|------|-----------------|----------|
| 1 | Prisma schema: add `dmSyncEnabled Boolean @default(true)` | `schema.prisma` | Everything else depends on the field existing |
| 2 | Run `prisma db push` / generate client | Prisma client | Must run before TypeScript can see the new field |
| 3 | `toggleDmException` sync propagation | `lib/actions/campaign.ts` | Enables sync before any UI exists — can be tested independently |
| 4 | New `setDmSyncEnabled` server action | `lib/actions/campaign.ts` | Needed by `DmSyncToggle`; write alongside step 3 |
| 5 | `DmSyncToggle` component | `src/components/DmSyncToggle.tsx` | Requires action from step 4; follows `DmExceptionCalendar` pattern |
| 6 | Settings tab flatten in `CampaignTabs` | `CampaignTabs.tsx` | Remove accordions, add `DmSyncToggle`; isolated to settings render path |
| 7 | Two-column layout in `CampaignTabs` | `CampaignTabs.tsx` | Move BestDaysList + join link to sidebar; inline date detail overlay |
| 8 | Server component: pass `dmSyncEnabled` prop | `app/campaigns/[id]/page.tsx` | Wires everything together |

Steps 3 and 4 can be written in a single edit. Steps 6 and 7 can be written in a single edit if preferred — they both touch `CampaignTabs`. They are listed separately here because the Settings change is lower risk and can be verified independently.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Sync Propagation

**What:** The `DmExceptionCalendar` client component fetches sibling campaign IDs and calls `toggleDmException` for each one.

**Why bad:** The client does not know which campaigns exist or which are sync-enabled. This requires an extra DB fetch in the client, exposes campaign IDs unnecessarily, and creates a race condition if the client is navigating away. Server actions are the correct place for cross-record writes.

**Instead:** The sync logic lives entirely inside `toggleDmException` on the server.

### Anti-Pattern 2: Global DM Exception Table

**What:** Replace per-campaign `DmAvailabilityException` with a single `DmException` table linked to `DM`, and have all campaigns read from it.

**Why bad:** This would require changes to `computeDayStatuses`, `DashboardCalendar`, `BestDaysList`, `CampaignTabs` props, and the server component. It is the right long-term model but a v1.6 scope creep. The campaign count is small; writing to all campaigns is fast.

**Instead:** Keep per-campaign exceptions. Write to siblings in the server action.

### Anti-Pattern 3: Accordion Removal Without Checking Mobile

**What:** Remove `<details>` accordions from Settings without verifying that flat sections don't make the Settings tab too long on small screens.

**Why bad:** The DM Unavailable Dates section contains a full calendar grid for every month in the planning window. Without accordion collapse, this can be extremely tall on mobile.

**Instead:** Keep `DmExceptionCalendar` collapsed by default behind a toggle — not a `<details>` accordion, but a simple `showCalendar` useState with a "Show calendar" button. The mode + sync controls are always visible; the calendar grid is toggle-revealed. This matches the "flat, scannable" goal while managing height.

### Anti-Pattern 4: Sidebar Layout with `position: fixed`

**What:** Keep the sidebar as a fixed element pinned to the right of the viewport.

**Why bad:** On wide screens, a fixed right-side panel sits outside the `max-w-5xl` content container. On narrow screens it covers content. A fixed overlay was correct for the old full-screen slide-in; it is wrong for a persistent in-layout sidebar.

**Instead:** The sidebar is in-flow within the two-column flex container. Use `sticky top-[nav-height]` to keep it visible during calendar scroll if needed.

### Anti-Pattern 5: Revalidating Only the Triggering Campaign on Sync

**What:** After propagating exceptions to sibling campaigns, only call `revalidatePath` for the campaign the DM is currently viewing.

**Why bad:** Sibling campaign pages are now stale. If the DM opens another campaign tab, they see outdated exception data until the next hard refresh.

**Instead:** Call `revalidatePath(`/campaigns/${sibling.id}`)` for every affected campaign. The DM has a small number of campaigns; the cost is negligible.

---

## Scalability Considerations

| Concern | Now (1 DM, 2-5 campaigns) | At 10+ campaigns per DM |
|---------|--------------------------|------------------------|
| Sync propagation | Single transaction, 2-5 `upsert` calls | Still fast — all within same DM ownership. Could batch into `createMany` with `skipDuplicates`. |
| Revalidation | 2-5 `revalidatePath` calls | Still fine — these are Next.js cache invalidations, not network calls |
| Backfill on sync-enable | Union of exceptions across N campaigns | O(N × exceptions per campaign) — fine for the target use case |

---

## Sources

- Direct inspection of `src/app/campaigns/[id]/page.tsx` — current server component structure and data flow
- Direct inspection of `src/components/CampaignTabs.tsx` — full tab layout, side panel, state management
- Direct inspection of `src/components/DmExceptionCalendar.tsx` — optimistic toggle pattern, mode state
- Direct inspection of `src/components/BestDaysList.tsx` — props interface, rendering
- Direct inspection of `src/components/DashboardCalendar.tsx` — props interface, rendering
- Direct inspection of `src/lib/actions/campaign.ts` — `toggleDmException`, `setDmExceptionMode` patterns
- Direct inspection of `src/lib/availability.ts` — `computeDayStatuses` signature, `DayAggregation` type
- Direct inspection of `prisma/schema.prisma` — current Campaign model, DmAvailabilityException model
- `.planning/PROJECT.md` — v1.6 requirements, key decisions history
- `.planning/STATE.md` — confirmed v1.6 is pre-implementation (no phases yet)
