# Phase 27: Flat Settings and Sync Toggle - Research

**Researched:** 2026-03-18
**Domain:** React/Next.js component refactor — Settings tab accordion removal, DmSyncToggle client component, prop wiring
**Confidence:** HIGH — based entirely on direct codebase inspection; no external libraries introduced

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SET-01 | Settings tab displays all options in a flat, visually grouped layout without stacked accordions | Accordion elements (`<details>/<summary>`) identified in CampaignTabs.tsx lines 333-350 (Players) and 353-373 (My Unavailable Dates); direct removal and replacement with `<section>` + `<h2>` is safe — all child components unchanged |
| SYNC-03 | Each campaign has a "Sync DM availability" toggle in Settings (on by default); turning it off makes that campaign's exceptions independent | `setDmSyncEnabled` action fully implemented in campaign.ts; `dmSyncEnabled Boolean @default(true)` in schema; `DmSyncToggle` component does not yet exist — needs creating; `dmSyncEnabled` prop not yet passed from page.tsx to CampaignTabs |
</phase_requirements>

---

## Summary

Phase 27 is a contained two-task implementation on top of infrastructure already completed in Phases 25 and 26. The server action (`setDmSyncEnabled`), the schema field (`dmSyncEnabled`), and the prop-driven architecture are all in place. What is missing is: (1) removing accordion wrappers from the Settings tab, (2) creating a `DmSyncToggle` client component, and (3) wiring `dmSyncEnabled` from the server component down to `CampaignTabs` and then to the toggle.

The key judgment call is how to handle `DmExceptionCalendar` height after accordion removal. The calendar renders one grid per month in the planning window and can be extremely tall. Two choices exist: expose it fully flat (simplest, but potentially very long), or keep the calendar itself behind a lightweight `showCalendar` toggle while making the mode radios and sync toggle always visible. The recommended approach is the lightweight toggle — it preserves the "flat, scannable" goal for the controls while managing height.

The `DmSyncToggle` component follows an established optimistic-update + rollback pattern that already exists in `DmExceptionCalendar.tsx` and the mode-toggle logic within it. The pattern is well understood and can be implemented with minimal code.

**Primary recommendation:** Remove `<details>/<summary>` accordion wrappers entirely (replace with `<section>` + `<h2>`); add a `showCalendar` useState to gate the calendar grid display; create `DmSyncToggle` following the `handleModeChange` pattern from `DmExceptionCalendar`; wire `dmSyncEnabled` through `page.tsx` → `CampaignTabs` → `DmSyncToggle`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 (in use) | `useState` for `showCalendar` toggle and optimistic sync state | Already in use; no additions needed |
| Next.js | 16 (in use) | `"use client"` boundary for `DmSyncToggle`; `revalidatePath` in `setDmSyncEnabled` | Already in use |
| Tailwind CSS | 4 (in use) | Toggle styling matching existing theme | Already in use |
| Prisma | 7 (in use) | `dmSyncEnabled` field already on schema | Already in use |

### No new dependencies
This phase adds zero new packages. All UI patterns are implementable with React `useState`, Tailwind classes, and the existing `Toast` / `SaveStatus` component.

**Installation:**
```bash
# No installation needed
```

---

## Architecture Patterns

### What already exists (do not re-implement)

| Element | Location | Status |
|---------|----------|--------|
| `dmSyncEnabled Boolean @default(true)` | `prisma/schema.prisma` line 25 | Done |
| `setDmSyncEnabled` server action | `src/lib/actions/campaign.ts` lines 238-263 | Done |
| `toggleDmException` sibling propagation | `src/lib/actions/campaign.ts` lines 176-205 | Done |
| Optimistic-update + rollback pattern | `DmExceptionCalendar.tsx` `handleModeChange` | Reference model |
| `Toast` / `SaveStatus` component | `src/components/Toast.tsx` | Done — reuse |

### What this phase creates / modifies

