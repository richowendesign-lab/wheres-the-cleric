---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Multi-Campaign DM
status: in-progress
last_updated: "2026-03-04"
progress:
  total_phases: 10
  completed_phases: 7
  total_plans: 28
  completed_plans: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04 after v1.2 milestone start)

**Core value:** The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.
**Current focus:** v1.2 — Phase 8 (DM Auth) in progress

## Current Position

Phase: Phase 8 (DM Auth) — in progress
Plan: 3 of 6 complete (08-03 done)
Status: Auth UI pages complete (signup/login forms + home page session gating), moving to campaigns page
Last activity: 2026-03-04 — completed 08-03 (sign-up/login pages + updated home page)

```
v1.2 Progress: [█░░░░░░░░░] 0/3 phases (Phase 8 in progress)
```

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full history.

**v1.2 decisions:**
- DM auth: bcrypt password hashing, session via httpOnly cookie (dm_session_token), no NextAuth
- Players remain cookie-based — no login required, zero friction preserved
- Campaign ownership: campaigns linked to authenticated DM account (DM model added to schema)
- Phase 9 bundles CAMP-01/02/03 with JOIN-01: schema changes and join cap enforcement are a single coherent migration
- bcryptjs over bcrypt: pure JS, no native compilation, works on Vercel Edge without extra config
- Session expiry 30 days; BCRYPT_ROUNDS=12 for security/performance balance
- db push (not migrate) for schema changes — works for both SQLite dev and Neon prod
- Inline SESSION_COOKIE_NAME in middleware (cannot import from @/lib/auth — Edge runtime incompatibility with next/headers)
- Middleware appends ?next=pathname for future redirect-after-login; logIn action ignores it in Phase 8
- useActionState from 'react' (React 19) used for auth forms — not deprecated useFormState from 'react-dom'
- Home page removes dm_secret cookie check entirely, replaced with getSessionDM() — Create a Campaign CTA removed (middleware protects /campaigns/new)

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-04
Stopped at: Completed 08-03 — sign-up/login pages + home page session gating
Resume file: None
