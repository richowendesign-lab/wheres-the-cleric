# Phase 25: Sync Schema and Server Layer - Research

**Researched:** 2026-03-16
**Domain:** Prisma schema migration + Next.js server action extension for cross-campaign DM availability sync
**Confidence:** HIGH — based on direct codebase inspection of all relevant files

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYNC-01 | DM marking a date unavailable in one campaign automatically marks it in all their other sync-enabled campaigns | `toggleDmException` extended to find sibling campaigns (same DM, `dmSyncEnabled = true`) and upsert the same exception date for each sibling within its planning window |
| SYNC-02 | DM removing an unavailable date in one campaign removes it from all their other sync-enabled campaigns | Same extension — the `deleteMany` branch of `toggleDmException` applies to each sibling campaign ID |
| SYNC-04 | Re-enabling sync does not backfill existing exceptions — only future toggles propagate | `setDmSyncEnabled(true)` only updates the boolean field; no backfill query; toggle label copy communicates forward-only semantics |
</phase_requirements>

---

## Summary

Phase 25 delivers the server infrastructure for cross-campaign DM availability sync. It has two deliverables: (1) a Prisma schema migration adding `dmSyncEnabled Boolean @default(true)` to the `Campaign` model, and (2) two server actions — an extension to the existing `toggleDmException` action plus a new `setDmSyncEnabled` action.

No new dependencies are needed. The existing stack (Prisma 7, Next.js server actions, `revalidatePath`) handles everything. The DM-to-Campaign relation (`dm.campaigns`) already exists in the schema, so the sibling lookup is a single `findMany` with two filter conditions. The `DmAvailabilityException` model is unchanged — exceptions continue to be stored per-campaign with the existing `(campaignId, date)` composite unique index.

Phase 25 has no UI deliverables. `DmSyncToggle` (the client component that calls `setDmSyncEnabled`) is a Phase 27 deliverable. This means the `setDmSyncEnabled` action ships in Phase 25 but is not wired to any UI until Phase 27. The `toggleDmException` sync propagation, however, activates immediately once the schema migration runs — any date toggle in the DM exception calendar will propagate to all sibling campaigns with `dmSyncEnabled = true` (the default).

**Primary recommendation:** Run `prisma db push` and regenerate the Prisma client as the literal first step. All other code in this phase depends on the `dmSyncEnabled` field existing in the generated TypeScript types. Write both server actions in a single edit to `src/lib/actions/campaign.ts` after the client is regenerated.

---

## Standard Stack

### Core (already in project — zero new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 7.x | Schema migration + ORM queries | Already in use; `@default(true)` is the standard way to add non-nullable booleans without a data migration |
| Next.js server actions | 15/16 | `toggleDmException` extension + `setDmSyncEnabled` | All mutation logic stays server-side; matches existing action patterns in `campaign.ts` |
| `revalidatePath` | Next.js built-in | Cache invalidation after writes | Already used by every action in `campaign.ts`; per-ID loop is the confirmed pattern |

**Installation:** No installs required. All dependencies are present.

---

## Architecture Patterns

### Recommended Project Structure (no changes)

```
prisma/
  schema.prisma              ← add dmSyncEnabled field here (Wave 1)
src/
  lib/
    actions/
      campaign.ts            ← extend toggleDmException + add setDmSyncEnabled (Wave 2)
  generated/
    prisma/                  ← regenerated after schema change (automated by prisma db push)
```

### Pattern 1: Additive Schema Field with Default

**What:** Adding a non-nullable boolean with a database-level default so no data migration is required.

**When to use:** When adding a field to an existing table where all existing rows should get a sensible value without manual UPDATE statements.

**Current schema (before):**
```prisma
model Campaign {
  id                  String       @id @default(cuid())
  // ... existing fields ...
  dmExceptionMode     String?
  dmAvailabilityExceptions DmAvailabilityException[]
}
```

**After — add one line:**
```prisma
model Campaign {
  id                  String       @id @default(cuid())
  // ... existing fields ...
  dmExceptionMode     String?
  dmSyncEnabled       Boolean      @default(true)   // NEW
  dmAvailabilityExceptions DmAvailabilityException[]
}
```

**Migration command:**
```bash
npx prisma db push
```

`db push` (not `migrate dev`) is the correct command for this project. It applies schema changes directly to the database without creating a migration file. Confirmed: the project uses SQLite locally and Neon PostgreSQL in production; `db push` is the existing workflow (no `/prisma/migrations/` directory exists).

