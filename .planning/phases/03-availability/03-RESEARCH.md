# Phase 3: Availability - Research

**Researched:** 2026-02-24
**Domain:** React 19 interactive forms, Server Actions with auto-save, custom calendar widget, Prisma upsert patterns
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Day/time selection UI**
- Row of toggle buttons for days of the week (Mon Tue Wed Thu Fri Sat Sun)
- Unselected days are muted/greyed out; selected days highlight with D&D theme accent
- When a day is toggled on, inline time options expand beneath it (morning / afternoon / evening)
- Players can select multiple time preferences per day (e.g., afternoon AND evening)
- The availability form is the primary focus of the page — campaign name + player name appear at top as context, then straight into the form
- Weekly schedule section and date exceptions section are on the same page, stacked (weekly pattern on top, calendar below)
- Visual tone: D&D-themed — dark background, warm accent colors (gold/amber), atmospheric — consistent with Phase 2 landing page

**Date exception UX**
- Calendar widget scoped to the campaign's planning window
- Calendar pre-fills with the player's weekly pattern (days tinted to reflect availability); date-specific overrides display with a distinct visual marker
- Clicking a date inline toggles it between busy / free override states — no popup or modal
- Both override directions supported: mark a normally-free day as busy, or a normally-busy day as free
- Clicking an already-overridden date again reverts it to the weekly-pattern state (removes the exception)

**Save & submission flow**
- Auto-save on every interaction — no submit button
- Subtle "Availability saved" status text appears near the form after each change, then fades
- On save failure: show error message with a retry option ("Couldn't save — try again")
- No explicit completion state — the page is always live and editable; players can return and update any time

