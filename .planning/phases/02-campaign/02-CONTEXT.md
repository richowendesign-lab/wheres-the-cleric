# Phase 2: Campaign - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

The DM creates a campaign, adds named player slots, sets a planning window, and gets a unique invite link per player. Players can open their invite link in a browser with no login and see their slot. Availability input is Phase 3 — this phase only establishes the campaign structure and the player landing page shell.

</domain>

<decisions>
## Implementation Decisions

### Player landing page
- Page leads directly with the availability form area — no welcome intro, jump straight to the task
- In Phase 2 (before availability exists): show campaign details only — campaign name, player name, planning window dates, and fellow player names. No action required yet.
- Show all player names on the page ("Playing with: Aragorn, Gandalf, Legolas, Gimli") — adds social context
- Show the DM's name ("Richard is organising this campaign")
- Show the planning window date range ("We're planning sessions for March 2026")
- Browser tab / page title: "D&D Session Planner" (app name, not campaign name)
- Invalid/expired invite link: friendly error page — "This link doesn't look right — ask your DM to resend it"
- Fully responsive — mobile-first layout (players will open links on their phones)
- The invite link IS the player's identity — whoever holds the link is that player, no extra auth state needed

### Visual style
- D&D themed but subtle: dark colour palette, fantasy font for headings only
- Clean and usable — not heavy parchment/textures, just the vibe
- Think: dark mode with thematic heading typography

### Phase 3 readiness (build the shell now)
- When Phase 3 lands, the landing page needs a big prominent CTA: "Set your availability"
- Design the player page layout to accommodate this button — placeholder or disabled state in Phase 2

### Planning window UX
- Two date pickers: start date + end date — standard calendar inputs
- Required upfront — DM must set the window during campaign creation (not optional)
- Editable any time after creation — DM can shift or extend the window freely
- No minimum or maximum window length — any date range is valid

### Claude's Discretion
- DM campaign creation form layout (single page or multi-step — keep it simple)
- How the DM views and copies invite links after campaign creation (table with copy buttons is fine)
- Exact colour palette and font choices for the D&D theme
- Date picker component choice

</decisions>

<specifics>
## Specific Ideas

- Player page: dark background, fantasy-style heading font (e.g. MedievalSharp, Cinzel, or similar), but body text clean and readable
- Fellow players list adds social context — players should know who else is in the group
- The invite link is the auth mechanism — no sessions, no cookies needed beyond the URL itself

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-campaign*
*Context gathered: 2026-02-24*
