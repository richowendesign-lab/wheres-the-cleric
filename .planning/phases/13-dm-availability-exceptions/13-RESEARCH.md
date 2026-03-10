# Phase 13: DM Availability Exceptions - Research

**Researched:** 2026-03-10
**Domain:** Next.js 16 App Router / React 19 / Prisma 7 — click-to-toggle calendar with optimistic UI, Server Action toggle pattern, DayAggregation extension
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DMEX-01 | DM can click calendar dates to mark themselves as unavailable for a campaign | DmExceptionCalendar component mirrors AvailabilityForm/AvailabilityCalendar pattern exactly; toggleDmException Server Action follows toggleDateOverride |
| DMEX-02 | DM can click a marked date again to remove the exception | Same toggle-to-delete logic already implemented in toggleDateOverride; @@unique constraint makes upsert/delete safe |
| DMEX-03 | DM-unavailable dates are visually distinct from player-unavailable dates | DmExceptionCalendar is a separate component with its own cell state type ('dm-blocked') and separate colour token |
| DMEX-04 | DM can toggle between "block" (removes date from rankings) and "flag" (shows warning badge) | Campaign.dmExceptionMode already exists in schema; dmBlocked boolean on DayAggregation drives rendering in BestDaysList and DashboardCalendar |
</phase_requirements>

---

## Summary

Phase 13 is a well-bounded feature addition with every major technical decision already resolved. The Prisma schema (Phase 11) placed `DmAvailabilityException` with `@@unique([campaignId, date])` and `Campaign.dmExceptionMode String?` into the database before this phase starts — zero schema work remains. The implementation is a direct structural parallel to the existing player availability toggle flow: `AvailabilityForm` → `DmExceptionCalendar`, `toggleDateOverride` → `toggleDmException`, `AvailabilityEntry` → `DmAvailabilityException`.

The two non-trivial decisions in this phase are (1) how `computeDayStatuses` receives and propagates DM exception data, and (2) how `computeBestDays` expresses block vs flag mode without filtering. Both are resolved: pass `dmExceptionDateKeys: Set<string>` and `dmExceptionMode: string | null` as parameters to `computeDayStatuses`, which stamps `dmBlocked: boolean` on each `DayAggregation`. Rendering components (`BestDaysList`, `DashboardCalendar`) consume `dmBlocked` and decide whether to hide or badge the day — the ranking function stays pure and mode-agnostic.

The critical implementation discipline is UTC-everywhere date handling. The codebase consistently uses `Date.UTC(y, m-1, d)` for date construction and `formatDateKey` for serialization. The new `toggleDmException` action must follow the same `Date.UTC` pattern from `toggleDateOverride` without exception.

**Primary recommendation:** Build in three sequential sub-tasks: (1) `toggleDmException` Server Action in `src/lib/actions/campaign.ts`, (2) extend `DayAggregation` + `computeDayStatuses` in `src/lib/availability.ts`, (3) build `DmExceptionCalendar` client component and wire everything into `CampaignDetailPage`.

---

## Standard Stack

### Core (existing — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16 | Server Actions for mutations; Server Components for data fetch | Already the project pattern |
| React 19 | 19 | `useState` + optimistic state management in client components | Already the project pattern |
| Prisma | 7 | `dmAvailabilityException` create/delete; `dmExceptionMode` update on Campaign | Already used for all DB access |
| Tailwind CSS 4 | 4 | Cell state styling with CSS custom properties (`--dnd-accent`) | Already the project pattern |

### Key Existing Utilities

| Utility | Location | Purpose | Phase 13 Usage |
|---------|----------|---------|----------------|
| `buildMonthGrid` | `src/lib/calendarUtils.ts` | 2D calendar grid builder | DmExceptionCalendar renders the grid |
| `formatDateKey` | `src/lib/calendarUtils.ts` | UTC-safe Date → YYYY-MM-DD | Used everywhere date keys are built |
| `toggleDateOverride` | `src/lib/actions/availability.ts` | Server Action toggle pattern | Direct structural template for `toggleDmException` |
| `AvailabilityForm` | `src/components/AvailabilityForm.tsx` | Optimistic toggle UI with rollback | Direct structural template for `DmExceptionCalendar` |
| `Toast` (local) | Inside `AvailabilityForm.tsx` | Save status feedback | Extract to shared location or inline in `DmExceptionCalendar` |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

