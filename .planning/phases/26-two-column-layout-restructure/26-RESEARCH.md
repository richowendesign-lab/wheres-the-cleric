# Phase 26: Two-Column Layout Restructure - Research

**Researched:** 2026-03-17
**Domain:** React/Tailwind CSS layout restructure — CampaignTabs two-column availability view + Settings join-link removal
**Confidence:** HIGH — grounded entirely in direct codebase inspection; no external library changes required

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Date detail panel slides in from the right side **as it currently does** — no change to the panel's animation/positioning behaviour
- The calendar remains fully visible (no full-screen overlay)
- On mobile/small screens: single column, stacked layout — **Best Days list first**, then calendar below (matching current behaviour)
- Two-column layout activates at the same breakpoint currently used (lg)
- Best Days list left **as-is** — no changes to content, ranking, or labels
- `CopyLinkButton` sits **below** the Best Days list in the sidebar
- Join link should be **removed from the Settings tab**

### Claude's Discretion

- Exact sidebar width (suggest 320px fixed or max-w-xs)
- Breakpoint for two-column activation (suggest lg: / 1024px)
- Sidebar scroll behaviour if content overflows
- Transition/animation for sidebar content swap when date is selected/deselected

### Deferred Ideas (OUT OF SCOPE)

- Best Days list content changes (counts, labels, filtering) — future phase
- Settings tab full redesign — Phase 27

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAYOUT-01 | DM sees a two-column Availability tab — large calendar on the left, persistent sidebar on the right | CSS Grid pattern documented below; CampaignTabs is the sole file to modify |
| LAYOUT-02 | Sidebar shows the Best Days list and a copyable join link | BestDaysList and CopyLinkButton are unchanged; sidebar renders them in sequence |
| LAYOUT-03 | Clicking a date overlays the sidebar with a player breakdown for that date; closing returns to Best Days + join link | selectedDate state already exists in CampaignTabs; sidebar switches content conditionally on it |
| SET-02 | Join Link section removed from Settings (accessible from Availability sidebar instead) | Settings join-link section is lines 308-315 in CampaignTabs.tsx — direct deletion |

</phase_requirements>

---

## Summary

Phase 26 is a focused layout restructure confined to a single component file: `src/components/CampaignTabs.tsx`. No new components are required. No props to the server page change. No data flow changes. The work is:

1. Restructure the Availability tab from single-column `space-y-8` to a CSS Grid two-column layout with the calendar on the left and a persistent sidebar on the right.
2. Move `BestDaysList` and `CopyLinkButton` into the sidebar column. Move them out of their current positions in the availability tab.
3. Repurpose the existing `selectedDate`-driven side panel: instead of a `fixed inset-y-0 right-0` full-viewport drawer, the date detail content renders inline within the sidebar column, replacing the Best Days list when a date is selected.
4. Remove the Join Link section from the Settings tab (lines 308-315).
5. Remove the now-redundant full-viewport `fixed` backdrop div and `fixed` panel div — they are replaced by the in-column sidebar approach.

The existing `selectedDate` state, `setSelectedDate` callbacks, `aggMap` lookup, `playerSlots` data, and Escape-key handler all carry forward unchanged. No child components (`BestDaysList`, `DashboardCalendar`, `CopyLinkButton`) require modification.

**Primary recommendation:** Replace the `fixed` overlay panel with an in-flow sidebar column that toggles between Best Days content and date-detail content based on `selectedDate`. This resolves the critical backdrop-intercept pitfall and is the architectural pattern the prior ARCHITECTURE.md research recommends.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.x (already installed) | Two-column grid, responsive stacking, sidebar width | Already the project's CSS framework; no installation needed |
| React 19 | already installed | Conditional rendering for sidebar content swap | Already the project's UI framework |

No new dependencies. This phase is pure JSX + Tailwind restructure.

**Installation:** none required.

---

## Architecture Patterns

### Recommended Project Structure

No file creation needed. The change is entirely within:

```
src/components/CampaignTabs.tsx   ← sole modified file
```

### Pattern 1: CSS Grid Two-Column with Mobile Stack

**What:** A single CSS Grid container whose columns collapse to one on mobile and expand to two on `lg:`.

**When to use:** When a layout has a main content area and a persistent sidebar that must both be visible at desktop widths.

