# D&D Session Planner

## What This Is

A web app for scheduling D&D sessions with a group of friends. The DM creates an account, creates campaigns with a name and optional description and player cap, and shares a single join link per campaign. Players visit the link, enter their name once, and are remembered by a browser cookie. The DM sees a calendar showing aggregate availability across the group plus ranked best-day recommendations. The DM's home page shows all their campaigns as cards. Deployed to Vercel with Neon PostgreSQL in production.

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
- ✓ DM can create a campaign by entering only a planning window (no name, no player names) — v1.1
- ✓ Campaign generates a single shareable join link — v1.1
- ✓ New player visits link, enters their name, and is taken to their availability page — v1.1
- ✓ Returning player is recognised by browser (cookie) and taken straight to their availability — v1.1
- ✓ DM is recognised by browser (cookie) and taken straight to the dashboard when visiting the link — v1.1
- ✓ DM can sign up and log in with email and password — v1.2
- ✓ DM can create multiple campaigns, each with a name, optional description, and optional max players limit — v1.2
- ✓ DM home page shows all their campaigns as cards with a "Create new campaign" button — v1.2
- ✓ Join link enforces max players cap — players see a "campaign full" message when limit is reached — v1.2

### Active

- DM and player-facing pages use a unified deep purple visual theme with Cinzel headings and #BA7DF6 primary accent
- All primary action buttons use #BA7DF6 background with dark text
- All headings use white text in the Cinzel font
- Background uses a deep purple radial gradient with a subtle overlay image
- Form inputs use a dark (#200637) background with #BA7DF6 border

### Out of Scope

- Automated reminders sent to players — DM handles nudging manually
- Per-session polls with pre-selected dates — replaced by open availability model
- In-app chat or session notes — scheduling only

## Context

- Group size: 5 people (1 DM + 4 players)
- Shipped v1.0 in 3 days (2026-02-23 → 2026-02-26): 4 phases, 14 plans, ~7,600 TypeScript LOC
- Shipped v1.1 in 4 days (2026-02-27 → 2026-03-02): 3 phases, 8 plans, +3,053 / -241 LOC
- Shipped v1.2 in 2 days (2026-03-04 → 2026-03-05): 3 phases, 7 plans, +2,540 / -77 LOC
- Current codebase: ~10,200 TypeScript LOC (estimated)
- Tech stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma 7, bcryptjs, SQLite (local) / Neon PostgreSQL (production)
- Deployed to Vercel: https://my-portfolio-henna-ten-97.vercel.app
- Access model: DM has email+password account with httpOnly session cookie; players are still cookie-based (no login required)

## Constraints

- **DM auth**: Email + password with hashed storage (bcrypt); session via httpOnly cookie
- **Player access**: Still cookie-based, no login required — single join link per campaign
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
| Cookie-based identity over per-player links (v1.1) | Single join link lowers friction — no individual link management for DM | ✓ Good — simpler DM workflow |
| No `secure: true` on httpOnly cookies (v1.1) | Next.js dev is HTTP; Vercel enforces HTTPS at platform level | ✓ Good — clean dual-environment |
| Silent fallthrough on stale dm_secret cookie (v1.1) | Handles DB reset gracefully — DM can create new campaign without error state | ✓ Good — zero error UX |
| JoinForm extracted to separate file (v1.1) | Clean `use client` boundary from server component routing logic | ✓ Good — clear separation |
| `redirect()` outside try/catch in server actions (v1.1) | Next.js `redirect()` throws internally — must not be caught | ✓ Good — correct pattern |
| bcryptjs over bcrypt (v1.2) | Pure JS, no native compilation — works on Vercel Edge without extra config | ✓ Good — zero build issues |
| Session via httpOnly cookie, 30-day expiry, server-side expiry check (v1.2) | Secure, stateless reads; graceful expiry without client-side token management | ✓ Good — clean auth pattern |
| Campaigns linked to DM via `dmId` FK (v1.2) | Enables multi-campaign per DM; required for Phase 10 home dashboard query | ✓ Good — foundation for future features |
| Required name enforced in server action not DB constraint (v1.2) | Avoids breaking `db push` against existing campaigns that have no name; consistent with existing pattern | ✓ Good — backward-compatible migration |
| Logout as plain HTML form with server action (v1.2) | No `use client` needed in Server Component — clean pattern for server-side mutations | ✓ Good — adopted across auth pages |
| `useActionState` from `react` not `react-dom` (v1.2) | React 19 deprecates the `react-dom` import; avoids deprecation warnings | ✓ Good — correct for React 19 |

---
*Last updated: 2026-03-05 after v1.2 milestone*
