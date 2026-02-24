# Phase 3: Availability - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Players access their invite link and submit when they're generally free. This covers:
1. Weekly recurring availability — which days + which time(s) of day per day
2. Date-specific exceptions — overriding the weekly pattern for specific dates in the planning window

Creating campaigns, managing player slots, and displaying group availability to the DM are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Day/time selection UI
- Row of toggle buttons for days of the week (Mon Tue Wed Thu Fri Sat Sun)
- Unselected days are muted/greyed out; selected days highlight with D&D theme accent
- When a day is toggled on, inline time options expand beneath it (morning / afternoon / evening)
- Players can select multiple time preferences per day (e.g., afternoon AND evening)
- The availability form is the primary focus of the page — campaign name + player name appear at top as context, then straight into the form
- Weekly schedule section and date exceptions section are on the same page, stacked (weekly pattern on top, calendar below)
- Visual tone: D&D-themed — dark background, warm accent colors (gold/amber), atmospheric — consistent with Phase 2 landing page

### Date exception UX
- Calendar widget scoped to the campaign's planning window
- Calendar pre-fills with the player's weekly pattern (days tinted to reflect availability); date-specific overrides display with a distinct visual marker
- Clicking a date inline toggles it between busy / free override states — no popup or modal
- Both override directions supported: mark a normally-free day as busy, or a normally-busy day as free
- Clicking an already-overridden date again reverts it to the weekly-pattern state (removes the exception)

### Save & submission flow
- Auto-save on every interaction — no submit button
- Subtle "Availability saved" status text appears near the form after each change, then fades
- On save failure: show error message with a retry option ("Couldn't save — try again")
- No explicit completion state — the page is always live and editable; players can return and update any time

### Claude's Discretion
- Exact spacing, typography, and icon choices
- Loading/skeleton state while fetching existing availability
- Exact animation timing for the "Saved" indicator fade
- How to handle the planning window calendar if it spans many months (scrollable vs paginated)

</decisions>

<specifics>
## Specific Ideas

- No specific references mentioned — open to standard approaches within the D&D dark theme established in Phase 2

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-availability*
*Context gathered: 2026-02-24*