**Tailwind implementation:**

```tsx
// Source: Tailwind CSS docs + PITFALLS.md Pitfall 7 (verified against codebase)
// Calendar first in DOM order — this ensures mobile reading order is
// calendar above sidebar without any CSS `order` tricks.
<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
  {/* Left: Calendar column */}
  <div className="min-w-0">
    {/* ... Awaiting Response, calendar heading, DashboardCalendar ... */}
  </div>

  {/* Right: Sidebar column */}
  <div className="lg:sticky lg:top-20">
    {selectedDate ? <DateDetailPanel /> : <BestDaysSidebar />}
  </div>
</div>
```

Notes on the pattern:
- `grid-cols-[1fr_320px]` — calendar gets all remaining space; sidebar is fixed 320px. Can also use `max-w-xs` (320px) with `w-full` on the sidebar column.
- `items-start` — prevents the sidebar from stretching to match calendar height.
- `lg:sticky lg:top-20` — sidebar stays in view when the calendar is taller than the viewport. `top-20` (80px) clears the AppNav bar. Adjust if nav height changes.
- `min-w-0` on calendar column — prevents flex/grid children from overflowing when the calendar has wide content.

### Pattern 2: Sidebar Content Swap (Best Days vs Date Detail)

**What:** The sidebar renders one of two views based on whether `selectedDate` is set.

**When to use:** When a sidebar must show contextual detail for a selected item, reverting to a default list when deselected.

**Implementation:**

```tsx
// Source: direct reading of CampaignTabs.tsx + ARCHITECTURE.md
// No new state needed — selectedDate already exists

{/* Sidebar column */}
<aside className="lg:sticky lg:top-20 space-y-4">
  {selectedDate ? (
    // Date detail view — replaces Best Days
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-100">{formatPanelDate(selectedDate)}</h3>
        <button onClick={() => setSelectedDate(null)} aria-label="Close panel">✕</button>
      </div>
      {/* ... player status rows (same content as current fixed panel) ... */}
    </div>
  ) : (
    // Persistent default view
    <>
      {windowStartStr && windowEndStr && (
        <BestDaysList
          days={dayAggregations}
          playerSlots={playerSlots}
          dmExceptionMode={dmExceptionMode}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}
      {/* Join link below Best Days */}
      <div className="border border-[#ba7df6]/30 rounded-lg px-4 py-3 bg-[var(--dnd-input-bg)]">
        <span className="block text-xs text-[var(--dnd-text-muted)] mb-2">Join link</span>
        <div className="flex items-center gap-3">
          <span className="flex-1 text-sm font-mono text-[var(--dnd-accent)] truncate">{joinUrl}</span>
          <CopyLinkButton url={joinUrl} />
        </div>
      </div>
    </>
  )}
</aside>
```

### Pattern 3: Mobile Single Column — Best Days First

**What:** On mobile the grid collapses to one column. DOM order determines stacking: sidebar (Best Days) first, then calendar.

**When to use:** Per locked decision: "Best Days list first, then calendar below" on mobile.

**Implementation — reorder DOM elements:**

```tsx
// DOM order: sidebar FIRST, calendar SECOND
// CSS Grid places sidebar to the right on lg+ without reordering
<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
  {/* On mobile: this renders first (top), on desktop: right column */}
  <aside className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20">
    {/* sidebar content */}
  </aside>

  {/* On mobile: this renders second (below), on desktop: left column */}
  <div className="lg:col-start-1 lg:row-start-1 min-w-0">
    {/* calendar content */}
  </div>
</div>
```

This uses explicit `lg:col-start` and `lg:row-start` to place the calendar in column 1 on desktop while keeping it second in source order (so it appears below sidebar on mobile). This is the accessibility-safe approach documented in PITFALLS.md Pitfall 7.

### Pattern 4: Remove the Fixed Panel + Backdrop

**What:** Delete both the backdrop dismiss div and the fixed panel div currently rendering in CampaignTabs. The date detail content moves into the sidebar column (Pattern 2 above).

**Current code to remove (CampaignTabs.tsx lines 109-168):**

