# Phase 26: Two-Column Layout Restructure - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning
**Source:** /gsd:discuss-phase

<domain>
## Phase Boundary

Restructure the Availability tab into a two-column layout: large calendar on the left, persistent sidebar on the right showing Best Days list and join link. Clicking a date slides a date-detail panel in from the right (as currently), keeping the calendar fully visible. Mobile collapses to single column (stacked).

</domain>

<decisions>
## Implementation Decisions

### Date Detail Panel
- Slides in from the right side **as it currently does** — no change to the panel's animation/positioning behaviour
- The calendar remains fully visible (no full-screen overlay)

### Responsive Behaviour
- On mobile/small screens: single column, stacked layout — **Best Days list first**, then calendar below (matching current behaviour)
- Two-column layout activates at the same breakpoint currently used (lg)

### Sidebar Width
- Use **best judgement** — no fixed constraint from user. ~320px is a reasonable starting point per the reference design

### Best Days List
- Leave **as-is** — no changes to content, ranking, or labels

### Join Link Placement
- `CopyLinkButton` sits **below** the Best Days list in the sidebar
- Join link should be **removed from the Settings tab**

### Claude's Discretion
- Exact sidebar width (suggest 320px fixed or max-w-xs)
- Breakpoint for two-column activation (suggest lg: / 1024px)
- Sidebar scroll behaviour if content overflows
- Transition/animation for sidebar content swap when date is selected/deselected

</decisions>

<specifics>
## Specific Ideas

- Reference design (user-provided screenshot) shows calendar taking majority of width (~60–65%) with sidebar at right (~35%)
- User confirmed sidebar layout: Best Days → Join link (top to bottom)
- Date detail panel behaviour unchanged from current implementation

</specifics>

<deferred>
## Deferred Ideas

- Best Days list content changes (counts, labels, filtering) — future phase
- Settings tab full redesign — Phase 27

</deferred>

---

*Phase: 26-two-column-layout-restructure*
*Context gathered: 2026-03-17 via /gsd:discuss-phase*