| Element | Type | Location |
|---------|------|----------|
| `DmSyncToggle` | New `"use client"` component | `src/components/DmSyncToggle.tsx` |
| `CampaignTabs` — Settings tab | Modified (remove accordions, add DmSyncToggle) | `src/components/CampaignTabs.tsx` |
| `page.tsx` — `CampaignTabs` call | Modified (add `dmSyncEnabled` prop) | `src/app/campaigns/[id]/page.tsx` |

### Pattern 1: DmSyncToggle — optimistic boolean toggle

Mirrors `handleModeChange` in `DmExceptionCalendar.tsx` exactly, but for a boolean toggle rather than a radio group.

```typescript
// Source: DmExceptionCalendar.tsx — handleModeChange (line 70-91), adapted for boolean
'use client'

import { useState } from 'react'
import { setDmSyncEnabled } from '@/lib/actions/campaign'
import { Toast, SaveStatus } from '@/components/Toast'

interface DmSyncToggleProps {
  campaignId: string
  initialEnabled: boolean
}

export function DmSyncToggle({ campaignId, initialEnabled }: DmSyncToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [status, setStatus] = useState<SaveStatus>('idle')

  function handleToggle() {
    const prev = enabled
    const next = !enabled
    setEnabled(next)         // optimistic update
    setStatus('saving')

    setDmSyncEnabled(campaignId, next)
      .then(result => {
        if ('error' in result) {
          setEnabled(prev)   // rollback
          setStatus('error')
        } else {
          setStatus('saved')
          setTimeout(() => setStatus('idle'), 2000)
        }
      })
      .catch(() => {
        setEnabled(prev)     // rollback
        setStatus('error')
      })
  }

  return (
    <div>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
            ${enabled ? 'bg-[var(--dnd-accent)]' : 'bg-gray-700'}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform
              ${enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`}
          />
        </button>
        <span className="text-sm text-gray-300">
          {enabled
            ? 'Sync enabled — unavailable dates apply across all your campaigns'
            : 'Sync off — unavailable dates are independent for this campaign'}
        </span>
      </label>
      <p className="text-xs text-gray-500 mt-1 ml-12">
        Re-enabling sync applies to future changes only — existing dates are not changed.
      </p>
      <Toast status={status} onRetry={() => setStatus('idle')} onDismiss={() => setStatus('idle')} />
    </div>
  )
}
```

### Pattern 2: Accordion removal — exact before/after

**Before (Players section, CampaignTabs.tsx lines 332-350):**
```tsx
<section>
  <details className="group">
    <summary className="flex items-center gap-2 cursor-pointer [&::-webkit-details-marker]:hidden list-none select-none">
      <h2 className="text-lg font-semibold text-white">Players</h2>
      <span className="text-white group-open:rotate-180 transition-transform">
        <ChevronDownIcon />
      </span>
    </summary>
    <div className="mt-4">
      <UpdateMaxPlayersForm ... />
    </div>
  </details>
</section>
```

**After:**
```tsx
<section>
  <h2 className="text-lg font-semibold text-white mb-4">Players</h2>
  <UpdateMaxPlayersForm ... />
</section>
```

Remove `<details>`, `<summary>`, and `ChevronDownIcon` entirely. Replace with direct heading + content. The `ChevronDownIcon` component defined in `CampaignTabs.tsx` becomes unused and can be deleted.

### Pattern 3: DmExceptionCalendar height management — showCalendar toggle

The `DmExceptionCalendar` renders one calendar grid per month in the planning window. For a 3-month window, this is roughly 3 × 200px = 600px of calendar. Without an accordion, this appears inline in Settings.

**Approach: keep mode radios + sync toggle always visible; gate only the calendar grid.**

```tsx
// Inside CampaignTabs — Settings tab, DM Unavailable Dates section
// (After removing accordion, add local showCalendar state)
const [showCalendar, setShowCalendar] = useState(false)