```tsx
// REMOVE THIS — the fixed backdrop:
{selectedDate && (
  <div
    className="fixed inset-0 z-10"
    onClick={() => setSelectedDate(null)}
    aria-hidden="true"
  />
)}

// REMOVE THIS — the fixed panel:
<div className={`fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-800
  shadow-2xl z-20 flex flex-col transition-transform duration-200
  ${selectedDate ? 'translate-x-0' : 'translate-x-full'}`}>
  {/* ... */}
</div>
```

The close-on-Escape `useEffect` (lines 74-79) can remain — it still works for the inline sidebar.

### Pattern 5: Settings Join Link Removal

**What:** Delete the "Join Link" section from the Settings tab.

**Current code to remove (CampaignTabs.tsx lines 307-315):**

```tsx
// REMOVE THIS ENTIRE SECTION:
{/* 1. Join Link */}
<section>
  <h2 className="text-lg font-semibold text-white mb-2">Join Link</h2>
  <p className="text-sm text-[var(--dnd-text-muted)] mb-3">Share this link with your players...</p>
  <div className="flex items-center gap-3 bg-[var(--dnd-input-bg)] border border-[#ba7df6]/30 rounded px-4 py-3">
    <span className="flex-1 text-sm font-mono text-[var(--dnd-accent)] truncate">{joinUrl}</span>
    <CopyLinkButton url={joinUrl} />
  </div>
</section>
```

After removal, the Settings sections renumber: Planning Window becomes section 1, Players section 2, etc. No code changes needed for those sections — they are independent.

The "Awaiting Response" section currently in the availability tab (lines 195-211) moves to the calendar column or stays as a full-width row above the two-column grid — see Anti-Patterns below.

### Anti-Patterns to Avoid

- **Keeping the `fixed` panel alongside the sidebar:** If both exist simultaneously, the fixed panel's `z-10` backdrop intercepts clicks on the sidebar. Remove the fixed panel entirely when adding the sidebar. (PITFALLS.md Pitfall 1)
- **Managing `selectedDate` locally in the sidebar component:** `selectedDate` must stay in `CampaignTabs` and be passed down as props. Both `BestDaysList` and the calendar read it. (PITFALLS.md Pitfall 8)
- **Using CSS `order` to reorder sidebar and calendar:** Use `lg:col-start` / `lg:row-start` instead. CSS `order` changes visual order but not keyboard/screen-reader order, creating an accessibility violation. (PITFALLS.md Pitfall 7)
- **Placing "Awaiting Response" inside the sidebar column:** The "Awaiting Response" section shows missing players; it is not sidebar content. Keep it as a full-width row above the two-column grid, or at the top of the calendar column.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Two-column responsive layout | Custom CSS media queries | Tailwind `grid-cols-1 lg:grid-cols-[1fr_320px]` | Already in the project; arbitrary column values supported in Tailwind v4 |
| Sticky sidebar | `position: fixed` with JS scroll tracking | `lg:sticky lg:top-20` | Native CSS sticky within the grid container; no JS needed |
| Sidebar content transition | JS-driven animation library | CSS `transition-opacity duration-200` on the content swap | The swap is a conditional render — a simple opacity transition is sufficient |

---

## Common Pitfalls

### Pitfall 1: Fixed Panel Backdrop Blocks Sidebar Clicks

**What goes wrong:** The current `fixed inset-0 z-10` backdrop div intercepts all pointer events when `selectedDate` is set. In the two-column layout the sidebar is always visible — the backdrop will block interaction with sidebar content when a date is selected.

**Why it happens:** The backdrop was designed for a single-column layout where the right side of the screen was empty. Now it covers the persistent sidebar.

**How to avoid:** Remove both the backdrop div and the fixed panel div entirely. The date detail content moves into the sidebar column as a conditional render. Click-outside-to-close can be handled by an explicit button (close X) or by clicking a calendar date again.

**Warning signs:** If a user can't click Best Days list items after selecting a calendar date, the backdrop is still present.

### Pitfall 2: DOM Order Mismatch Breaks Mobile Layout

**What goes wrong:** If the calendar is first in DOM order and the sidebar second, mobile users see calendar before Best Days — but the locked decision says Best Days first on mobile.

**How to avoid:** Put the sidebar element first in source order and use `lg:col-start-2 lg:row-start-1` to move it visually to the right column on desktop. The calendar gets `lg:col-start-1 lg:row-start-1`.