After `db push`, regenerate the Prisma client:
```bash
npx prisma generate
```

Both are typically combined: `npx prisma db push` runs generation automatically.

### Pattern 2: Sibling Campaign Lookup in Server Action

**What:** Finding all other campaigns owned by the same DM with sync enabled.

**When to use:** In `toggleDmException` after the primary campaign write, to propagate the exception to siblings.

**Example — sibling lookup:**
```typescript
// Source: direct codebase inspection of campaign.ts + schema.prisma
const siblingCampaigns = await prisma.campaign.findMany({
  where: {
    dmId: dm.id,
    id: { not: campaignId },
    dmSyncEnabled: true,
  },
  select: {
    id: true,
    planningWindowStart: true,
    planningWindowEnd: true,
  },
})
```

**Window-scope filter:** Before writing to a sibling, check that `parsedDate` falls within `[sibling.planningWindowStart, sibling.planningWindowEnd]`. This prevents storing exceptions for dates the sibling campaign will never display.

```typescript
for (const sibling of siblingCampaigns) {
  if (!sibling.planningWindowStart || !sibling.planningWindowEnd) continue
  if (parsedDate < sibling.planningWindowStart || parsedDate > sibling.planningWindowEnd) continue

  if (!isBlocked) {
    await prisma.dmAvailabilityException.deleteMany({
      where: { campaignId: sibling.id, date: parsedDate },
    })
  } else {
    await prisma.dmAvailabilityException.upsert({
      where: { campaignId_date: { campaignId: sibling.id, date: parsedDate } },
      update: {},
      create: { campaignId: sibling.id, date: parsedDate },
    })
  }
  revalidatePath(`/campaigns/${sibling.id}`)
}
```

### Pattern 3: Forward-Only `setDmSyncEnabled` Action

**What:** Updating the `dmSyncEnabled` boolean without backfilling past exceptions.

**When to use:** When the DM toggles the sync toggle in Settings (Phase 27 UI).

**Example:**
```typescript
// Source: follows setDmExceptionMode pattern in campaign.ts
export async function setDmSyncEnabled(
  campaignId: string,
  enabled: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    const dm = await getSessionDM()
    if (!dm) return { error: 'Not authenticated' }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { dmId: true },
    })
    if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { dmSyncEnabled: enabled },
    })

    revalidatePath(`/campaigns/${campaignId}`)
    return { success: true }
  } catch (error) {
    console.error('setDmSyncEnabled error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}
```

No backfill query. SYNC-04 explicitly requires forward-only semantics. The toggle UI label in Phase 27 must communicate this.

### Pattern 4: Existing `toggleDmException` Structure to Extend

**Current structure** (from direct inspection of `src/lib/actions/campaign.ts` lines 145–179):

```typescript
export async function toggleDmException(
  campaignId: string,
  date: string,   // 'YYYY-MM-DD'
  isBlocked: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    const dm = await getSessionDM()
    if (!dm) return { error: 'Not authenticated' }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { dmId: true }   // ← EXTEND: also select dmSyncEnabled (or rely on sibling query to filter)
    })
    if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

    const [y, m, d] = date.split('-').map(Number)
    const parsedDate = new Date(Date.UTC(y, m - 1, d))

    if (!isBlocked) {
      await prisma.dmAvailabilityException.deleteMany({
        where: { campaignId, date: parsedDate },
      })
    } else {
      await prisma.dmAvailabilityException.upsert({
        where: { campaignId_date: { campaignId, date: parsedDate } },
        update: {},
        create: { campaignId, date: parsedDate },
      })
    }
    revalidatePath(`/campaigns/${campaignId}`)
    // ← INSERT: sibling propagation block here (Pattern 2)
    return { success: true }
  } catch (error) {
    console.error('toggleDmException error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}
```

The extension is purely additive — existing logic is unchanged. The sibling block runs unconditionally (the query returns 0 siblings if the DM only has one campaign, or if no siblings have `dmSyncEnabled = true`).

### Pattern 5: Optimistic Update Pattern (for `DmSyncToggle` in Phase 27)

Phase 25 does not build the `DmSyncToggle` component, but `setDmSyncEnabled` must match the call signature the component will expect. The established optimistic pattern from `DmExceptionCalendar` is:

```typescript
// Caller pattern (DmSyncToggle — Phase 27):
const prevEnabled = enabled
setEnabled(!enabled)      // optimistic
setStatus('saving')

setDmSyncEnabled(campaignId, !prevEnabled)
  .then(result => {
    if ('error' in result) {
      setEnabled(prevEnabled)   // rollback
      setStatus('error')
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    }
  })
  .catch(() => {
    setEnabled(prevEnabled)     // rollback
    setStatus('error')
  })
```

`setDmSyncEnabled` must return `{ success: true } | { error: string }` — consistent with all other actions in `campaign.ts`.

### Anti-Patterns to Avoid

- **Running `prisma migrate dev` instead of `prisma db push`**: This project has no `/prisma/migrations/` directory; the workflow is `db push`. Using `migrate dev` creates migration files that don't match the project's existing pattern.
- **Checking `campaign.dmSyncEnabled` before propagating**: The current campaign's sync setting is irrelevant to propagation — sync means "when I toggle here, propagate to others". The originating campaign does not need to have `dmSyncEnabled = true` to propagate. Only the sibling's `dmSyncEnabled` value determines whether it receives the update.
- **Backfilling on `setDmSyncEnabled(true)`**: SYNC-04 explicitly prohibits this. Do not query existing exceptions from other campaigns. Do not upsert anything beyond updating the boolean field.
- **Using `revalidatePath('/campaigns', 'layout')` without fallback**: MEDIUM confidence that this cascades to all `/campaigns/[id]` children. Use explicit per-sibling `revalidatePath(`/campaigns/${sibling.id}`)` calls — the existing pattern in the codebase. Cost is negligible for typical DM campaign counts.
- **Client-side sync propagation**: The `DmExceptionCalendar` component must not be modified to iterate sibling campaigns. Sync logic belongs exclusively in the server action.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upsert with unique constraint | Custom SELECT + INSERT/UPDATE logic | Prisma `upsert` with `campaignId_date` composite key | Already used in current `toggleDmException`; handles concurrent writes safely |
| Bulk exception writes | N individual `create` calls | Prisma `upsert` per sibling (or `createMany` with `skipDuplicates: true`) | `@@unique([campaignId, date])` enforces idempotency; upsert is the safe pattern |
| Date UTC normalization | Custom date library | Manual `Date.UTC(y, m-1, d)` pattern | Already established in `toggleDmException` — use the same `date.split('-').map(Number)` pattern |
| Auth ownership check | Custom middleware | `getSessionDM()` + `campaign.dmId !== dm.id` | Already the pattern in every server action in `campaign.ts` |

---

## Common Pitfalls

### Pitfall 1: TypeScript error before Prisma client regeneration

**What goes wrong:** Writing `campaign.dmSyncEnabled` or `{ dmSyncEnabled: true }` in query code before running `prisma db push` causes TypeScript to error ("Property 'dmSyncEnabled' does not exist on type 'Campaign'").

**Why it happens:** The generated Prisma client in `src/generated/prisma/` does not include the new field until regenerated.

**How to avoid:** Run `npx prisma db push` (which also regenerates the client) before writing any action code that references `dmSyncEnabled`. This must be the first task in Wave 1.

**Warning signs:** TypeScript LSP errors on `dmSyncEnabled` in the actions file immediately after adding schema field.

### Pitfall 2: Sibling propagation writes to dates outside planning window

**What goes wrong:** Campaign B has a planning window of May–August. DM marks April unavailable in Campaign A. April exception gets written to Campaign B. April never appears in Campaign B's calendar, but the exception record exists in the DB. Later, DM extends Campaign B's window to include April — the exception appears unexpectedly with no memory of how it got there.

**Why it happens:** Window check is omitted from the sibling loop.

**How to avoid:** In the sibling loop, skip any sibling where `parsedDate < sibling.planningWindowStart || parsedDate > sibling.planningWindowEnd`. Both window dates must be selected in the `findMany`.

**Warning signs:** Sibling campaigns showing unexpected exceptions after window is extended.

### Pitfall 3: Originating campaign's `dmSyncEnabled` misread as propagation gate

**What goes wrong:** Developer reads `campaign.dmSyncEnabled` on the originating campaign and skips propagation if it is `false`, thinking "this campaign opted out so don't propagate." But `dmSyncEnabled = false` on the originating campaign means only that the originating campaign does not receive synced exceptions from others — it does not block it from being the source of propagation.