### Claude's Discretion
- Exact spacing, typography, and icon choices
- Loading/skeleton state while fetching existing availability
- Exact animation timing for the "Saved" indicator fade
- How to handle the planning window calendar if it spans many months (scrollable vs paginated)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AVAIL-01 | Player can set recurring weekly availability (which days of the week they're generally free) | Day-toggle component + Server Action that writes weekly AvailabilityEntry rows; delete-all-then-recreate pattern is simplest |
| AVAIL-02 | Player can specify time-of-day preference per day (morning / afternoon / evening) | Inline time-of-day buttons expand when day is toggled on; each (dayOfWeek, timeOfDay) combo is a separate AvailabilityEntry row |
| AVAIL-03 | Player can mark specific dates as free or busy, overriding their weekly pattern | Custom calendar grid + override AvailabilityEntry rows; needs @@unique([playerSlotId, date]) for clean upsert |
| AVAIL-04 | Player can return to their invite link at any time and update their availability | Server Component loads existing entries on page load and passes to client; auto-save persists changes immediately |
</phase_requirements>

---

## Summary

Phase 3 builds an interactive availability form on the existing invite page (`/invite/[token]`). The page currently renders a disabled "Set your availability" placeholder button — Phase 3 replaces that section with a fully working form. The form has two parts: a weekly day-of-week toggle grid (with time-of-day sub-options) and a custom calendar widget scoped to the campaign's planning window showing date-specific overrides.

The core technical challenge is auto-save: every user interaction (toggling a day, selecting a time, clicking a calendar date) must persist to the database immediately with no submit button. The recommended pattern is React 19 `useTransition` wrapping server action calls, with `useDebouncedCallback` from `use-debounce` to batch rapid interactions. Save status ("Availability saved") is managed entirely in client component state and fades via CSS transition — no extra library needed.

The existing Prisma schema already contains `AvailabilityEntry` with the right fields. However, the schema lacks a `@@unique` constraint on override entries, which is required for clean upsert operations. The recommended approach for weekly entries is delete-all-then-recreate (atomically, within a Prisma transaction) since the entire weekly pattern is always sent as a complete replacement. Override entries need a `@@unique([playerSlotId, date])` constraint added to the schema before a migration (`prisma db push`) to enable individual date upserts.

**Primary recommendation:** Build `AvailabilityForm` as a `'use client'` component that receives existing entries as props from the Server Component page, manages local state optimistically, and calls debounced Server Actions for persistence. No third-party calendar library is needed — build a custom grid with Tailwind CSS.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 (installed) | `useTransition`, `useOptimistic` for optimistic UI | Already in project; React 19 ships these hooks stable |
| Next.js Server Actions | 16.1.6 (installed) | Server-side persistence without API routes | Already established pattern in project; actions live in `src/lib/actions/` |
| Prisma | 7.4.1 (installed) | Database reads/writes for AvailabilityEntry | Already in project; schema already has the model |
| Tailwind CSS | 4 (installed) | All UI styling including toggle states, calendar grid | Already in project; all existing components use it |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-debounce | 10.1.0 | `useDebouncedCallback` to batch rapid user interactions before firing server action | Use for debouncing the save call — prevents a server round-trip per keypress/click |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom calendar grid | react-day-picker, react-calendar | Pre-built calendars are hard to style to dark D&D theme and don't support the specific "tint from weekly pattern + override marker" visual. Custom is ~80 lines of logic. |
| use-debounce | lodash/debounce | lodash is heavier and not React-aware; use-debounce provides React hooks and TypeScript types built in |
| delete-all-then-recreate for weekly | Upsert each row | Upsert requires @@unique on (playerSlotId, dayOfWeek, timeOfDay); delete+recreate in a transaction is simpler and avoids stale rows |

**Installation:**
```bash
npm install use-debounce
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── invite/[token]/
│       ├── page.tsx              # Server Component — loads slot + existing entries, renders page shell
│       └── not-found.tsx         # Already exists
├── components/
│   ├── AvailabilityForm.tsx      # 'use client' — root form container, manages all state
│   ├── WeeklySchedule.tsx        # 'use client' — day toggles + inline time-of-day options
│   └── AvailabilityCalendar.tsx  # 'use client' — custom calendar grid for date exceptions
└── lib/
    └── actions/
        └── availability.ts       # Server Actions: saveWeeklyPattern, toggleDateOverride
```

### Pattern 1: Server Component Page Passes Existing Data as Props

The invite page is already a Server Component. It fetches the player's existing `AvailabilityEntry` rows and passes them to the client `AvailabilityForm` component. This means the form renders with pre-populated state on first load — satisfying AVAIL-04.

```typescript
// src/app/invite/[token]/page.tsx  (Server Component)
// Source: https://nextjs.org/docs/app/getting-started/updating-data

const slot = await prisma.playerSlot.findUnique({
  where: { inviteToken: token },
  include: {
    campaign: true,
    availabilityEntries: true,    // fetch existing entries here
  },
})

// Pass to client component
return (
  <AvailabilityForm
    playerSlotId={slot.id}
    campaignId={slot.campaignId}
    planningWindowStart={slot.campaign.planningWindowStart}
    planningWindowEnd={slot.campaign.planningWindowEnd}
    initialEntries={slot.availabilityEntries}
  />
)
```

### Pattern 2: Auto-Save with useTransition + useDebouncedCallback

The client component fires a Server Action on every user interaction. Debouncing prevents a server round-trip per click when users toggle options quickly. `useTransition` is used so the save is non-blocking (UI stays interactive while server processes).

```typescript
// src/components/AvailabilityForm.tsx
// Source: https://nextjs.org/docs/app/getting-started/updating-data (Event Handlers section)
'use client'

import { useTransition, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { saveWeeklyPattern } from '@/lib/actions/availability'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function AvailabilityForm({ playerSlotId, initialEntries, ... }) {
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Debounce: wait 600ms after last change before hitting the server
  const debouncedSave = useDebouncedCallback(
    (weeklyEntries: WeeklyEntry[]) => {
      startTransition(async () => {
        setSaveStatus('saving')
        const result = await saveWeeklyPattern(playerSlotId, weeklyEntries)
        if (result.error) {
          setSaveStatus('error')
        } else {
          setSaveStatus('saved')
          // Fade back to idle after 2s
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
      })
    },
    600
  )

  // Called on every toggle interaction
  function handleDayToggle(dayOfWeek: number) {
    const newState = computeNewState(...)
    setLocalState(newState)         // update local state immediately
    debouncedSave(newState)         // persist after debounce delay
  }

  return (
    <div>
      <WeeklySchedule ... onChange={handleDayToggle} />
      <SaveIndicator status={saveStatus} />
    </div>
  )
}
```

### Pattern 3: Save Status Indicator with CSS Fade

The "Availability saved" indicator is a status component that fades in/out using Tailwind CSS `transition-opacity`. No animation library needed.

```typescript
// Inline or small sub-component
function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <div
      className={`
        text-sm transition-opacity duration-500
        ${status === 'idle' ? 'opacity-0' : 'opacity-100'}
        ${status === 'saved' ? 'text-green-400' : ''}
        ${status === 'saving' ? 'text-gray-400' : ''}
        ${status === 'error' ? 'text-red-400' : ''}
      `}
    >
      {status === 'saved' && 'Availability saved'}
      {status === 'saving' && 'Saving...'}
      {status === 'error' && (
        <>Couldn&apos;t save —{' '}
          <button className="underline" onClick={retry}>try again</button>
        </>
      )}
    </div>
  )
}
```

### Pattern 4: Custom Calendar Grid for Date Exceptions

Build a simple month grid using JavaScript `Date` arithmetic. No library required. Each cell is a button that cycles through states: pattern-derived → override-busy → override-free → back to pattern-derived.

```typescript
// Calendar grid generation (pure function, no library)
function buildCalendarMonth(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = firstDay.getDay() // 0=Sun, consistent with Prisma dayOfWeek

  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]

  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  // Split into weeks
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
```

### Pattern 5: Prisma Server Actions for Availability

Weekly pattern uses delete-all-then-recreate within a Prisma transaction. Override uses upsert with a composite unique constraint (requires schema migration — see Pitfalls).

```typescript
// src/lib/actions/availability.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// AVAIL-01 + AVAIL-02: Replace entire weekly pattern atomically
export async function saveWeeklyPattern(
  playerSlotId: string,
  entries: { dayOfWeek: number; timeOfDay: string }[]
) {
  try {
    await prisma.$transaction([
      prisma.availabilityEntry.deleteMany({
        where: { playerSlotId, type: 'weekly' },
      }),
      prisma.availabilityEntry.createMany({
        data: entries.map(e => ({
          playerSlotId,
          type: 'weekly',
          dayOfWeek: e.dayOfWeek,
          timeOfDay: e.timeOfDay,
          status: 'free',
        })),
      }),
    ])
    revalidatePath(`/invite/[token]`, 'page')
    return { success: true }
  } catch (error) {
    console.error('saveWeeklyPattern error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}

// AVAIL-03: Toggle a specific date override
export async function toggleDateOverride(
  playerSlotId: string,
  date: string,       // ISO date string "YYYY-MM-DD"
  status: 'free' | 'busy' | null  // null = remove override (revert to weekly pattern)
) {
  try {
    if (status === null) {
      // Revert: remove the override entry
      await prisma.availabilityEntry.deleteMany({
        where: { playerSlotId, type: 'override', date: new Date(date) },
      })
    } else {
      // Upsert the override — requires @@unique([playerSlotId, date]) in schema
      await prisma.availabilityEntry.upsert({
        where: {
          playerSlotId_date: { playerSlotId, date: new Date(date) },
        },
        update: { status },
        create: {
          playerSlotId,
          type: 'override',
          date: new Date(date),
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

### Anti-Patterns to Avoid

- **Calling Server Actions directly in onChange without debounce:** Every toggle fires a network request — degrades performance and hits the database on every click. Always wrap with `useDebouncedCallback`.
- **Using `router.refresh()` for save feedback:** `refresh()` triggers a full server render round-trip and replaces client state. For auto-save, return the result from the Server Action and update local state instead.
- **Storing availability as a single JSON blob:** The current schema's relational model (one row per entry) is correct — it enables efficient querying for the Phase 4 dashboard. Do not collapse into a JSON column.
- **Building a calendar library integration:** Heavy calendar libraries (FullCalendar, react-big-calendar) are built for event scheduling UIs, not simple day-status toggling. The custom grid is ~80 lines and trivially styleable with Tailwind.
- **Forgetting to scope override entries to the planning window:** The calendar should only show dates between `planningWindowStart` and `planningWindowEnd`. Dates outside that range should not be rendered or clickable.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debouncing event handlers | Custom `setTimeout`/`clearTimeout` logic with refs | `use-debounce` `useDebouncedCallback` | Handles React re-render edge cases, provides `cancel()` and `isPending()`, TypeScript-typed |
| Date arithmetic | Custom month-grid calculator | Inline pure JS with `new Date(year, month, 1)` | No library needed — month grid is 15 lines of standard JS. Don't over-engineer. |
| Save status fade animation | CSS keyframes, Framer Motion | Tailwind `transition-opacity duration-500` | Already available; no new dependency |

**Key insight:** The biggest "don't hand-roll" here is the auto-save plumbing — the combination of debounce + useTransition + error state is a well-understood React 19 pattern. Don't invent a custom solution; follow the pattern documented above.

---

## Common Pitfalls

### Pitfall 1: Missing @@unique on AvailabilityEntry for Override Upserts

**What goes wrong:** The current Prisma schema has no `@@unique` constraint on `AvailabilityEntry`. Calling `prisma.availabilityEntry.upsert()` for override entries requires a unique field in the `where` clause. Without `@@unique([playerSlotId, date])`, the upsert will throw a Prisma error (`P2025` or runtime error).

**Why it happens:** The schema was scaffolded in Phase 1 with the correct fields but the unique constraint was deferred. Prisma upsert requires the `where` clause to reference a `@unique` or `@@unique` field.

**How to avoid:** Add `@@unique([playerSlotId, date])` to the schema BEFORE implementing the override action. Run `npx prisma db push` (development) to apply to dev.db. The Prisma-generated accessor name will be `playerSlotId_date`.

**Warning signs:** `PrismaClientKnownRequestError: An operation failed because it depends on one or more records that were required but not found` or `Invalid where argument` at runtime.

```prisma
// Add to AvailabilityEntry model in prisma/schema.prisma:
@@unique([playerSlotId, date])
```

### Pitfall 2: Date Timezone Mismatch in Override Entries

**What goes wrong:** The planning window dates and override dates are stored as `DateTime` in SQLite. If the server and client are in different timezones, `new Date('2026-03-15')` may be interpreted as midnight UTC, but when stored and retrieved it renders as March 14 in a UTC-5 timezone.

**Why it happens:** JavaScript `new Date('YYYY-MM-DD')` (ISO date string without time) is parsed as UTC midnight. SQLite stores as UTC. When rendered, `date.toLocaleDateString()` shifts to local time.

**How to avoid:** Always treat override dates as date-only (year/month/day). When creating the Date object for Prisma, use `new Date(Date.UTC(year, month, day))` or pass the ISO string and normalize consistently. When displaying, use `{ timeZone: 'UTC' }` in `toLocaleDateString()`.

**Warning signs:** A date override appears one day off when the user's browser is behind UTC.

### Pitfall 3: revalidatePath Causes Form State Loss

**What goes wrong:** Calling `revalidatePath('/invite/[token]', 'page')` inside a Server Action after every save triggers a full server re-render of the page. If the client component is not using optimistic state, the UI flickers or loses focus between saves.

**Why it happens:** `revalidatePath` invalidates the Next.js cache and causes a server round-trip on the next navigation. For auto-save, the data is already persisted — there's no need to revalidate the page immediately.

**How to avoid:** For the auto-save pattern, do NOT call `revalidatePath` after every save. Instead, return `{ success: true }` from the action and let the client component manage its own state. Only revalidate if the user navigates away and returns.

**Warning signs:** Form loses focus after every save, or visible re-render flicker after each interaction.

### Pitfall 4: createMany Not Supported in SQLite via Prisma Adapter

**What goes wrong:** `prisma.availabilityEntry.createMany()` may behave differently or throw errors depending on Prisma version and SQLite adapter configuration.

**Why it happens:** SQLite does not natively support bulk insert returning in the same way PostgreSQL does. Prisma 7 with `better-sqlite3` adapter should support `createMany`, but this was flagged as a known issue in earlier Prisma versions.

**How to avoid:** If `createMany` causes issues, fall back to multiple `create` calls inside a `$transaction` array. Test `createMany` explicitly during implementation.

**Warning signs:** Runtime error on `createMany` with SQLite in development.

### Pitfall 5: Debounce Flush on Component Unmount

**What goes wrong:** If the user makes a change and immediately navigates away (e.g., closes the tab), the debounced save never fires — their last change is lost.

**Why it happens:** The debounced callback is cancelled when the component unmounts before the delay elapses.

**How to avoid:** Call `debouncedSave.flush()` in a `useEffect` cleanup. `use-debounce` provides a `.flush()` method on the returned debounced function.

**Warning signs:** Occasional "lost" saves when users quickly interact and leave.

```typescript
useEffect(() => {
  return () => {
    debouncedSave.flush()
  }
}, [debouncedSave])
```

---

## Code Examples

### Schema Migration Required Before Implementation

```prisma
// prisma/schema.prisma — add @@unique to AvailabilityEntry
model AvailabilityEntry {
  id           String     @id @default(cuid())
  playerSlotId String
  type         String     // "weekly" | "override"
  dayOfWeek    Int?       // 0=Sun ... 6=Sat (weekly only)
  date         DateTime?  // specific date (override only)
  timeOfDay    String?    // "morning" | "afternoon" | "evening"
  status       String     // "free" | "busy"
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  playerSlot   PlayerSlot @relation(fields: [playerSlotId], references: [id], onDelete: Cascade)

  @@unique([playerSlotId, date])   // <-- ADD THIS
}
```

Apply with: `npx prisma db push` (dev) — no migration file needed since project uses `prisma db push` pattern (no `prisma/migrations/` directory exists).

### Fetching Existing Entries in Server Component

```typescript
// src/app/invite/[token]/page.tsx
// Source: existing project pattern + official Next.js docs
const slot = await prisma.playerSlot.findUnique({
  where: { inviteToken: token },
  include: {
    campaign: true,
    availabilityEntries: true,
  },
})
if (!slot) notFound()

// Pass to client
return (
  <main className="min-h-screen bg-gray-950 text-gray-100">
    {/* existing header JSX */}
    <AvailabilityForm
      playerSlotId={slot.id}
      campaignName={slot.campaign.name}
      playerName={slot.name}
      planningWindowStart={slot.campaign.planningWindowStart}
      planningWindowEnd={slot.campaign.planningWindowEnd}
      initialEntries={slot.availabilityEntries}
    />
  </main>
)
```

### Weekly Day Toggle State Shape

```typescript
// Local state shape for the weekly scheduler
// Each set entry = "this day at this time is selected"
type WeeklySelection = Set<`${number}-${'morning'|'afternoon'|'evening'}`>
// e.g. "1-morning" = Monday morning, "6-evening" = Saturday evening

// Converting to AvailabilityEntry rows for the server action:
function selectionToEntries(selection: WeeklySelection) {
  return Array.from(selection).map(key => {
    const [day, time] = key.split('-')
    return { dayOfWeek: Number(day), timeOfDay: time }
  })
}
```

### Calendar Date Status Derivation

```typescript
// For a given date in the calendar grid, determine its display state
type DateStatus =
  | { kind: 'outside-window' }
  | { kind: 'pattern-free'; times: string[] }   // tinted amber, from weekly pattern
  | { kind: 'pattern-busy' }                      // muted/grey
  | { kind: 'override-free' }                     // green marker
  | { kind: 'override-busy' }                     // red marker

function getDateStatus(
  date: Date,
  weeklyEntries: { dayOfWeek: number; timeOfDay: string; status: string }[],
  overrideEntries: { date: Date; status: string }[],
  windowStart: Date,
  windowEnd: Date
): DateStatus {
  if (date < windowStart || date > windowEnd) return { kind: 'outside-window' }

  const override = overrideEntries.find(
    e => e.date.toDateString() === date.toDateString()
  )
  if (override) {
    return override.status === 'free'
      ? { kind: 'override-free' }
      : { kind: 'override-busy' }
  }

  const dow = date.getDay() // 0=Sun, matches Prisma dayOfWeek convention
  const dayEntries = weeklyEntries.filter(
    e => e.dayOfWeek === dow && e.status === 'free'
  )
  if (dayEntries.length > 0) {
    return { kind: 'pattern-free', times: dayEntries.map(e => e.timeOfDay) }
  }

  return { kind: 'pattern-busy' }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API routes (`/api/availability`) for saves | Server Actions called directly from event handlers | Next.js 13+ App Router | Eliminates boilerplate, co-locates server logic with the feature |
| `useState` + `fetch` for optimistic updates | `useOptimistic` + `useTransition` (React 19) | React 19 stable (Dec 2024) | React manages rollback on failure automatically |
| `useFormStatus` tied to `<form>` | `useTransition` for non-form interactions | React 19 | Auto-save via event handlers doesn't use `<form>` — `useTransition` is the right primitive |
| External calendar libraries for scheduling | Custom grid with Tailwind for simple day-status display | — | Avoids 200KB+ dependency for a 50-line grid |

**Deprecated/outdated:**
- `useActionState` with `<form action={...}>`: Correct for form-based submissions. For this phase, most saves are triggered by click/toggle handlers — use `startTransition` + direct Server Action call instead.

---

## Open Questions

1. **createMany with SQLite/PrismaBetterSqlite3 adapter compatibility**
   - What we know: `createMany` works in Prisma 7 with SQLite for basic cases
   - What's unclear: Whether the `better-sqlite3` adapter in this project supports `createMany` without `skipDuplicates`
   - Recommendation: Test in Wave 1 with a simple `createMany` call; if it throws, fall back to `create` calls inside `$transaction`

2. **Planning window spanning multiple months**
   - What we know: Left to Claude's discretion (CONTEXT.md)
   - What's unclear: Whether to use scrollable single-column months or paginated prev/next navigation
   - Recommendation: Start with scrollable continuous months (simpler to build, no pagination state); if the window is > 2 months, it may feel long — add a month-navigation header if that happens

3. **Serializing DateTime props from Server Component to Client Component**
   - What we know: Next.js Server Components cannot pass `Date` objects directly as props to client components — they must be serialized
   - What's unclear: Whether this already happens silently or throws a runtime error
   - Recommendation: Serialize dates to ISO strings (`date.toISOString()`) before passing as props, deserialize in the client component with `new Date(dateString)`

---

## Sources

### Primary (HIGH confidence)
- Next.js 16.1.6 official docs - https://nextjs.org/docs/app/getting-started/updating-data - Event Handlers, useEffect, pending state patterns for Server Actions
- React 19 official docs - https://react.dev/reference/react/useOptimistic - useOptimistic hook signature and examples
- Existing project codebase - prisma/schema.prisma, src/lib/actions/campaign.ts, src/app/invite/[token]/page.tsx - established patterns

### Secondary (MEDIUM confidence)
- use-debounce GitHub README - https://github.com/xnimorz/use-debounce - v10.1.0, useDebouncedCallback API
- Prisma docs on composite unique constraints - https://www.prisma.io/docs/orm/prisma-client/queries/crud#update-or-create-records - upsert with @@unique

### Tertiary (LOW confidence)
- WebSearch: createMany SQLite adapter compatibility — not verified against Prisma 7 + better-sqlite3 specific docs; marked as open question

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed in project; patterns verified against official Next.js 16 and React 19 docs
- Architecture: HIGH - Server Component + Client Component split matches existing project structure; Server Action pattern matches existing `src/lib/actions/campaign.ts`
- Pitfalls: HIGH for timezone and revalidatePath issues (verified); MEDIUM for createMany/SQLite (flagged as open question)

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (Next.js and React are stable; Prisma 7 API is stable)