// In the JSX:
{windowStartStr && windowEndStr && (
  <section>
    <h2 className="text-lg font-semibold text-white mb-4">My Unavailable Dates</h2>
    <DmExceptionCalendar
      campaignId={campaignId}
      planningWindowStart={windowStartStr}
      planningWindowEnd={windowEndStr}
      initialExceptions={dmExceptionDates}
      exceptionMode={dmExceptionMode}
    />
    {/* The calendar grid within DmExceptionCalendar is always visible here. */}
    {/* If height is a concern, a showCalendar toggle can gate the calendar portion. */}
    {/* The mode radios live inside DmExceptionCalendar and are always visible. */}
  </section>
)}
```

**Note on the showCalendar toggle approach:** The mode radios and sync toggle are always visible (flat requirement met). A "Show / Hide calendar" button can be added below them to gate the full grid. This is simpler than modifying `DmExceptionCalendar` internals.

If `DmExceptionCalendar` is rendered in full without a gate, the Settings tab is long but functional. The DmSyncToggle sits in this section and is always visible. The planner must decide: expose calendar fully flat, or add a showCalendar gate. **Both are valid.** The showCalendar gate is safer for long windows.

### Pattern 4: Prop wiring — dmSyncEnabled

**page.tsx change (add one prop to `<CampaignTabs>`)**:
```tsx
// Source: src/app/campaigns/[id]/page.tsx — CampaignTabs call (line 84-96)
// Add dmSyncEnabled:
<CampaignTabs
  campaignId={campaign.id}
  joinUrl={joinUrl}
  // ... existing props unchanged ...
  dmSyncEnabled={campaign.dmSyncEnabled}   // NEW — already on Campaign model