**Warning signs:** On a narrow viewport (< 1024px) the calendar appears above the Best Days list.

### Pitfall 3: Sidebar Not Sticky — Scrolls Out of View

**What goes wrong:** When the calendar spans multiple months, it can be 1000px+ tall. Without sticky positioning, the sidebar scrolls off screen and the user must scroll back up to see Best Days.

**How to avoid:** Apply `lg:sticky lg:top-20` to the sidebar column element. Verify `top-20` (80px) clears the AppNav. If AppNav height changes, update this value.

**Warning signs:** On a long campaign planning window, the sidebar disappears when scrolling.

### Pitfall 4: Two `CopyLinkButton` Instances — Consistency Risk

**What goes wrong:** After this phase, `CopyLinkButton` renders in the sidebar (new) and is removed from Settings. If the removal step is missed, two instances exist with no indication which is authoritative.

**How to avoid:** The removal of the Settings section (Pattern 5) and the addition of the sidebar join link (Pattern 2) must happen in the same edit pass. Verify Settings no longer renders `CopyLinkButton` after the change.

**Warning signs:** Two copy buttons visible from the campaign detail page, one in the Availability sidebar and one in the Settings tab.

### Pitfall 5: Sidebar Empty State Missing

**What goes wrong:** When no planning window is set, `BestDaysList` returns its own empty state but the sidebar still has the join link below it. The sidebar does not look broken, but the empty state message from `BestDaysList` ("No availability data yet...") may be visually misaligned in a sidebar context.

**How to avoid:** The `BestDaysList` empty state renders inside a `<section>` with a heading "Best Days" — this is fine in the sidebar. No change needed. The join link renders below regardless of whether a planning window exists (the join link is always valid).

---

## Code Examples

Verified patterns from direct codebase inspection:

### Current State: Fixed Panel + Backdrop (to be removed)

```tsx
// src/components/CampaignTabs.tsx lines 109-168
// Both of these blocks are REMOVED in Phase 26:

{selectedDate && (
  <div className="fixed inset-0 z-10" onClick={() => setSelectedDate(null)} aria-hidden="true" />
)}
<div className={`fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-800
  shadow-2xl z-20 flex flex-col transition-transform duration-200
  ${selectedDate ? 'translate-x-0' : 'translate-x-full'}`}>
  {/* date detail content */}
</div>
```

### New State: Two-Column Grid with Inline Sidebar

```tsx
// Replaces the current availability tab `<div className="space-y-8">` wrapper
// Source: Architecture pattern derived from PITFALLS.md + ARCHITECTURE.md

{activeTab === 'availability' && (
  <>
    {/* Full-width: Awaiting Response (stays above the two-column grid) */}
    {missingPlayers.length > 0 && (
      <section className="mb-6">
        {/* ... unchanged content ... */}
      </section>
    )}

    {/* Two-column grid */}
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

      {/* Sidebar — first in DOM = first on mobile (Best Days above calendar) */}
      <aside className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20 space-y-4">
        {selectedDate ? (
          /* Date detail inline */
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-100">{formatPanelDate(selectedDate)}</h3>
              <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-100 transition-colors" aria-label="Close panel">✕</button>
            </div>
            {/* player status rows — same logic as current fixed panel */}
          </div>
        ) : (
          <>
            {/* Best Days */}
            {windowStartStr && windowEndStr && (
              <BestDaysList
                days={dayAggregations}
                playerSlots={playerSlots}
                dmExceptionMode={dmExceptionMode}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            )}
            {/* Join link */}
            <div className="border border-[#ba7df6]/30 rounded-lg px-4 py-3 bg-[var(--dnd-input-bg)]">
              <p className="text-xs text-[var(--dnd-text-muted)] mb-2">Join link</p>
              <div className="flex items-center gap-3">
                <span className="flex-1 text-sm font-mono text-[var(--dnd-accent)] truncate">{joinUrl}</span>
                <CopyLinkButton url={joinUrl} />
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Calendar column — second in DOM = below sidebar on mobile */}
      <div className="lg:col-start-1 lg:row-start-1 min-w-0">
        {/* heading row with pencil + inline editor + legend + DashboardCalendar */}
        {/* ... unchanged content from current availability tab ... */}
      </div>
    </div>
  </>
)}
```

### Settings Join Link Section to Remove