No new directories. New files land in existing locations:

```
src/
├── lib/
│   ├── actions/
│   │   └── campaign.ts          # Add toggleDmException here (existing file)
│   └── availability.ts          # Add dmBlocked to DayAggregation; update computeDayStatuses signature
└── components/
    └── DmExceptionCalendar.tsx  # New client component
```

`CampaignDetailPage` (`src/app/campaigns/[id]/page.tsx`) is modified to:
- Include `dmAvailabilityExceptions` in the Prisma `include`
- Serialize exception dates to `YYYY-MM-DD` strings
- Pass exceptions and `dmExceptionMode` to `computeDayStatuses`
- Render `DmExceptionCalendar` (new) alongside the existing `DashboardCalendar`

### Pattern 1: Server Action Toggle (toggleDmException)

**What:** Server Action that creates or deletes a `DmAvailabilityException` record atomically. Uses the `@@unique([campaignId, date])` constraint for safe upsert/delete.
**When to use:** Called from `DmExceptionCalendar` on each date click. Does NOT call `revalidatePath` — client manages optimistic state.

```typescript
// Source: mirrors src/lib/actions/availability.ts toggleDateOverride
'use server'

export async function toggleDmException(
  campaignId: string,
  date: string,   // 'YYYY-MM-DD'
  isBlocked: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    const [y, m, d] = date.split('-').map(Number)
    const parsedDate = new Date(Date.UTC(y, m - 1, d))

    if (!isBlocked) {
      // Removing the exception (toggle off)
      await prisma.dmAvailabilityException.deleteMany({
        where: { campaignId, date: parsedDate },
      })
    } else {
      // Adding the exception (toggle on) — safe due to @@unique
      await prisma.dmAvailabilityException.upsert({
        where: { campaignId_date: { campaignId, date: parsedDate } },
        update: {},
        create: { campaignId, date: parsedDate },
      })
    }
    return { success: true }
  } catch (error) {
    console.error('toggleDmException error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}
```

**Auth guard:** Check `getSessionDM()` and verify `campaign.dmId === dm.id` before mutating — same as other campaign actions.

### Pattern 2: DayAggregation Extension

**What:** Add `dmBlocked: boolean` to the `DayAggregation` interface in `src/lib/availability.ts`. Pass exception data into `computeDayStatuses` as new parameters.
**When to use:** This is the single source of truth for whether a day is DM-blocked. All rendering components read from here.

```typescript
// Source: src/lib/availability.ts — extend existing interface
export interface DayAggregation {
  date: string
  playerStatuses: Record<string, PlayerDayStatus>
  freeCount: number
  totalPlayers: number
  allFree: boolean
  dmBlocked: boolean  // new — true when date is in dmExceptions AND mode is 'block' or 'flag'
}

// Updated computeDayStatuses signature
export function computeDayStatuses(
  playerSlots: PlayerSlotWithEntries[],
  windowStart: string,
  windowEnd: string,
  dmExceptionDateKeys?: Set<string>,   // new optional param
): DayAggregation[]
```

Inside the loop, after building `playerStatuses`:
```typescript
const isDmException = dmExceptionDateKeys?.has(dateKey) ?? false

result.push({
  date: dateKey,
  playerStatuses,
  freeCount,
  totalPlayers: playerSlots.length,
  allFree: freeCount === playerSlots.length && playerSlots.length > 0,
  dmBlocked: isDmException,
})
```

`computeBestDays` is NOT changed — it returns all days with `freeCount > 0` as before. Rendering components check `dmBlocked` to decide what to display.

### Pattern 3: DmExceptionCalendar Client Component

