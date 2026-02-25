# Phase 4: Dashboard - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

The DM's read-only view of aggregated player availability across the planning window. Shows who's free on each day, highlights days where all players are available, surfaces players who haven't responded, and ranks the best candidate session days. No session booking, no DM editing of player data — observation and decision-support only.

</domain>

<decisions>
## Implementation Decisions

### Calendar grid — cell display
- Coloured dots inside each day cell, one dot per player
- Green dot = player is free that day, red = busy, grey = no response yet
- Days where ALL players are free get a green background on the cell (the primary "highlight" signal)

### Calendar grid — detail interaction
- Hover over a day → tooltip showing each player's name and their status + time-of-day preference
- Click a day → side panel opens with full per-player breakdown for that day
- Both interactions coexist (hover for quick scan, click for detail)

### Calendar grid — time span
- Show the full planning window in a single scrollable grid — no month-by-month pagination
- Planning windows are expected to be short (2–6 weeks), so one view is sufficient

### Best-days ranking — scoring
- Score = count of available players for that day (simple count, no weighting)
- No time-of-day alignment bonuses — keep scoring transparent and predictable

### Best-days ranking — display
- Separate section below the calendar grid (not a sidebar, not integrated into cells)
- Show top 5 days only
- Each entry: rank number, date, player count (e.g. 4/4), and names of free players
  - Example: "#1 — Sat 8 Mar — 4/4 players free (Alice, Bob, Sam, Kate)"

### Claude's Discretion
- Page layout for the two unselected areas (missing players section placement, overall page structure)
- Exact side panel design and animation
- Typography, spacing, and colour tokens (should match existing app theme)
- How ties in the ranking are handled (e.g. same count → sort by date)
- Empty states (no availability submitted yet, no days in window, etc.)

</decisions>

<specifics>
## Specific Ideas

- The dot + green-cell pattern: green cell = "safe to schedule", dots give the DM confidence about who is free
- Tooltip + side panel dual interaction: tooltip for quick hover-scan across the grid, panel for when the DM wants to deliberate on a specific day

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-dashboard*
*Context gathered: 2026-02-25*
