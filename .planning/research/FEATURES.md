# Feature Landscape

**Domain:** D&D session scheduling app — UI clarity milestone (v1.4)
**Researched:** 2026-03-12
**Overall confidence:** HIGH for UX patterns (training knowledge of established explainer/onboarding conventions); HIGH for implementation context (direct codebase reading)

---

## Context

This milestone adds four UI clarity features to an existing app. All are additive — no existing behaviour changes, no new DB tables, no new server actions. The research questions are: how should "how it works" onboarding modals be structured; what visual patterns make a calendar legend clear; what makes a no-availability state reassuring vs alarming.

The four active requirements from PROJECT.md:

1. "How it works" modal with numbered step cards covering DM and player perspectives
2. DM unavailable legend entry in the Group Availability calendar legend
3. DM unavailable indicator in the date click side panel
4. Clearer "no players available" state in the date click side panel

---

## Research: Core UX Questions

### Q1 — "How It Works" Onboarding Modals: Structure and Content

**What the best-practice pattern looks like:**

Scheduling and collaboration tools (Calendly, Doodle, Cal.com, Notion, Linear onboarding) converge on a step-card modal with these properties:

**Structure:** A modal overlay containing a numbered sequence of cards. Each card has: a step number (1, 2, 3…), a short heading (3–6 words), and a one-line description (max ~12 words). Optional: a small icon or illustration per step. A Close or "Got it" button dismisses the modal. No multi-page navigation — all steps visible at once in a vertical or grid scroll.

**Content scope:** "How it works" modals explain the tool's workflow, not its features. The distinction matters: "Players submit their availability" (workflow) vs "See an availability calendar" (feature). Workflow explanations reduce "what do I do first?" anxiety; feature descriptions don't.

**Step count:** 3–5 steps is the established sweet spot. Under 3 feels incomplete; over 5 causes abandonment. For a two-role tool (DM and player), the most common pattern is a toggle between two short step sequences rather than one long merged list. Alternatively, a single linear sequence that covers the natural chain of events (create → share → player submits → DM sees results) works when the workflow is linear, which it is here.

**DM vs player split:**
- DM steps cover: create campaign → share link → mark your unavailable dates → see the recommendations → copy best dates to chat
- Player steps cover: open link → enter name → mark weekly availability → optionally override specific dates → done
- Combining them into one linear flow risks losing the player ("why am I reading about 'create campaign'?") and losing the DM ("I don't need to know how to submit availability")

The cleaner pattern for a two-role tool: a role toggle ("I'm the DM" / "I'm a player") at the top of the modal that switches the step sequence. This is the Calendly pattern for host vs invitee explainers. The toggle is visually prominent, not buried.

**When the modal should appear:**
- DM: on the campaigns home page (`/campaigns`) when no campaigns exist yet (first-time state), OR accessible via a persistent "How it works" link in the header. Auto-showing on every visit creates friction — it should show once, then be accessible on demand.
- Player: on the join/availability page (`/join/[token]/availability`), always accessible via a link near the top of the page. Players may share the link with others later; new players should always be able to find the explainer.