**What:** Client Component that renders the planning window calendar with DM-exception toggle behaviour. Optimistic state updates with rollback on Server Action error.
**When to use:** Shown only on the DM's campaign detail page (below or alongside the existing `DashboardCalendar`).

```typescript
// Source: mirrors src/components/AvailabilityForm.tsx click handling
'use client'

interface DmExceptionCalendarProps {
  campaignId: string
  planningWindowStart: string  // 'YYYY-MM-DD'
  planningWindowEnd: string    // 'YYYY-MM-DD'
  initialExceptions: string[]  // 'YYYY-MM-DD' array from server
  exceptionMode: 'block' | 'flag' | null
}

export function DmExceptionCalendar({
  campaignId,
  planningWindowStart,
  planningWindowEnd,
  initialExceptions,
  exceptionMode,
}: DmExceptionCalendarProps) {
  const [exceptions, setExceptions] = useState<Set<string>>(
    new Set(initialExceptions)
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  function handleDateClick(dateKey: string) {
    const isCurrentlyBlocked = exceptions.has(dateKey)
    const prevExceptions = exceptions
    const newExceptions = new Set(exceptions)
    if (isCurrentlyBlocked) newExceptions.delete(dateKey)
    else newExceptions.add(dateKey)

    setExceptions(newExceptions)   // optimistic update
    setSaveStatus('saving')

    toggleDmException(campaignId, dateKey, !isCurrentlyBlocked)
      .then(result => {
        if ('error' in result) {
          setSaveStatus('error')
          setExceptions(prevExceptions)  // rollback
        } else {
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
      })
      .catch(() => {
        setSaveStatus('error')
        setExceptions(prevExceptions)  // rollback
      })
  }

  // ... calendar grid rendering using buildMonthGrid, formatDateKey
  // Cell state: 'outside-window' | 'dm-blocked' | 'normal'
  // dm-blocked style: amber/orange token — visually distinct from player unavailability (gray)
}
```

### Pattern 4: Rendering DM-Blocked Days in BestDaysList and DashboardCalendar

**What:** Consuming `dmBlocked` from `DayAggregation` in existing rendering components.
**When to use:** Phase 14 (Dashboard Redesign) will do a deeper integration. Phase 13 adds the flag and minimal rendering support.

For `BestDaysList` — filter blocked days from the displayed list when mode is 'block'; show warning badge when mode is 'flag'. Since `BestDaysList` is a Server Component receiving pre-computed `days`, it can apply this logic directly:

```typescript
// In BestDaysList — the dmBlocked field is already on each DayAggregation
// No change needed yet — bestDays still computed by computeBestDays which ignores dmBlocked
// Phase 14 will wire the visual treatment; Phase 13 just ensures the field exists on the type
```

For `DashboardCalendar` — in Phase 13, the `dmBlocked` field is available on aggregations passed as props. Phase 14 will render the actual visual distinction. Phase 13 establishes the data contract; rendering can be a no-op visual in this phase.

### Pattern 5: CampaignDetailPage Data Fetch Update

**What:** Include `dmAvailabilityExceptions` in the existing `prisma.campaign.findUnique` call. Serialize dates to `YYYY-MM-DD` strings before passing to client components.

```typescript
// In src/app/campaigns/[id]/page.tsx
const campaign = await prisma.campaign.findUnique({
  where: { id },
  include: {
    playerSlots: {
      include: { availabilityEntries: true },
      orderBy: { createdAt: 'asc' },
    },
    dmAvailabilityExceptions: true,   // new
  },
})

// Serialize before passing to client components:
const dmExceptionDateKeys = new Set(
  campaign.dmAvailabilityExceptions.map(e =>
    e.date.toISOString().split('T')[0]
  )
)

// Pass to computeDayStatuses:
const dayAggregations = (windowStartStr && windowEndStr)
  ? computeDayStatuses(serializedSlots, windowStartStr, windowEndStr, dmExceptionDateKeys)
  : []

// Pass to DmExceptionCalendar:
const dmExceptionDates = Array.from(dmExceptionDateKeys)
```