**Why it happens:** The field name reads ambiguously as bidirectional.

**How to avoid:** The originating campaign's `dmSyncEnabled` is irrelevant to `toggleDmException` propagation. Only filter on `sibling.dmSyncEnabled = true` in the `findMany`. Do not read `campaign.dmSyncEnabled` in `toggleDmException` at all.

**Warning signs:** Campaigns with `dmSyncEnabled = false` failing to propagate their own exceptions to others.

### Pitfall 4: `revalidatePath` scope bug — only revalidating originating campaign

**What goes wrong:** `revalidatePath(`/campaigns/${campaignId}`)` is called once after the primary write, but the sibling `revalidatePath` loop is missing. Sibling pages are stale — they show the old exception state until the DM navigates away and back.

**Why it happens:** The loop is easy to forget; the primary write behaviour is identical to the pre-sync version.

**How to avoid:** Call `revalidatePath(`/campaigns/${sibling.id}`)` inside the sibling loop, once per sibling that was updated (not skipped by window check).

**Warning signs:** Sibling campaign pages showing stale data after a toggle on another campaign.

### Pitfall 5: `db push` skipped — production schema diverges

**What goes wrong:** Developer writes action code referencing `dmSyncEnabled`, tests pass locally (with the updated schema), but production database does not have the column. Runtime error on first toggle: "column dmSyncEnabled does not exist."

**Why it happens:** `db push` was run locally but the production deployment did not apply the schema change.

**How to avoid:** Verify that the production deployment process applies `prisma db push` (or equivalent) before the code referencing `dmSyncEnabled` reaches production. Note for the planner: confirm the deployment checklist includes a `prisma db push` step.

**Warning signs:** `PrismaClientKnownRequestError` with "column does not exist" in production logs.

---

## Code Examples

Verified patterns from direct codebase inspection:

### Complete extended `toggleDmException` (outline)

