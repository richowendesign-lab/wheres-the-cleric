# Phase 11: Schema Foundation + Calendar Utilities — Research

**Researched:** 2026-03-09
**Domain:** Prisma schema migration + TypeScript utility extraction (Next.js 16 / Prisma 7 / React 19)
**Confidence:** HIGH

## Summary

Phase 11 is a zero-UI structural prerequisite. It has two independent tracks that can be planned as separate tasks: (1) adding the `DmAvailabilityException` model and `dmExceptionMode` field to the Prisma schema and pushing to Neon, and (2) extracting the duplicated `buildMonthGrid` / `formatDateKey` functions into `src/lib/calendarUtils.ts` and updating all three current copies to import from there.

Both tracks are entirely inside the existing codebase patterns. No new npm dependencies are needed. No new components are built. The schema work follows the exact same model structure as `AvailabilityEntry`. The utility extraction is a pure refactor: the functions are already written twice (and a third private version lives in `availability.ts`), so the task is moving them to a shared location and verifying no behaviour changes.

The only non-obvious detail is the `formatDateKey` reconciliation: the function exists as a private function in `availability.ts` (line 24), as a module-private function in `DashboardCalendar.tsx` (line 29), and as a module-private function in `AvailabilityCalendar.tsx` (line 27). All three are identical in implementation. The `calendarUtils.ts` extraction should export it and `availability.ts` should import from `calendarUtils.ts` rather than re-export it, to avoid a circular dependency. The `availability.ts` private copy can then be deleted.

**Primary recommendation:** Two sequential tasks — (1) schema migration, (2) calendarUtils extraction. Both are safe to execute in order with no risk of breaking existing behaviour.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^7.4.1 | ORM + migration | Already in use; `prisma db push` is the established migration command |
| Next.js | 16.1.6 | App Router framework | Already in use |
| TypeScript | ^5 | Type-safe utility module | Already in use |

### Supporting

No additional libraries required for this phase.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `prisma db push` | `prisma migrate dev` | `db push` is what the project already uses (see `package.json` scripts); no migration history files needed for this project |

**Installation:**

No new packages required.

## Architecture Patterns

### Recommended Project Structure

The only new file this phase creates is:

```
src/lib/
├── availability.ts       # existing — imports formatDateKey from calendarUtils
├── calendarUtils.ts      # NEW — exports buildMonthGrid, formatDateKey
src/components/
├── AvailabilityCalendar.tsx   # existing — updated import
├── DashboardCalendar.tsx      # existing — updated import
prisma/
├── schema.prisma         # existing — adds DmAvailabilityException + dmExceptionMode
```

### Pattern 1: Prisma Model Addition (following AvailabilityEntry pattern)

**What:** Add `DmAvailabilityException` as a first-class model with a `@@unique` constraint on `[campaignId, date]`. Add `dmExceptionMode String?` to `Campaign`.

**When to use:** Per-campaign, per-date DM exceptions — not nullable variants of `AvailabilityEntry`, not JSON columns.

**Example — exact schema additions:**

```prisma
// Add to Campaign model:
dmExceptionMode      String?
dmAvailabilityExceptions DmAvailabilityException[]

// New model:
model DmAvailabilityException {
  id         String   @id @default(cuid())
  campaignId String
  date       DateTime
  createdAt  DateTime @default(now())
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([campaignId, date])
}
```

Note: `date` uses `DateTime` (not `String`) matching the pattern in `AvailabilityEntry`. The `@@unique([campaignId, date])` mirrors `AvailabilityEntry`'s `@@unique([playerSlotId, date])`.

### Pattern 2: Utility Extraction (pure refactor)

**What:** Move the two functions from both component files into `calendarUtils.ts`. Delete the private copies. Update imports.

**When to use:** Any time the same function is copied in two+ files.

**Exact functions to extract (verified from codebase — both copies are byte-for-byte identical):**

```typescript
// Source: src/components/DashboardCalendar.tsx lines 15-31
//         src/components/AvailabilityCalendar.tsx lines 13-29 (identical)
// Destination: src/lib/calendarUtils.ts

export function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(Date.UTC(year, month, 1))
  const startDow = firstDay.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(Date.UTC(year, month, i + 1))),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// Source: src/components/DashboardCalendar.tsx line 29
//         src/components/AvailabilityCalendar.tsx line 27 (identical)
//         src/lib/availability.ts line 24 (identical, private — delete after extraction)
export function formatDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}
```

**Import changes after extraction:**

```typescript
// DashboardCalendar.tsx — remove local definitions, add:
import { buildMonthGrid, formatDateKey } from '@/lib/calendarUtils'

// AvailabilityCalendar.tsx — remove local definitions, add:
import { buildMonthGrid, formatDateKey } from '@/lib/calendarUtils'

// availability.ts — remove private formatDateKey definition, add:
import { formatDateKey } from '@/lib/calendarUtils'
```