### Anti-Patterns to Avoid

- **Filtering in `computeBestDays`:** Do not add a filter for `dmBlocked` inside `computeBestDays`. This makes "flag" mode inexpressible. Keep the ranking function pure; let rendering components use `dmBlocked`.
- **Reusing `AvailabilityEntry` for DM exceptions:** The schema already has a dedicated `DmAvailabilityException` model. Do not add DM logic to the player availability pipeline.
- **Calling `revalidatePath` from `toggleDmException`:** The client manages optimistic state. Triggering a server revalidation would cause a flash/re-render that conflicts with the optimistic update. Follow the same pattern as `toggleDateOverride` — no revalidation.
- **Using `new Date(dateString)` without UTC anchoring:** Always use `Date.UTC(y, m-1, d)` when constructing dates from YYYY-MM-DD strings in Server Actions. The ISO date-only string parsing is technically UTC-safe in Node.js, but the explicit `Date.UTC` pattern makes intent clear and matches the established codebase pattern.
- **Using `toISOString().split('T')[0]` for serialization inside calendarUtils.ts:** Use `formatDateKey(date)` from calendarUtils instead — it uses UTC getters, which is the safe pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar grid layout | Custom grid algorithm | `buildMonthGrid` from `calendarUtils.ts` | Already extracted in Phase 11; handles month padding correctly |
| Date key serialization | Custom formatter | `formatDateKey` from `calendarUtils.ts` | UTC-safe; used across all calendar components |
| Toggle upsert/delete | Custom upsert logic | Prisma `dmAvailabilityException.upsert` + `deleteMany` with `@@unique` accessor | Safe with composite unique; mirrors `toggleDateOverride` exactly |
| Optimistic state pattern | Custom state management | `useState` + rollback on Server Action error | Already proven in `AvailabilityForm` — copy the pattern |
| Toast / save feedback | New UI component | Extract from `AvailabilityForm.tsx` or inline the same pattern | The `Toast` component in `AvailabilityForm` does exactly what is needed |

**Key insight:** This phase is almost entirely pattern reuse. The main new code is wiring existing pieces to the new `DmAvailabilityException` table.

---

## Common Pitfalls

### Pitfall 1: Date Timezone Drift in the Server Action

**What goes wrong:** Using `new Date(dateString)` where `dateString` is a datetime string (e.g. `"2026-03-15T00:00:00"` without a Z suffix) in the Server Action stores a date shifted by the server's UTC offset.
**Why it happens:** Node.js parses date-only ISO strings as UTC, but datetime strings without Z as local time. The two formats look similar.
**How to avoid:** Use the `Date.UTC(y, m-1, d)` pattern explicitly, matching `toggleDateOverride`:
```typescript
const [y, m, d] = date.split('-').map(Number)
const parsedDate = new Date(Date.UTC(y, m - 1, d))
```
**Warning signs:** Exceptions appear to be stored one day behind the clicked date for DMs in non-UTC timezones.

### Pitfall 2: Toast Component is Not Shared

**What goes wrong:** `Toast` is defined as a local unexported function inside `AvailabilityForm.tsx`. Trying to import it elsewhere will fail.
**Why it happens:** It was never extracted to `src/components/Toast.tsx`.
**How to avoid:** Either (a) extract the `Toast` component to `src/components/Toast.tsx` as part of this phase and import it in both `AvailabilityForm` and `DmExceptionCalendar`, or (b) inline the same Toast pattern directly in `DmExceptionCalendar`. Option (a) is cleaner for maintainability.
**Warning signs:** TypeScript import error when trying to import `Toast` from `AvailabilityForm`.

### Pitfall 3: `dmBlocked` Field Missing from Callers of `computeDayStatuses`