```typescript
// Source: src/lib/actions/campaign.ts — extended from lines 145–179
export async function toggleDmException(
  campaignId: string,
  date: string,
  isBlocked: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    const dm = await getSessionDM()
    if (!dm) return { error: 'Not authenticated' }

    // Ownership check (unchanged)
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { dmId: true },
    })
    if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

    // Parse date (unchanged)
    const [y, m, d] = date.split('-').map(Number)
    const parsedDate = new Date(Date.UTC(y, m - 1, d))

    // Write to originating campaign (unchanged)
    if (!isBlocked) {
      await prisma.dmAvailabilityException.deleteMany({
        where: { campaignId, date: parsedDate },
      })
    } else {
      await prisma.dmAvailabilityException.upsert({
        where: { campaignId_date: { campaignId, date: parsedDate } },
        update: {},
        create: { campaignId, date: parsedDate },
      })
    }
    revalidatePath(`/campaigns/${campaignId}`)

    // NEW: propagate to sync-enabled sibling campaigns
    const siblings = await prisma.campaign.findMany({
      where: {
        dmId: dm.id,
        id: { not: campaignId },
        dmSyncEnabled: true,
      },
      select: {
        id: true,
        planningWindowStart: true,
        planningWindowEnd: true,
      },
    })

    for (const sibling of siblings) {
      if (!sibling.planningWindowStart || !sibling.planningWindowEnd) continue
      if (parsedDate < sibling.planningWindowStart || parsedDate > sibling.planningWindowEnd) continue

      if (!isBlocked) {
        await prisma.dmAvailabilityException.deleteMany({
          where: { campaignId: sibling.id, date: parsedDate },
        })
      } else {
        await prisma.dmAvailabilityException.upsert({
          where: { campaignId_date: { campaignId: sibling.id, date: parsedDate } },
          update: {},
          create: { campaignId: sibling.id, date: parsedDate },
        })
      }
      revalidatePath(`/campaigns/${sibling.id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('toggleDmException error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}
```

### Schema field addition (exact diff)

```prisma
// prisma/schema.prisma — add after dmExceptionMode line
dmExceptionMode   String?
dmSyncEnabled     Boolean  @default(true)   // ADD THIS LINE
```

### `setDmSyncEnabled` — full action

```typescript
// Source: follows setDmExceptionMode pattern (lines 181–203 in campaign.ts)
export async function setDmSyncEnabled(
  campaignId: string,
  enabled: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    const dm = await getSessionDM()
    if (!dm) return { error: 'Not authenticated' }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { dmId: true },
    })
    if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { dmSyncEnabled: enabled },
    })

    revalidatePath(`/campaigns/${campaignId}`)
    return { success: true }
  } catch (error) {
    console.error('setDmSyncEnabled error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client calls multiple server actions for multi-record writes | Single server action handles all related writes | Next.js App Router stable | Sync propagation stays on server; no client awareness of sibling IDs needed |
| `prisma migrate dev` for all schema changes | `prisma db push` for development + direct schema iteration | Prisma best practice for prototype/direct-push workflows | No migration file accumulation; simpler for apps not requiring migration history |

---

## Open Questions

1. **`revalidatePath('/campaigns', 'layout')` vs per-ID loop**
   - What we know: `revalidatePath` with `'layout'` type is documented to invalidate a layout and all pages nested under it. The `/campaigns/[id]` pages are nested under the `/campaigns` layout.
   - What's unclear: Whether Next.js 15/16's implementation actually invalidates dynamic segment children (`/campaigns/[id]`) when the parent layout path (`/campaigns`) is passed. Not live-tested in this codebase.
   - Recommendation: Use explicit per-sibling `revalidatePath(`/campaigns/${sibling.id}`)` calls. This is proven to work (it matches the current `toggleDmException` call for the originating campaign). Cost is O(N campaigns) cache invalidations — negligible for this app's scale.

2. **Production deployment: `prisma db push` on Neon**
   - What we know: The production database is Neon PostgreSQL. The project's existing deployment flow must apply schema changes; the Wave 1 task should verify this.
   - What's unclear: Whether `prisma db push` is run as part of a build step (e.g., in `package.json` build script or a Vercel/deploy hook) or manually.
   - Recommendation: Check `package.json` "build" script and any CI/CD config before completing Wave 1. If not automated, the deploy instructions must include a manual `prisma db push` step.

---

## Build Order for Planner

This phase has two waves driven by a hard dependency:

| Wave | Task | Why Here |
|------|------|----------|
| Wave 1 | Add `dmSyncEnabled Boolean @default(true)` to `schema.prisma` | Must precede all action code — Prisma client must be regenerated before TypeScript can see the field |
| Wave 1 | Run `prisma db push` to apply migration and regenerate client | Prerequisite for Wave 2 |
| Wave 2 | Extend `toggleDmException` with sibling propagation block | SYNC-01 + SYNC-02; only write after client is regenerated |
| Wave 2 | Add `setDmSyncEnabled` action to `campaign.ts` | SYNC-04; write alongside the `toggleDmException` extension in one file edit |

Wave 2 can write both action changes in a single `campaign.ts` edit.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection: `prisma/schema.prisma` — confirmed `Campaign` model fields, `DmAvailabilityException` composite unique, no existing `dmSyncEnabled` field
- Direct inspection: `src/lib/actions/campaign.ts` — full `toggleDmException` implementation (lines 145–179), `setDmExceptionMode` pattern (lines 181–203), auth and ownership patterns
- Direct inspection: `src/components/DmExceptionCalendar.tsx` — confirmed optimistic update + rollback pattern for Phase 27 `DmSyncToggle` reference
- Direct inspection: `src/app/campaigns/[id]/page.tsx` — confirmed `CampaignTabs` prop interface; `dmSyncEnabled` not yet passed as prop (Phase 27 concern, not Phase 25)
- Direct inspection: `.planning/research/ARCHITECTURE.md` — build order, sync semantics decisions, anti-patterns, revalidation scope analysis
- Direct inspection: `.planning/REQUIREMENTS.md` — SYNC-01, SYNC-02, SYNC-04 confirmed; SYNC-03 is Phase 27 (out of scope here)

### Secondary (MEDIUM confidence)

- Next.js App Router `revalidatePath` documentation — per-ID loop confirmed safe; `'layout'` type segment cascade behaviour not live-tested in this app
- Prisma 7 `db push` vs `migrate dev` workflow — documented distinction between `push` (direct apply, no migration files) and `migrate dev` (migration file generation)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all patterns already in use in this codebase
- Architecture: HIGH — based on direct inspection of all files involved; no speculation required
- Pitfalls: HIGH (structural/ordering pitfalls) / MEDIUM (production deployment and `revalidatePath` cascade behaviour not live-tested)

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable domain — Prisma and Next.js server action patterns are not changing rapidly)
