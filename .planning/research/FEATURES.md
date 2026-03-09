# Feature Landscape

**Domain:** D&D session scheduling app — DM experience & scheduling flow (v1.3)
**Researched:** 2026-03-09
**Overall confidence:** MEDIUM-HIGH (domain patterns drawn from training knowledge of Calendly, Doodle, When2Meet, Basecamp, Cal.com, Google Calendar invite flows — web search unavailable in this session)

---

## Context

v1.3 adds five features to an existing app (Next.js 16, React 19, Tailwind CSS 4, Prisma 7, SQLite/Neon). All features are additive — they extend the existing DM post-creation and dashboard flows. The existing system has: campaign creation, single join link, player availability submission, aggregate calendar, best-day rankings, DM home with campaign cards.

The four research questions are answered below, then translated into feature categories.

---

## Research: The Four UX Questions

### Q1 — Post-Creation Share Modals (Copy Link + Pre-Written Message)

**What makes them effective:**

The pattern is well-established across Calendly, Google Meet, Eventbrite, and Discord server invites. The anatomy of an effective share modal is:

1. **Immediate trigger** — modal opens automatically on campaign creation success, not requiring the DM to hunt for the link later. "You created X — here's how to share it" as the headline.
2. **Single-action copy** — one button copies the URL to clipboard. The button label changes to "Copied!" with a tick for ~2 seconds, then resets. No toast needed; the button itself is the feedback. URL is displayed in a read-only text field so the DM can see what they're copying.
3. **Pre-written message** — a separate "Copy message" button copies a formatted string that includes the link, what the recipient needs to do, and any deadline. The DM pastes this directly into Discord/WhatsApp. The text is shown in a `<textarea>` (read-only, scrollable) so the DM can preview and optionally edit before copying.
4. **Dismiss path** — an explicit "I've shared it, go to dashboard" or simply closing the modal takes them to the campaign dashboard. The modal should not auto-dismiss — the DM may want to copy multiple times or switch between copy-link and copy-message.
5. **What the pre-written message must contain:** the link, a one-line description of what players need to do ("open the link, enter your name, mark when you're free"), and optionally the planning window end date as a soft deadline. It should NOT be long — under 100 words. Discord/WhatsApp messages that are too long get ignored.

**Confidence:** HIGH — this pattern is identical across Calendly, Doodle, Google Meet, and Discord. The "button-as-feedback" pattern (label change) is a well-established micro-interaction.

**For this app specifically:** The join link is already generated at campaign creation. The modal only needs to surface it with the two-button pattern. No new data required.

---

### Q2 — Calendar UX: Two Months + Ranked Date List (Basecamp-Style)

**Expected layout and behaviour:**

Basecamp's Schedule view (and similar in Linear, Notion calendar, and most modern project tools) uses a hybrid layout:

- **Calendar grid** (left or top): Shows the planning window month by month. Individual days are coloured/marked. The DM sees the full shape of availability at a glance — which weeks are dense, which are sparse.
- **Ranked list** (right or below): A linear list of the top N dates, ordered by score, showing day/date, how many players are free, and which players are unavailable. This answers "which day should I pick?" directly without requiring the DM to interpret colour gradients.

**Two-month view specifics:**

- Show the two months of the planning window (or current + next if the window spans more). Do NOT paginate — show both simultaneously. Scrolling between months is friction for a decision the DM makes once per session.
- If the planning window is 6+ weeks, two months is still the right unit because it matches how humans think about scheduling ("can we do it this month or next?").
- Days outside the planning window should be visually muted (greyed out), not interactive.
- Days with full group availability get the strongest visual treatment (bright fill). Days with partial availability get graduated treatment. Days the DM is unavailable (v1.3 feature) get a distinct marker — a slash, a different border, or a "DM busy" indicator.

**Ranked list specifics:**

- Show top 5–10 dates, sorted by: number of available players (descending), then date (ascending) as tiebreaker.
- Each entry: day name + full date, availability count (e.g. "4/4 players free"), unavailable player names (if any). A "Copy" button or share icon next to the top entries.
- If the DM has marked unavailable dates, those dates should either be excluded from the top list OR shown with a "DM unavailable" badge — the PROJECT.md describes a per-campaign toggle to "block or flag" so both need to be supported.

**Interaction between calendar and list:**

- Hovering or tapping a date in the list highlights it in the calendar. Hovering a date in the calendar shows its rank in the list (or a tooltip with player breakdown). This cross-linking is the key UX that Basecamp and Linear do well — neither panel is an island.

**Confidence:** HIGH — this is a well-established hybrid scheduling UI. The specific two-panel layout is confirmed by Basecamp, Linear timeline + list, and Doodle's poll results view.

---

### Q3 — Host/Organiser Marking Their Own Unavailable Dates

**How it is typically modelled:**

In Calendly, Cal.com, and Doodle, the organiser's unavailability is a first-class concept. The standard model has two layers:

1. **Recurring unavailability** (e.g., "I never run sessions on Tuesdays") — this is the existing player availability pattern and the DM should eventually use it. NOT in scope for v1.3.
2. **One-off date exceptions** — "I'm away on March 15, can't run that day." This is what v1.3 targets.