### Anti-Patterns to Avoid

- **Putting `DmAvailabilityException` as a variant inside `AvailabilityEntry`:** The `@@unique([playerSlotId, date])` constraint in `AvailabilityEntry` is keyed on `playerSlotId`, not `campaignId`. A nullable `playerSlotId` in a composite unique index creates correctness risk in PostgreSQL and bypasses the ORM's type system.
- **Storing exceptions as a JSON column on `Campaign`:** Prevents indexed lookups, makes upsert logic complex, and differs from the established per-record pattern in this codebase.
- **Re-exporting `formatDateKey` from both `calendarUtils.ts` and `availability.ts`:** Creates two source-of-truth paths. `availability.ts` should import from `calendarUtils.ts`, not re-export.
- **Circular dependency:** If `availability.ts` imports from `calendarUtils.ts` and `calendarUtils.ts` imports from `availability.ts`, a circular dependency exists. `calendarUtils.ts` must have zero imports from `availability.ts`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month grid construction | Custom date-iteration logic | `buildMonthGrid` from `calendarUtils.ts` | Already written, tested by production use; UTC-safe; handles start-of-week padding and trailing padding correctly |
| Date key serialisation | Ad-hoc `date.toISOString().split('T')[0]` | `formatDateKey` from `calendarUtils.ts` | The ISO split approach is timezone-unsafe when the Date is in local time; `formatDateKey` uses `getUTC*` methods throughout |

**Key insight:** Both functions were already hand-rolled correctly once. The risk in this phase is introducing a new version, not implementing these algorithms for the first time.

## Common Pitfalls

### Pitfall 1: `prisma db push` on Neon requires environment variable

**What goes wrong:** Running `prisma db push` locally succeeds against the local SQLite env but fails in CI or against Neon if `DATABASE_URL` is not set to the Neon connection string.

**Why it happens:** The schema has `provider = "postgresql"` (no SQLite fallback). The project uses Neon for production and presumably a local Neon dev branch or the same database for local development.

**How to avoid:** Confirm `DATABASE_URL` is set to the correct Neon connection string in the environment where `prisma db push` runs. The `package.json` does not include a SQLite dev database entry.

**Warning signs:** `Error: P1001: Can't reach database server` or `Error: Environment variable not found: DATABASE_URL`.

### Pitfall 2: `formatDateKey` third copy in `availability.ts` is private and callers exist

**What goes wrong:** If the `formatDateKey` private function in `availability.ts` (line 24) is deleted without updating its one internal call site (`computeDayStatuses`, which calls it at line 81), TypeScript will error.

**Why it happens:** The function is private (not exported) so it is easy to miss that it is used within the same file.

**How to avoid:** When extracting, add the import to `availability.ts` before deleting the private copy. Verify TypeScript compiles with `next build` or `tsc --noEmit`.

**Warning signs:** `Cannot find name 'formatDateKey'` TypeScript error in `availability.ts`.

### Pitfall 3: `buildMonthGrid` uses `month` as 0-indexed UTC month — must not change signature

**What goes wrong:** If the function signature or semantics change during extraction (e.g., accidentally shifting to 1-indexed months), both calendar components will silently render wrong months.

**Why it happens:** The function takes `month` as 0-indexed (0=January) matching `Date.getUTCMonth()`. Both callers pass `month` directly from `getUTCMonth()`.

**How to avoid:** Copy the function body verbatim. Do not rename parameters or change indexing. The extraction is a move, not a rewrite.