/>
```

`campaign.dmSyncEnabled` is a scalar field on the `Campaign` model, already fetched by `prisma.campaign.findUnique` without needing changes to the `include` block.

**CampaignTabs interface change:**
```typescript
interface CampaignTabsProps {
  // ... existing props ...
  dmSyncEnabled: boolean   // NEW
}
```

### Pattern 5: DmSyncToggle placement in Settings tab

The sync toggle belongs in the "My Unavailable Dates" section, immediately above or below the mode radios (which live inside `DmExceptionCalendar`). Given that the sync controls and the mode radios are conceptually related (both govern how DM unavailability behaves), they should appear together.

**Recommended layout for the flat DM Unavailable Dates section:**
```
My Unavailable Dates  [h2 heading]
[DmSyncToggle — always visible]
[DmExceptionCalendar — contains mode radios + calendar grid]
```

Alternatively, `DmSyncToggle` can be its own top-level Settings section ("Availability Sync") if the planner prefers more visual separation. Both work.

### Anti-Patterns to Avoid

- **Leaving `<details open>` instead of removing it:** Forces the accordion open visually but leaves hidden keyboard-focusable `<summary>` elements that confuse screen readers. Remove `<details>/<summary>` entirely.
- **Putting `showCalendar` state inside `DmExceptionCalendar`:** The component does not need to know about the Settings layout. Gate the calendar from `CampaignTabs` if a gate is wanted, not from inside the child component.
- **Re-deriving `dmSyncEnabled` client-side:** It comes from the server component as a prop. Do not re-fetch it in `DmSyncToggle`.
- **Implementing a backfill in `setDmSyncEnabled`:** The current implementation correctly does not backfill on re-enable (forward-only, per SYNC-04). The toggle label must communicate this. Do not add backfill logic.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle switch UI | Custom CSS animation | Tailwind `transition-transform` + `translate-x` on a `<span>` | Already the project pattern — simple, no dependency |
| Save feedback | Custom toast | `Toast` / `SaveStatus` from `src/components/Toast.tsx` | Already extracted; reusing avoids drift |
| Optimistic state | `useOptimistic` hook (React 19) | Plain `useState` + rollback (existing pattern) | The project does not use `useOptimistic`; consistent with `DmExceptionCalendar` and `handleModeChange` |

**Key insight:** Every piece of infrastructure for this phase is already built. The work is wiring and UI only.

---

## Common Pitfalls

### Pitfall 1: `<details>` accordion left in DOM with `open` attribute forced

**What goes wrong:** Developer adds `open` attribute to force the accordion open instead of removing the element. The `<summary>` remains a keyboard-focusable toggle that screen readers announce as a disclosure button. Tab order includes the summary as a clickable element that does nothing useful.

**How to avoid:** Delete `<details>` and `<summary>` elements entirely. Replace with `<section>` + `<h2>`. The `ChevronDownIcon` component in `CampaignTabs.tsx` becomes unused — delete it too.

**Warning signs:** The component still imports or references `ChevronDownIcon` after the change.

### Pitfall 2: DmSyncToggle `setStatus('saving')` showing during initial render

**What goes wrong:** Status is initialised as `'saving'` instead of `'idle'`, causing the Toast to flash "Saved" on first render.

**How to avoid:** Initialise `const [status, setStatus] = useState<SaveStatus>('idle')`. Only set to `'saving'` inside `handleToggle`.

### Pitfall 3: `dmSyncEnabled` prop missing from `CampaignTabs` TypeScript interface

**What goes wrong:** `page.tsx` passes `dmSyncEnabled` but the interface definition does not include it. TypeScript compiles but the prop is silently ignored (or TypeScript throws).

**How to avoid:** Add `dmSyncEnabled: boolean` to `CampaignTabsProps` interface before wiring the prop in the JSX. TypeScript will flag any mismatch immediately.

### Pitfall 4: DmSyncToggle placed outside the conditional `windowStartStr && windowEndStr` guard

**What goes wrong:** The sync toggle is rendered even when no planning window is set, displaying controls for DM unavailability on a campaign that has no dates to be unavailable on.

**How to avoid:** Render `DmSyncToggle` inside the `{windowStartStr && windowEndStr && ...}` guard that wraps `DmExceptionCalendar`, or add its own guard. The toggle is only meaningful when a planning window exists.

**Counter-consideration:** SYNC-03 says "each campaign has a sync toggle." A campaign without a planning window still technically has a sync state. If the DM may want to pre-set the toggle before setting a window, render it unconditionally. The planner should decide.

### Pitfall 5: `setDmSyncEnabled` action not imported in DmSyncToggle

**What goes wrong:** The action is defined in `src/lib/actions/campaign.ts` (line 238). It must be explicitly imported in `DmSyncToggle.tsx` with `'use server'` already on the action file. Forgetting the import causes a runtime "not a function" error.

**How to avoid:** Import pattern (same as `DmExceptionCalendar`):
```typescript
import { setDmSyncEnabled } from '@/lib/actions/campaign'
```

### Pitfall 6: Join Link section still present in Settings

**What goes wrong:** Phase 26 removed the Join Link section from Settings (SET-02, completed). If CampaignTabs is edited carelessly during Phase 27, the Join Link section (lines 311-319 in the current file) could be re-introduced.

**How to avoid:** Verify current CampaignTabs.tsx does not contain the Join Link section before starting Phase 27 edits. (As of Phase 26 completion, it should already be removed.)

**Current state check:** The CampaignTabs.tsx read at research time (2026-03-18) **still contains the Join Link section** at lines 311-319. Phase 26 was marked complete but this file may not reflect the final Phase 26 state, OR the Join Link removal still needs to happen in Phase 27 as a carry-over. The planner must verify the current file before writing the Phase 27 plan.

---

## Code Examples

### Current Settings tab structure (as of research)

```typescript
// src/components/CampaignTabs.tsx — Settings tab (lines 307-383)
// Current: Join Link + Planning Window + Players (accordion) + DM Dates (accordion) + Danger Zone
// Phase 27 target: Planning Window + Players (flat) + DM Unavailable Dates (flat, with DmSyncToggle) + Danger Zone
// Note: Join Link section existence needs verification — should have been removed in Phase 26
```

### setDmSyncEnabled server action — already complete

```typescript
// Source: src/lib/actions/campaign.ts lines 238-263
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

### Toast usage pattern (from DmExceptionCalendar — reuse exactly)