**How it is displayed:**

The organiser exception is stored as a date-level record (date + campaign ID + reason optional). On the dashboard calendar:

- The date gets a distinct visual treatment from player unavailability. The most common pattern: a diagonal stripe, a "host" icon (small crown or DM abbreviation), or a different border colour. It must be distinguishable from "player unavailable" which uses the fill-colour gradient.
- In the ranked date list, DM-unavailable dates either disappear (if the toggle is "block") or show with a warning badge (if the toggle is "flag"). The toggle controls this display, not the underlying data model — the exception record is always stored; the toggle is a display preference.

**Data model:**

The simplest model: a `DmException` table with `(campaignId, date, type: 'unavailable')`. This mirrors the existing `PlayerException` pattern. No new schema concepts needed.

**Entry UX:**

DM marks dates on a calendar within the campaign setup or campaign settings page. The preferred pattern is direct calendar interaction: click a date to toggle it unavailable, click again to remove the exception. An alternative is a date-picker + "add exception" button, but direct toggle is faster for multi-date marking. The custom date picker (also a v1.3 feature) is relevant here — it could serve double duty as the exception entry UI.

**Confidence:** HIGH — this is an exact parallel to the existing `PlayerException` model already in the codebase. The display toggle (block vs flag) is a product decision, not a technical uncertainty.

---

### Q4 — Sharing a Formatted "Best Dates" Message

**What formats work well:**

Analysis of how scheduling results are shared in Discord, WhatsApp, and Slack (the actual channels D&D groups use) points to a very specific format:

**The effective format:**
```
Hey everyone — here are our best dates for the next session:

1. Saturday 22 March — everyone free
2. Saturday 29 March — 3/4 free (Alex busy)
3. Sunday 30 March — 3/4 free (Sam busy)

Drop a reaction or reply to confirm a date. Link to your availability: [URL]
```