**Warning signs:** Calendar months offset by one (November renders in October's position, etc.).

### Pitfall 4: `DmAvailabilityException.date` timezone handling

**What goes wrong:** Storing `date` as `DateTime` in Prisma means it is stored as UTC midnight. If a date string like `"2026-03-15"` is passed to `new Date("2026-03-15")`, Node.js parses it as UTC midnight — this is correct. But `new Date("2026-03-15T00:00:00")` (no Z suffix) is parsed as local time, which shifts the stored date in non-UTC timezones.

**Why it happens:** Prisma DateTime fields are stored as UTC timestamps, not date-only values.

**How to avoid:** When creating `DmAvailabilityException` records in a Server Action (Phase 13), always construct the date via `new Date(Date.UTC(y, m-1, d))` from parsed YYYY-MM-DD string parts, never via `new Date(dateString)` without a Z suffix.

**Warning signs:** Dates stored as `2026-03-14T23:00:00.000Z` when `2026-03-15T00:00:00.000Z` was intended (UTC-1 hour shift).

## Code Examples

Verified patterns from direct codebase inspection:

### Complete `calendarUtils.ts` file

```typescript
// src/lib/calendarUtils.ts
// Extracted from DashboardCalendar.tsx and AvailabilityCalendar.tsx
// Both source copies are byte-for-byte identical.

export function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(Date.UTC(year, month, 1))
  const startDow = firstDay.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(Date.UTC(year, month, i + 1))),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function formatDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}
```

### Complete Prisma schema additions

```prisma
// In Campaign model — add two lines:
dmExceptionMode          String?
dmAvailabilityExceptions DmAvailabilityException[]

// New model — add after existing models:
model DmAvailabilityException {
  id         String   @id @default(cuid())
  campaignId String
  date       DateTime
  createdAt  DateTime @default(now())
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([campaignId, date])
}
```

### `availability.ts` import change

```typescript
// Remove this private function (lines 24-26 of current availability.ts):
// function formatDateKey(date: Date): string {
//   return `${date.getUTCFullYear()}-...`
// }

// Add this import at the top:
import { formatDateKey } from '@/lib/calendarUtils'
```

### `DashboardCalendar.tsx` import change

```typescript
// Remove local buildMonthGrid (lines 15-27) and formatDateKey (lines 29-31)
// Add at top (after existing imports):
import { buildMonthGrid, formatDateKey } from '@/lib/calendarUtils'
```

### `AvailabilityCalendar.tsx` import change

```typescript
// Remove local buildMonthGrid (lines 13-25) and formatDateKey (lines 27-29)
// Add at top (before interface declaration):
import { buildMonthGrid, formatDateKey } from '@/lib/calendarUtils'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Copy function per component | Shared utility module | Phase 11 (now) | All future calendar components import once; changes propagate |
| No DM exception table | `DmAvailabilityException` model | Phase 11 (now) | Unblocks Phase 13 exception UI |

**Deprecated/outdated:**

- Module-private `buildMonthGrid` in `DashboardCalendar.tsx`: replaced by `calendarUtils.ts` export in this phase
- Module-private `buildMonthGrid` in `AvailabilityCalendar.tsx`: same
- Module-private `formatDateKey` in `DashboardCalendar.tsx`: replaced
- Module-private `formatDateKey` in `AvailabilityCalendar.tsx`: replaced
- Private `formatDateKey` in `availability.ts`: replaced by import

## Open Questions

1. **`updatePlanningWindow` does not call `revalidatePath`**
   - What we know: `campaign.ts` line 174 returns `{ success: true }` without `revalidatePath`. This is a pre-existing issue noted in STATE.md.
   - What's unclear: Does Phase 16 (custom date picker) need this fixed as part of the key-remount strategy?
   - Recommendation: Do NOT fix this in Phase 11. It is out of scope and belongs in Phase 16 investigation. Document it for the Phase 16 planner.

2. **Whether `Cascade` delete on `DmAvailabilityException` is correct**
   - What we know: `PlayerSlot` and `AvailabilityEntry` both use `onDelete: Cascade` — deleting a campaign cascade-deletes player slots and entries.
   - What's unclear: Nothing — cascade is correct. DM exception records are meaningless without the campaign.
   - Recommendation: Use `onDelete: Cascade` on `DmAvailabilityException.campaign`.

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection: `src/components/DashboardCalendar.tsx` — `buildMonthGrid` lines 15-27, `formatDateKey` lines 29-31
- Direct codebase inspection: `src/components/AvailabilityCalendar.tsx` — `buildMonthGrid` lines 13-25, `formatDateKey` lines 27-29
- Direct codebase inspection: `src/lib/availability.ts` — private `formatDateKey` line 24, `computeDayStatuses` usage line 81
- Direct codebase inspection: `prisma/schema.prisma` — current `Campaign`, `AvailabilityEntry`, `PlayerSlot` model structure
- Direct codebase inspection: `src/lib/actions/campaign.ts` — confirms `updatePlanningWindow` missing `revalidatePath`
- Direct codebase inspection: `package.json` — Prisma 7.4.1, Next.js 16.1.6, no date library dependencies
- `.planning/research/SUMMARY.md` — confirmed patterns, architecture decisions, pitfall catalogue
- `.planning/STATE.md` — confirmed open concern about `updatePlanningWindow` revalidation

### Secondary (MEDIUM confidence)

- Prisma 7 `@@unique` composite constraint behaviour with `DateTime` fields — consistent with `AvailabilityEntry` pattern already in schema; no verification against live Prisma 7 docs needed given the direct schema analogue

### Tertiary (LOW confidence)

- None — all claims in this research are derived from direct codebase inspection of working production code.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — verified from `package.json` and existing source files; no new dependencies
- Architecture: HIGH — all three current copies of `buildMonthGrid`/`formatDateKey` inspected directly; proposed schema follows existing `AvailabilityEntry` model verbatim
- Pitfalls: HIGH — all pitfalls derived from direct inspection of current code (private function usage, call sites, UTC patterns in existing components)

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable codebase, no fast-moving dependencies involved)
