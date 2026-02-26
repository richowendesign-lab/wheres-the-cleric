# D&D Session Planner

## What This Is

A web app for scheduling D&D sessions with a group of friends. The DM (organizer) creates a campaign and gets unique private invite links per player. Players use their link to set their recurring weekly availability and mark specific date exceptions. The DM sees a calendar showing aggregate availability across the group plus ranked recommendations for the best session days. Shipped as v1.0 MVP — deployed to Vercel with Neon PostgreSQL in production.

## Core Value

The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.

## Requirements

### Validated

- ✓ DM can create a campaign and get a unique invite link per player — v1.0
- ✓ Players can set recurring weekly availability patterns (e.g. "free Saturday evenings") — v1.0
- ✓ Players can override specific dates as exceptions (busy or free outside their pattern) — v1.0
- ✓ DM can see an aggregate availability calendar showing each player's status per day — v1.0
- ✓ App ranks and recommends the best days for a session based on group availability — v1.0
- ✓ DM can see which players haven't submitted their availability yet — v1.0

### Active

(None — all v1.0 requirements shipped. Define v1.1 requirements with `/gsd:new-milestone`.)

### Out of Scope

- Automated reminders sent to players — DM handles nudging manually
- Account-based login — private invite links used instead
- Per-session polls with pre-selected dates — replaced by open availability model
- In-app chat or session notes — scheduling only

## Context

- Group size: 5 people (1 DM + 4 players)
- Shipped v1.0 in 3 days (2026-02-23 → 2026-02-26): 4 phases, 14 plans, ~7,600 TypeScript LOC
- Tech stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma 7, SQLite (local) / Neon PostgreSQL (production)
- Deployed to Vercel: https://my-portfolio-henna-ten-97.vercel.app
- Access model: No accounts — each player gets their own persistent private link they can return to and update
- Key insight: Players express *when they're generally free* rather than react to dates the DM proposes

## Constraints

- **Access model**: No user accounts — invite links must be persistent and uniquely tied to each player
- **Group focus**: Built for small groups (5–8 people), not general-purpose event scheduling

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Private invite links over accounts | Lowers friction for players — no signup required | ✓ Good — zero-friction player onboarding |
| Open availability over polls | Solves "too rigid" problem — DM sees full picture, not just pre-selected dates | ✓ Good — DM has full visibility |
| DM sees who hasn't responded (no auto-reminders) | Keeps app simple; DM prefers to handle nudging | ✓ Good — Awaiting Response section works well |
| SQLite local / Neon PostgreSQL production | Zero-config local dev, scalable production | ✓ Good — clean dual-environment setup |
| Server-side aggregation for dashboard | Keeps client components simple; no client fetching | ✓ Good — fast renders, no loading states |
| CSS-only hover tooltip (group-hover) | No JS state for tooltips keeps component lighter | ✓ Good — smooth, no flicker |
| Side-by-side calendar + best days layout | DM's primary goal after sharing links is to see availability | ✓ Good — user feedback confirmed this |

---
*Last updated: 2026-02-26 after v1.0 milestone*