Key characteristics:
- Numbered list, not bullet points (implies ranking, which is the point)
- Day name + full date (not just day number — avoids confusion)
- "Everyone free" vs "N/M free (Name busy)" — human-readable, not "4/4" notation in the shared message (that's fine on the dashboard but feels cold in a chat message)
- 3 dates maximum in the shared message — more than 3 causes decision paralysis in a group chat context
- Optional re-link to the availability page at the bottom for players who haven't submitted yet
- Short enough to read in one screen on mobile

**What does NOT work:**
- Long tables or grid formats — unreadable in Discord/WhatsApp
- Dates without day names — "22/03" with no "Saturday" attached is ambiguous and requires mental calendar lookup
- Percentages — "75% availability" is accurate but feels cold
- More than 3 dates — creates a secondary decision problem ("which of these 5 should we pick?")

**Copy mechanism:** A single "Copy best dates message" button on the dashboard. The app generates the message on the fly from the current ranked data. The DM does not edit the message in-app — they copy and paste into their group chat, where they can edit naturally.

**Confidence:** MEDIUM-HIGH — based on established patterns in group coordination tools and knowledge of how Discord/WhatsApp group messages are actually read. The specific 3-date limit is a product recommendation, not an industry standard, but is strongly supported by decision fatigue research.

---

## Table Stakes

Features users (DMs) expect in v1.3. Missing = the milestone feels incomplete.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Post-creation share modal | Campaign is useless until the link is shared — this is the next required action after creation. Currently the DM must navigate to find the link | Low | Existing join link URL; modal UI only |
| Copy join link button (in modal) | Industry standard for any shareable link UX — single click, button-state feedback | Low | Clipboard API; no new data |
| Pre-written message copy (in modal) | DMs will paste into Discord/WhatsApp — the message needs to be ready. Without it, DMs write their own message every time, inconsistently | Low | Campaign name, planning window dates, join URL |
| Two-month calendar view on campaign dashboard | Current single-month view truncates the planning window. DMs reported needing to see the full window at once | Medium | Existing calendar component refactor; no new data |
| Ranked best dates list alongside calendar | Already partially built (rankings exist) — needs surfacing in the new layout | Low | Existing ranking logic; layout only |
| DM unavailability exceptions (per campaign) | DM's own dates must factor into recommendations — without this, the best-day list is wrong (it ignores the DM) | Medium | New `DmException` DB table; calendar interaction for marking dates |

---

## Differentiators

Features that are not expected but add real value to the D&D context.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| "Copy best dates" message (formatted, shareable) | Closes the loop — DM goes from "seeing the answer" to "communicating the answer" in one click. No other scheduling tool targets this workflow specifically | Low | Ranked list data; message template; Clipboard API |
| Block vs flag toggle for DM unavailability | Gives the DM control over how their unavailability affects recommendations. "Block" removes the day; "flag" keeps it ranked but warns players. This nuance is absent from general-purpose scheduling tools | Low-Medium | `DmException` model; conditional rendering in ranked list |
| Custom purple-themed date picker | Cosmetic but important for this app — the native browser date picker breaks the app's visual identity. Consistent UI signals quality and polish to players | Medium | React date picker component; Tailwind v4 theming |

---

## Anti-Features

Features to explicitly NOT build in v1.3.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| In-modal editing of the pre-written message | Adds complexity (controlled textarea state, undo, reset) for little gain — DMs will edit in their chat app naturally | Generate the message, offer copy-only, no edit UI |
| More than 3 dates in the "copy best dates" message | Decision paralysis in group chat. 5 dates = no date gets picked. Ranked list on dashboard can show more | Hard-code top 3 in the shareable message |
| DM recurring unavailability patterns | Out of scope — adds a separate availability form for the DM that mirrors the player flow. Complex, not needed for a 5-person group | Defer to v1.4 or later |
| Auto-send or email delivery of the share message | Requires email infrastructure, opt-in, unsubscribe. Players have no accounts to email. The copy-paste flow is sufficient | Copy to clipboard only |
| Calendar pagination (month-by-month navigation) | Forces the DM to flip through months to see the full picture. Two-month simultaneous view is better for this use case | Show both months side by side, no pagination |
| Per-player colour coding in the redesigned calendar | Current colour-by-player is already complex. In the redesigned view, aggregate availability score per day is the signal | Use fill intensity (dark = more people free) not per-player colours |

---

## Feature Dependencies

```
Post-creation share modal
  → requires: existing join link URL (already built in v1.1/v1.2)
  → requires: campaign name (already built in v1.2)
  → requires: planning window end date (already stored)

Two-month calendar + ranked list layout
  → requires: existing CalendarView component (refactor, not rewrite)
  → requires: existing ranking algorithm (already outputs scored dates)
  → DM unavailability toggle (block/flag) affects ranked list rendering

DM availability exceptions
  → requires: new DmException DB table (mirrors PlayerException pattern)
  → requires: calendar interaction for marking dates (reuses custom date picker)
  → feeds into: two-month calendar display (DM-unavailable day markers)
  → feeds into: ranked list (block = remove date; flag = show with badge)
  → feeds into: "copy best dates" message (blocked dates excluded from message)

Shareable best dates message
  → requires: ranked list data (already computed)
  → requires: DM unavailability to be resolved first (so the message reflects correct data)
  → requires: Clipboard API (browser-native, no library needed)

Custom date picker
  → replaces: native browser <input type="date"> in campaign creation form
  → also used for: DM exception entry UI (double duty)
  → no data model dependencies — purely presentational
```

---

## MVP Recommendation for v1.3

Build in this order to unlock the most value earliest:

1. **Post-creation share modal** — highest immediate value, lowest complexity. DMs get the link-sharing flow on day one.
2. **DM availability exceptions** (data model + calendar marking) — the data must exist before the calendar view can display it correctly.
3. **Two-month calendar + ranked list redesign** — the big visible change. Now incorporates DM exceptions correctly.
4. **Shareable best dates message** — depends on the ranked list being correct (which requires DM exceptions). Low complexity once the list is right.
5. **Custom date picker** — polish item, no dependencies. Can be done last without blocking anything.

Defer to v1.4:
- DM recurring availability patterns (full availability form for DM, mirrors player flow)
- Player-facing display of DM unavailability (showing players which dates the DM has blocked — requires a UX decision about transparency)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Share modal UX patterns | HIGH | Industry-standard pattern (Calendly, Discord, Google Meet) — well established |
| Two-month calendar layout | HIGH | Confirmed by Basecamp, Linear, Doodle — widely implemented |
| DM/host unavailability modelling | HIGH | Direct parallel to existing PlayerException model in this codebase |
| Shareable message format | MEDIUM-HIGH | Recommended format based on D&D group chat context; specific 3-date limit is product recommendation |
| Custom date picker complexity | MEDIUM | Depends on which library is chosen — not researched in this session |
| Feature ordering/dependencies | HIGH | Based on direct reading of the existing codebase architecture via PROJECT.md |

---

## Gaps to Address

- **Custom date picker library choice** — not researched. Candidates: `react-day-picker` (lightweight, Tailwind-friendly), `shadcn/ui` calendar primitive, or a hand-rolled component. Needs a separate STACK or COMPARISON note.
- **Block vs flag toggle persistence** — is this stored per-campaign in the DB or is it a DM preference? PROJECT.md says "per-campaign toggle" which implies DB storage on the Campaign record. Confirm schema change needed.
- **DM exception visibility to players** — not specified in v1.3 scope. If blocked dates disappear from the join link availability calendar (player's view), that's a UI change to the player flow. Needs a decision before implementation.

---

## Sources

- Domain knowledge: Calendly, Doodle, When2Meet, Basecamp schedule view, Cal.com, Google Meet share flows, Discord invite UI, Linear timeline — training data, confidence MEDIUM-HIGH
- Project context: `/Users/richardowen/Desktop/wheres-the-cleric/.planning/PROJECT.md` — HIGH (authoritative)
- Note: Web search was unavailable in this research session. Findings are based on training knowledge of established UX patterns. Claims about "industry standard" patterns reflect patterns that have been stable for 3+ years and are unlikely to have materially changed.