```typescript
// Import
import { Toast, SaveStatus } from '@/components/Toast'

// State
const [status, setStatus] = useState<SaveStatus>('idle')

// In JSX
<Toast
  status={status}
  onRetry={() => setStatus('idle')}
  onDismiss={() => setStatus('idle')}
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Players in `<details>` accordion | Flat `<section>` with `<h2>` | Phase 27 (this phase) | Always visible, no click required |
| My Unavailable Dates in `<details>` accordion | Flat `<section>` with optional showCalendar gate | Phase 27 (this phase) | Mode radios and sync toggle always visible |
| No sync toggle in Settings | `DmSyncToggle` component in Settings | Phase 27 (this phase) | DM can opt-out per campaign |
| `dmSyncEnabled` not passed to `CampaignTabs` | Passed from `page.tsx` as prop | Phase 27 (this phase) | Enables `DmSyncToggle` initialisation |

**Deprecated/outdated after this phase:**
- `ChevronDownIcon` component in `CampaignTabs.tsx` — unused after accordion removal, delete it
- `<details className="group">` / `<summary>` wrapper pattern in Settings — replaced with flat sections

---

## Open Questions

1. **Is the Join Link section already removed from CampaignTabs.tsx?**
   - What we know: Phase 26 (SET-02) marked complete; REQUIREMENTS.md shows SET-02 complete. However, the CampaignTabs.tsx file read at research time (lines 311-319) still contains the Join Link section.
   - What's unclear: Whether the file on disk reflects Phase 26's final state or the research snapshot is pre-Phase-26.
   - Recommendation: The planner should read the current file before writing the plan. If Join Link is still present, removing it should be part of Phase 27 task 1 as a carry-over.

2. **Should DmSyncToggle be inside or outside the `windowStartStr && windowEndStr` guard?**
   - What we know: SYNC-03 says "each campaign has a sync toggle" with no conditional. The toggle affects future exception propagation regardless of window.
   - What's unclear: Whether showing the toggle on a campaign with no planning window is confusing or expected.
   - Recommendation: Render it unconditionally in Settings (it is a campaign-level setting). Add a subdued note if no window is set: "Set a planning window to use this feature."

3. **Should the DmExceptionCalendar be fully flat or gated with showCalendar?**
   - What we know: The calendar can be 400-600px tall for a 2-3 month window. This is inside the Settings tab, which the DM must scroll anyway.
   - What's unclear: Whether the DM experience team considers long Settings tabs acceptable.
   - Recommendation: Start fully flat (simpler). Add showCalendar gate only if review feedback says it's too tall.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection: `src/components/CampaignTabs.tsx` — current Settings tab structure, accordion locations, prop interface, existing state
- Direct inspection: `src/lib/actions/campaign.ts` — `setDmSyncEnabled` action (lines 238-263), confirmed complete
- Direct inspection: `prisma/schema.prisma` — `dmSyncEnabled Boolean @default(true)` confirmed on Campaign model (line 25)
- Direct inspection: `src/app/campaigns/[id]/page.tsx` — `dmSyncEnabled` not yet passed to `CampaignTabs` (confirmed gap)
- Direct inspection: `src/components/DmExceptionCalendar.tsx` — optimistic update + rollback pattern (`handleModeChange`, lines 70-91)
- Direct inspection: `src/components/Toast.tsx` — `Toast` / `SaveStatus` API
- Direct inspection: `.planning/REQUIREMENTS.md` — SET-01 and SYNC-03 requirements
- Direct inspection: `.planning/research/ARCHITECTURE.md` — recommended `DmSyncToggle` component design
- Direct inspection: `.planning/research/PITFALLS.md` — Pitfalls 9 (accordion removal), 10 (schema migration — already done), 3 (no-backfill decision)

### Secondary (MEDIUM confidence)

- `.planning/ROADMAP.md` Phase 27 success criteria — used to confirm scope boundaries
- `.planning/STATE.md` accumulated decisions — confirmed forward-only sync decision (no backfill)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing libraries, no new dependencies
- Architecture: HIGH — `setDmSyncEnabled` done, `dmSyncEnabled` in schema; gap is one new component + prop wiring
- Pitfalls: HIGH — grounded in direct file inspection; pitfalls are implementation-level, not architectural surprises

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable codebase; no external libraries; validity is long)