**What goes wrong:** Adding `dmBlocked` to `DayAggregation` without updating all call sites that construct or consume `DayAggregation` objects will cause TypeScript errors or missing field bugs.
**Why it happens:** `DayAggregation` is referenced in `BestDaysList`, `DashboardCalendar`, `BestDaysList.tsx`, and `campaigns/[id]/page.tsx`. Changing the interface requires all of these to handle the new field.
**How to avoid:** Make `dmBlocked` required (not optional) on the interface — TypeScript will surface every call site that doesn't set it. Set `dmBlocked: false` in existing callers where no DM exceptions exist.
**Warning signs:** TypeScript errors of type `Property 'dmBlocked' is missing in type`.

### Pitfall 4: Optimistic State Divergence if Mode Changes Mid-Session

**What goes wrong:** If the DM changes `exceptionMode` (block/flag toggle) while the calendar is mounted, the visual state may not update correctly because `exceptionMode` is prop-derived at mount.
**Why it happens:** The `exceptionMode` prop is passed from the Server Component and doesn't change until a full page re-render.
**How to avoid:** The mode toggle (if built in this phase) should call `revalidatePath` after saving, which forces the Server Component to re-render and pass the updated `exceptionMode` down. Alternatively, manage `exceptionMode` in local state within `DmExceptionCalendar` alongside the exceptions. The simpler approach is to scope `exceptionMode` changes to a separate Server Action that calls `revalidatePath` — the calendar re-mounts with the new mode.
**Warning signs:** Visual display doesn't match the saved mode after toggling.

### Pitfall 5: Auth Check Missing in toggleDmException

**What goes wrong:** If `toggleDmException` does not verify that the current DM owns the campaign, any authenticated DM could modify another campaign's exceptions by calling the action with a different `campaignId`.
**Why it happens:** Server Actions are public endpoints — authorization must be explicit.
**How to avoid:** Follow the pattern in `deleteCampaign` and `updateMaxPlayers` — call `getSessionDM()`, then verify `campaign.dmId === dm.id` before any mutation.
**Warning signs:** No TypeScript error — this is a logic/security bug only caught by manual testing with two DM accounts.

### Pitfall 6: DmExceptionCalendar Shown to Non-DM Users

**What goes wrong:** `DmExceptionCalendar` is a DM-only control. If rendered for players, it exposes the DM's exception toggle UI.
**Why it happens:** The campaign detail page is DM-only (guarded by session check), but if the component is re-used elsewhere without guard context.
**How to avoid:** `DmExceptionCalendar` only appears in `campaigns/[id]/page.tsx`, which already checks DM authentication. No additional guard needed in the component itself, but document this clearly.

---

## Code Examples

### Existing toggleDateOverride — Template for toggleDmException

```typescript
// Source: src/lib/actions/availability.ts
export async function toggleDateOverride(
  playerSlotId: string,
  date: string,
  status: 'free' | 'busy' | null
): Promise<{ success: true } | { error: string }> {
  try {
    const [y, m, d] = date.split('-').map(Number)
    const parsedDate = new Date(Date.UTC(y, m - 1, d))

    if (status === null) {
      await prisma.availabilityEntry.deleteMany({
        where: { playerSlotId, type: 'override', date: parsedDate },
      })
    } else {
      await prisma.availabilityEntry.upsert({
        where: {
          playerSlotId_date: { playerSlotId, date: parsedDate },
        },
        update: { status },
        create: {
          playerSlotId,
          type: 'override',
          date: parsedDate,
          status,
        },
      })
    }
    return { success: true }
  } catch (error) {
    console.error('toggleDateOverride error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}
```

The `toggleDmException` action is structurally identical. Replace `playerSlotId` with `campaignId`, use `dmAvailabilityException` model, and the Prisma unique accessor will be `campaignId_date`.

### Existing Optimistic Toggle Pattern — Template for DmExceptionCalendar

```typescript
// Source: src/components/AvailabilityForm.tsx — handleDateClick
function handleDateClick(dateKey: string) {
  const prevOverrides = overrides           // save for rollback
  const newOverrides = new Map(overrides)
  // ... compute newStatus ...
  setOverrides(newOverrides)               // optimistic update
  setSaveStatus('saving')

  toggleDateOverride(playerSlotId, dateKey, newStatus)
    .then(result => {
      if ('error' in result) {
        setSaveStatus('error')
        setOverrides(prevOverrides)        // rollback on error
      } else {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    })
    .catch(() => {
      setSaveStatus('error')
      setOverrides(prevOverrides)          // rollback on network error
    })
}
```