```tsx
// src/components/CampaignTabs.tsx lines 307-315 (approximately)
// DELETE this entire block:
<section>
  <h2 className="text-lg font-semibold text-white mb-2">Join Link</h2>
  <p className="text-sm text-[var(--dnd-text-muted)] mb-3">Share this link with your players. Anyone who visits it can join the campaign.</p>
  <div className="flex items-center gap-3 bg-[var(--dnd-input-bg)] border border-[#ba7df6]/30 rounded px-4 py-3">
    <span className="flex-1 text-sm font-mono text-[var(--dnd-accent)] truncate">{joinUrl}</span>
    <CopyLinkButton url={joinUrl} />
  </div>
</section>
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `position: fixed` full-viewport slide-in panel | In-flow sidebar column with conditional content | Eliminates backdrop-intercept bug; sidebar is always accessible |
| BestDaysList rendered above calendar (full width) | BestDaysList in sidebar column (right on desktop, top on mobile) | Calendar gets full left-column width; Best Days always visible |
| Join link in Settings tab | Join link in Availability sidebar | DM never needs to leave the main calendar view to copy the link |

---

## Open Questions

1. **Sidebar overflow/scroll when Best Days list is long**
   - What we know: BestDaysList renders up to ~5-10 best days (computeBestDays truncates at 5). With sticky positioning the sidebar fits a viewport without scrolling in typical use.
   - What's unclear: If a campaign has many tied best days or a very long join URL, the sidebar could overflow.
   - Recommendation: Apply `max-h-[calc(100vh-6rem)] overflow-y-auto` to the sidebar element. The `6rem` accounts for the sticky top offset and some padding. Test with a real campaign.

2. **Sidebar width: 320px fixed vs `max-w-xs` (320px)**
   - Both resolve to the same value. `max-w-xs` is more standard Tailwind; the arbitrary `[320px]` in the grid template requires it explicitly anyway.
   - Recommendation: Use `lg:grid-cols-[1fr_320px]` in the grid template (explicit value visible at a glance) and rely on the grid track for width constraint.

3. **Transition for sidebar content swap**
   - At discretion: a simple `transition-opacity duration-150` on both states gives a subtle cross-fade. No explicit animation is required.
   - Recommendation: Wrap each sidebar state in a `key`-keyed div and use a CSS opacity transition. Keep it under 200ms to feel snappy.

---

## Validation Architecture

> `workflow.nyquist_validation` is not present in `.planning/config.json` — section skipped.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection of `src/components/CampaignTabs.tsx` — complete current implementation: state, layout, fixed panel, settings sections
- Direct inspection of `src/components/BestDaysList.tsx` — props interface confirmed: `days`, `playerSlots`, `dmExceptionMode`, `selectedDate`, `onSelectDate`
- Direct inspection of `src/app/campaigns/[id]/page.tsx` — confirmed `CampaignTabs` props; no changes needed to server component
- Direct inspection of `src/app/globals.css` — confirmed design tokens: `--dnd-accent`, `--dnd-input-bg`, `--dnd-border-muted`, `--dnd-text-muted`, background gradient
- `.planning/research/ARCHITECTURE.md` — layout restructure approach, sidebar positioning strategy, join link migration
- `.planning/research/PITFALLS.md` — fixed panel collision (Pitfall 1), CampaignTabs single-component boundary (Pitfall 2), mobile source order (Pitfall 7), selectedDate state ownership (Pitfall 8)
- `.planning/phases/26-two-column-layout-restructure/26-CONTEXT.md` — locked decisions, discretion areas, deferred scope

### Secondary (MEDIUM confidence)

- `.claude/skills/ui-designer/SKILL.md` + `references/design-tokens.md` — responsive breakpoints confirmed at `lg: 1024px`; sidebar width conventions (240-280px nav, 320px panel); `items-start` for non-stretching sidebar columns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; pure Tailwind + React restructure
- Architecture: HIGH — single file change; confirmed by direct code inspection; patterns sourced from prior architecture research on this exact codebase
- Pitfalls: HIGH — all pitfalls sourced from PITFALLS.md which was itself grounded in direct codebase inspection

**Research date:** 2026-03-17
**Valid until:** Stable — no external library versions at risk; valid until CampaignTabs is significantly refactored