**Trigger placement:**
- A "How it works" text link or small icon button works better than a prominent CTA — it shouldn't compete with the primary action (creating a campaign or setting availability)
- Placement: near the page heading, right-aligned, low visual weight (muted text or outline style matching the app's existing muted link style)

**Confidence:** HIGH — this is a stable pattern across 5+ major scheduling/collaboration tools. Step count 3–5 and two-role toggle are the established conventions.

---

### Q2 — What Content Belongs in DM vs Player Steps

**DM flow (5 steps, compressed to match 3–4 for this app's simplicity):**

The DM's mental model follows a linear sequence:

1. Create a campaign (give it a name, set the planning window)
2. Share the join link with players
3. Mark your own unavailable dates in Settings
4. Watch the Group Availability calendar fill in as players respond
5. Copy the best dates message and paste it into group chat

For this app, steps 1 and 5 can be compressed because campaign creation is already done by the time the DM sees the modal, and copying is self-explanatory from the UI. Recommended DM steps:

1. **Create your campaign** — Set a planning window and share the link with players
2. **Players mark their availability** — Everyone sets their free days; you see it live on the calendar
3. **Add your unavailable dates** — Block dates when you can't run a session in Settings
4. **Pick the best day** — The ranked list shows which days work for everyone; copy it to your group chat

**Player flow (3 steps):**

The player's mental model is simpler — visit, register, set availability:

1. **Open the link** — Your DM shares a link; open it and enter your name
2. **Set your weekly pattern** — Tick the days you're usually free
3. **Add exceptions** — Override specific dates if a particular week is different

Three steps is correct for the player flow. There is nothing else the player needs to do.

**Step content rules for this app:**
- Headings must use second-person imperative ("Create your campaign", not "Campaign Creation")
- Descriptions must state the result, not the action ("Players see their availability link" not "The system generates a link")
- No technical language ("planning window" is OK because it appears in the UI; "override" is OK for the same reason; "aggregate" is not)

**Confidence:** HIGH — derived directly from reading the existing codebase and mapping the actual user journey in each role.

---

### Q3 — What Makes a Calendar Legend Clear and Trustworthy

**Established legend conventions:**

Calendar legends (used in Google Calendar, Calendly, Doodle, Notion, and time-tracking tools) follow stable conventions:

1. **Swatch + label is mandatory.** A swatch (colour chip) always appears before the label. Size: 10–14px square or circle. Shape matches the calendar cell shape (rounded square for cells → rounded square for swatch).

2. **Label text must describe meaning, not colour.** "DM unavailable" not "amber/yellow". "All players free" not "green". The label describes what the colour means in context.

3. **Legend entries must match all distinct states in the calendar.** A legend that covers only some states implies the uncovered states are errors or anomalies. Users lose trust when they see a state in the calendar that doesn't appear in the legend.

4. **Order matters.** Positive states first (free), negative states second (unavailable/no response). DM-specific states typically appear last — they're secondary context, not the primary signal.

5. **Visual weight of legend should be lower than the calendar.** Small text, muted tone. The legend explains; it doesn't dominate.

**Current state in the codebase:**

The Group Availability calendar (`CampaignTabs.tsx`, lines 257–263) has a two-entry legend:
- Green dot: "Free"
- Gray dot: "No response"

The calendar cell rendering in `DashboardCalendar.tsx` has three states:
- `allFree` → green-800/60 background
- Default → gray text, no fill
- `dmBlocked` → `ring-1 ring-amber-400/60` (amber ring on the cell)

**The gap:** the amber ring for DM-blocked dates has no legend entry. This is the specific problem the milestone fixes. Without a legend entry, the amber ring appears mysterious — users may interpret it as an error or a bug.

**What the DM unavailable legend entry needs:**
- Swatch: amber ring or amber-filled chip. The existing cell uses `ring-amber-400/60` — the legend swatch should echo this, using a small rounded square with an amber border/ring rather than a solid fill, since the ring is what distinguishes it in the cell
- Alternatively (and more legible at legend swatch size): a solid amber/amber-500 swatch, since at 10-12px a ring may be too subtle to read
- Label: "DM unavailable" — matches the existing "DM busy" badge language in `BestDaysList.tsx` but "unavailable" is more precise ("busy" implies availability question; "unavailable" is clearer for the calendar legend context)
- Position: after "No response" — it is the least common state and DM-specific

**Confidence:** HIGH — legend conventions are well established; the amber swatch choice is a product decision with a clear rationale.

---

### Q4 — What Makes an "Empty" / No-Availability State Reassuring vs Alarming

**The problem in the current codebase:**

In `CampaignTabs.tsx` (lines 134–148), when a date is selected and the side panel opens, all players are listed with their status. A player who has not submitted availability shows status `'no-response'` and is rendered as:
- Gray dot
- Player name
- "No response" label in gray-500

When ALL players show "No response" (e.g., no one has submitted yet, or the selected date is genuinely empty), the panel shows a list of every player with "No response" — which reads as a list of failures. This is alarming ("something is wrong") rather than informative ("this date just doesn't have data yet").

**What makes empty states alarming:**
- Listing things that are absent (every player showing "No response" looks like a failure list)
- Absence of any positive framing or context
- No distinction between "no one is available" (a real data point) and "no one has responded yet" (a data quality issue)

**What makes empty states reassuring:**
- A single summary message instead of an itemised absence list
- A reason or framing ("Waiting for players to respond" vs "No players available")
- Actionable context when possible ("Send your join link to players to get responses")

**The distinction the app needs to handle:**

There are two distinct "empty" cases that currently look identical:
1. **No players have responded yet** — `agg` is undefined or all players are `no-response` because no availability entries exist. The data is absent; this is a process state, not a scheduling outcome.
2. **Players have responded and genuinely no one is free on this date** — all players have entries but none mark this date free. This is a real scheduling outcome.

The current code doesn't distinguish these cases — `status === 'no-response'` covers both. The correct behaviour:

- **Case 1 (no submissions yet):** Show "No availability data yet — players haven't responded" or similar. Do not list players. Optionally surface the "Awaiting Response" player count from the parent.
- **Case 2 (submitted, none free):** Show "No players free on this date" with the player list showing their actual submitted status (busy vs not-selected). This is information, not an error.

However, distinguishing these two cases requires knowing whether a player has submitted any entries at all, which requires passing additional data into the panel. The simpler, lower-complexity approach (appropriate for this milestone's scope):

- When `freeCount === 0` AND `totalPlayers > 0`: replace the full player list with a single message "No players available on this date"
- Keep the player list for all dates where at least one player is free (the primary use case)

This avoids the case 1/case 2 distinction entirely (which requires additional data) while solving the immediate UX problem of the alarming full-failure list.

**Tone for the "no players available" message:**
- Neutral, not apologetic: "No players available on this date" not "Unfortunately, no players are available"
- Brief: one line. Don't explain why or offer advice — this is informational UI, not an error state
- No icon required — the muted text is sufficient

**Confidence:** HIGH — the distinction between alarming vs reassuring empty states is well-documented in UX literature and product design. The specific implementation recommendation is derived from reading the existing codebase.

---

## Table Stakes

Features users (DMs and players) expect in v1.4. Missing = the milestone feels incomplete.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| DM unavailable legend entry | The amber ring appears in the calendar with no explanation — any DM who hasn't read the Settings tab will not know what it means | Low | No new data; CSS-only change to the legend in `CampaignTabs.tsx` |
| DM unavailable indicator in date panel | When a DM-blocked date is clicked, the side panel shows no indication the DM has blocked it — the DM themselves may forget they blocked it | Low | `dmBlocked` already in `DayAggregation`; pass to panel render |
| Clear "no players available" state | Current panel lists every player as "No response" when none are free — reads as a malfunction | Low | Conditional render in side panel; no new data |
| "How it works" modal — DM | New DMs have no onboarding. The flow is non-obvious (campaign → share link → wait → settings for DM dates → see results) | Medium | New client component; trigger button on campaigns page |
| "How it works" modal — player | Players arrive via a link with no context about what they're supposed to do | Medium | Same component, player variant; trigger on availability page |

---

## Differentiators

Features that add meaningful value beyond the minimum fix.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Role toggle in "how it works" modal | DMs and players share one modal component with a tab/toggle — DMs can understand the player flow, which helps them explain it in their invite message | Low-Medium | Modal already needs DM and player step content; toggle is additive |
| Persistent "How it works" link (not auto-show) | Auto-showing modals on repeat visits are annoying; a persistent link lets users revisit the explainer when they onboard new players | Low | No localStorage needed — a link/button to open the modal on demand is sufficient |
| "No response" vs "not free" distinction (deferred) | The panel could distinguish players who haven't responded from players who responded but are busy — more precise information for the DM | High | Requires passing `hasSubmittedAny` per player; new prop plumbing |

---

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full onboarding tour (tooltips, highlight overlays) | Over-engineered for a 5-person group tool; adds JS complexity for ephemeral value | Static step-card modal is sufficient |
| Auto-show modal on first visit (with localStorage tracking) | Requires localStorage, cookie, or DB state; adds complexity for minimal gain | Show the modal on demand via a persistent link; new DMs will find it |
| Animated step sequence / next/back navigation | Multi-page modal navigation is friction for 3–4 steps — all steps should be visible at once | Single scrollable modal view |
| "No players available" with suggestions ("try a different date") | Unsolicited advice in a summary panel is condescending; the DM already knows to try another date | Single neutral message; no advice |
| Video tutorial or embedded help docs | Out of scope for a small group tool; maintenance burden | Static text steps only |
| "No response" vs "not free" distinction in panel | High complexity (requires new data plumbing), low value for small groups where the DM knows who hasn't responded | Defer; the "Awaiting Response" section already surfaces unresponsive players |
| Legend swatch as an interactive filter | Clicking a legend entry to filter calendar by that state — far beyond the clarify-the-calendar brief | Static legend only |

---

## Feature Dependencies

```
"How it works" modal
  → New client component: HowItWorksModal.tsx
  → Trigger button: added to /campaigns page (DM) and /join/[token]/availability page (player)
  → No data dependencies — purely presentational
  → Contains DM steps and player steps; role toggle controls which is shown
  → Modal pattern: same overlay pattern as ShareModal.tsx (fixed inset, backdrop, card)

DM unavailable legend entry
  → Change to legend markup in CampaignTabs.tsx (lines 257-263)
  → No new components, no new data
  → Swatch style must echo the amber ring used in DashboardCalendar.tsx (ring-amber-400/60)

DM unavailable indicator in date panel
  → Change to side panel render in CampaignTabs.tsx (lines 119-152)
  → Requires: `agg?.dmBlocked` — already present in DayAggregation
  → Requires: `dmExceptionMode` prop — already present in CampaignTabsProps
  → No new data fetching; data already flows through the component tree

"No players available" state in date panel
  → Change to side panel render in CampaignTabs.tsx (lines 134-148)
  → Conditional: when freeCount === 0 && totalPlayers > 0, replace player list with message
  → Requires: `agg?.freeCount` and `agg?.totalPlayers` — already present in DayAggregation
  → Note: when agg is undefined (date has no aggregation data), current behavior (no players listed)
    is acceptable — edge case only for dates outside the window, which are non-interactive
```

---

## MVP Recommendation for v1.4

Build in this order (all low-complexity; can be done in any order, but this order minimises risk):

1. **Legend entry** — 1 line of JSX in `CampaignTabs.tsx`. Atomic, zero risk.
2. **DM unavailable indicator in panel** — Conditional JSX in the same side panel block. Low risk; data already available.
3. **"No players available" state** — Conditional render in same side panel block. Low risk; data already available.
4. **"How it works" modal** — New component. Medium complexity but self-contained. Build DM steps first, then player toggle.

All four changes are concentrated in two files: `CampaignTabs.tsx` (features 1–3) and a new `HowItWorksModal.tsx` (feature 4). This is the lowest-risk milestone the app has had.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| "How it works" modal structure | HIGH | Established 3–5 step pattern; role toggle is a confirmed convention |
| Step content (DM and player) | HIGH | Derived from direct codebase reading of actual user journeys |
| Legend clarity conventions | HIGH | Swatch + label is a 20-year stable convention; amber swatch choice is a product recommendation with clear rationale |
| "No players available" state | HIGH | Empty-state UX patterns are well-documented; the specific freeCount condition is derived from existing data model |
| Implementation location | HIGH | All three panel/legend changes are in CampaignTabs.tsx; the modal is new — confirmed by codebase reading |
| "No response" vs "not free" distinction | MEDIUM | The distinction exists conceptually; deferring it is the right call for this milestone's scope; implementing it later requires new data plumbing |

---

## Gaps to Address

- **Modal trigger UX on the home page (`/campaigns`):** The home page currently redirects logged-in DMs to `/campaigns`. The explainer link needs to appear somewhere DMs will find it without cluttering the campaigns list. The header area (near "Your Campaigns" heading, right-aligned) is the likely location — but this requires a design decision about whether it's inline text or a small icon button.
- **Player page explainer placement:** The player availability page has no page-level header controls currently. Adding an explainer link needs a placement decision — above or below the `AvailabilityForm`, or in the campaign info card that shows the campaign name/description.
- **"How it works" modal on the login/signup pages:** PROJECT.md says the modal should be accessible from "the home page, DM campaigns page, and player-facing pages" — but the DM home page (`/`) redirects logged-in DMs and shows only Log In / Sign Up for logged-out users. Decision needed: does the modal appear on the public home page (for prospective users), or only post-auth?
- **DM panel indicator when mode is 'flag' vs 'block':** When DM exception mode is 'block', DM-blocked dates are hidden from the Best Days list. The date is still clickable in the calendar (it is still within the planning window) and the panel would show the amber indicator. This is correct behaviour, but worth confirming — a DM might be confused to click a 'blocked' date from the calendar and see it in the panel. Consider suppressing the DM date click or adding a note "You've blocked this date" in the panel.

---

## Sources

- Project codebase: direct reading of `CampaignTabs.tsx`, `DashboardCalendar.tsx`, `BestDaysList.tsx`, `AvailabilityCalendar.tsx`, `ShareModal.tsx`, `lib/availability.ts` — HIGH confidence (authoritative)
- PROJECT.md active requirements — HIGH confidence (authoritative)
- Domain knowledge: Calendly, Doodle, Cal.com, Notion, Linear, Google Calendar onboarding and legend conventions — training data, confidence HIGH (patterns stable for 3+ years)
- UX conventions for empty states and legend design — training data, confidence HIGH
- Note: Web search was unavailable in this research session. All UX pattern claims are based on established conventions that have been stable across major products for multiple years.
