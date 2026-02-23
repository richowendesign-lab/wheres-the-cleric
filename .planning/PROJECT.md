# D&D Session Planner

## What This Is

A web app for scheduling D&D sessions with a group of friends. The DM (organizer) creates a campaign and gets unique private invite links per player. Players use their link to set their recurring weekly availability and mark specific date exceptions. The DM sees a calendar showing aggregate availability across the group plus ranked recommendations for the best session days.

## Core Value

The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] DM can create a campaign and get a unique invite link per player
- [ ] Players can set recurring weekly availability patterns (e.g. "free Saturday evenings")
- [ ] Players can override specific dates as exceptions (busy or free outside their pattern)
- [ ] DM can see an aggregate availability calendar showing each player's status per day
- [ ] App ranks and recommends the best days for a session based on group availability
- [ ] DM can see which players haven't submitted their availability yet

### Out of Scope

- Automated reminders sent to players — DM handles nudging manually
- Account-based login — private invite links used instead
- Per-session polls with pre-selected dates — replaced by open availability model
- In-app chat or session notes — scheduling only

## Context

- Group size: 5 people (1 DM + 4 players)
- Current process: DM creates polls with specific dates, but this is too rigid (misses good options) and players often don't respond
- Access model: No accounts — each player gets their own persistent private link they can return to and update
- Key insight: Players should express *when they're generally free* rather than react to dates the DM proposes

## Constraints

- **Access model**: No user accounts — invite links must be persistent and uniquely tied to each player
- **Group focus**: Built for small groups (5–8 people), not general-purpose event scheduling

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Private invite links over accounts | Lowers friction for players — no signup required | — Pending |
| Open availability over polls | Solves "too rigid" problem — DM sees full picture, not just pre-selected dates | — Pending |
| DM sees who hasn't responded (no auto-reminders) | Keeps app simple; DM prefers to handle nudging | — Pending |

---
*Last updated: 2026-02-23 after initialization*