`DmExceptionCalendar.handleDateClick` replaces `overrides: Map` with `exceptions: Set<string>` and calls `toggleDmException` instead.

### DashboardCalendar Integration Point

```typescript
// Source: src/components/DashboardCalendar.tsx — existing cell render
// After Phase 13, dmBlocked is available on each DayAggregation:
const agg = aggMap.get(dateKey)
// agg.dmBlocked === true when date is in DmAvailabilityExceptions

// Minimal Phase 13 treatment (full visual treatment in Phase 14):
// In DashboardCalendar cell, use agg?.dmBlocked to conditionally render
// a small amber indicator or muted styling
```

### BestDaysList Integration Point

```typescript
// Source: src/components/BestDaysList.tsx — existing day render
// After Phase 13, computeBestDays still returns all freeCount > 0 days.
// dmBlocked is available on each DayAggregation in the result.
// Phase 13 minimal treatment: BestDaysList can skip or badge dmBlocked days
// by checking day.dmBlocked in the map render.
```

### Serializing DM Exceptions in Page Component

```typescript
// Source: src/app/campaigns/[id]/page.tsx pattern for existing serialization
// Current pattern for availabilityEntries:
date: e.date?.toISOString() ?? null

// New pattern for dmExceptions — safe UTC serialization:
const dmExceptionDateKeys = new Set(
  campaign.dmAvailabilityExceptions.map(e =>
    e.date.toISOString().split('T')[0]
    // This is safe: e.date is stored as UTC midnight by the Server Action
  )
)
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Prisma `create` with try/catch for duplicates | `upsert` with `@@unique` composite accessor | `@@unique([campaignId, date])` enables `campaignId_date` accessor — safe idempotent toggle |
| Inline calendar grid logic per component | Shared `buildMonthGrid` from `calendarUtils.ts` | Phase 11 extracted this; use it everywhere |
| `revalidatePath` after toggle | Client-managed optimistic state, no revalidation | Established in `toggleDateOverride`; `DmExceptionCalendar` follows the same pattern |

**Schema state (confirmed from `prisma/schema.prisma`):**
- `DmAvailabilityException` model: exists with `@@unique([campaignId, date])`
- `Campaign.dmExceptionMode String?`: exists
- `Campaign.dmAvailabilityExceptions DmAvailabilityException[]`: relation exists
- Prisma unique accessor will be: `campaignId_date`

---

## Open Questions

1. **Toast extraction vs inline**
   - What we know: `Toast` is a local unexported function in `AvailabilityForm.tsx`
   - What's unclear: Whether to extract to `src/components/Toast.tsx` (shared) or inline in `DmExceptionCalendar`
   - Recommendation: Extract to `src/components/Toast.tsx` in Plan 13-01 — cleaner, avoids duplication if future phases need it, and `AvailabilityForm` updates its import

2. **Block/flag mode toggle UI placement in this phase**
   - What we know: DMEX-04 requires the toggle to exist; `Campaign.dmExceptionMode` is already in the schema
   - What's unclear: Whether the toggle is part of `DmExceptionCalendar` or a separate action/form element
   - Recommendation: Include a simple toggle button (block/flag) inside `DmExceptionCalendar` that calls a `setDmExceptionMode` Server Action and calls `revalidatePath` — this is simpler than managing mode in local state

3. **DashboardCalendar visual treatment of dmBlocked in Phase 13 vs Phase 14**
   - What we know: Phase 14 (Dashboard Redesign) will fully integrate `dmBlocked` visual treatment
   - What's unclear: How much visual treatment to add in Phase 13 vs defer to Phase 14
   - Recommendation: Phase 13 adds a minimal amber border or indicator on `DashboardCalendar` cells where `dmBlocked === true` — enough to confirm wiring works without redesigning the cell in Phase 13

4. **Product decision: DM-blocked dates visible to players?**
   - What we know: STATE.md blocker: "do DM-blocked dates affect the player-facing availability calendar view? Default is 'no player-facing change in v1.3'"
   - What's unclear: Confirmed decision
   - Recommendation: No player-facing change in Phase 13. `DmExceptionCalendar` is DM-only; the player availability view is unchanged.

---

## Plan Decomposition Recommendation

Based on the research, Phase 13 decomposes naturally into two plans:

**Plan 13-01: Data layer + Server Action**
- Add `dmBlocked: boolean` to `DayAggregation` in `src/lib/availability.ts`
- Update `computeDayStatuses` signature to accept `dmExceptionDateKeys?: Set<string>`
- Add `toggleDmException` Server Action to `src/lib/actions/campaign.ts`
- Add `setDmExceptionMode` Server Action to `src/lib/actions/campaign.ts`
- Extract `Toast` from `AvailabilityForm.tsx` to `src/components/Toast.tsx`
- Update `CampaignDetailPage` to include `dmAvailabilityExceptions`, serialize, and pass to `computeDayStatuses`

**Plan 13-02: DmExceptionCalendar component + visual wiring**
- Build `DmExceptionCalendar` client component with optimistic toggle UI
- Wire into `CampaignDetailPage` (render below or alongside `DashboardCalendar`)
- Add minimal `dmBlocked` visual treatment to `DashboardCalendar` (amber indicator)
- Add minimal `dmBlocked` handling to `BestDaysList` (badge or suppress based on mode)
- Human verification of full DM click-to-toggle flow, rollback on error, block/flag toggle

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection: `prisma/schema.prisma` — confirms `DmAvailabilityException` model, `@@unique([campaignId, date])`, `Campaign.dmExceptionMode String?` all exist
- Direct codebase inspection: `src/lib/actions/availability.ts` — exact `toggleDateOverride` pattern including `Date.UTC`, upsert with composite unique accessor, no-revalidatePath discipline
- Direct codebase inspection: `src/components/AvailabilityForm.tsx` — exact optimistic state + rollback pattern; Toast component implementation
- Direct codebase inspection: `src/lib/availability.ts` — current `DayAggregation` interface, `computeDayStatuses` signature, `computeBestDays` logic
- Direct codebase inspection: `src/components/DashboardCalendar.tsx` — existing cell rendering, `aggMap` lookup pattern
- Direct codebase inspection: `src/components/BestDaysList.tsx` — current Server Component structure, no 'use client'
- Direct codebase inspection: `src/lib/calendarUtils.ts` — `buildMonthGrid`, `formatDateKey` confirmed extracted in Phase 11
- Direct codebase inspection: `src/app/campaigns/[id]/page.tsx` — current page structure, `include` shape, serialization pattern, ShareModal integration model
- Direct codebase inspection: `src/lib/actions/campaign.ts` — auth guard pattern (`getSessionDM` + dmId check), existing action signatures
- `.planning/research/ARCHITECTURE.md` — architecture decisions and component boundaries
- `.planning/research/PITFALLS.md` — date timezone pitfalls, `computeBestDays` filter pitfall
- `.planning/research/SUMMARY.md` — overall architecture principles and phase rationale

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` — open blocker about player-facing DM exception visibility (confirmed: no player-facing change in v1.3)
- Prisma composite unique accessor naming convention (`campaignId_date`) — inferred from existing `playerSlotId_date` accessor in `toggleDateOverride`; consistent with Prisma naming docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries already in production
- Architecture: HIGH — every pattern has a direct codebase parallel; `DmAvailabilityException` schema confirmed in place
- Pitfalls: HIGH — date timezone pitfall verified from codebase; missing auth check is a standard Server Action concern; Toast extraction is a concrete finding from file inspection

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable Next.js/Prisma stack; no fast-moving dependencies)
