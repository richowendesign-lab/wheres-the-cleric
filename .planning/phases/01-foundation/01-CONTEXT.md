# Phase 1: Foundation - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the app, establish the data model, and get it running locally and deployed. This phase produces a working foundation — no features yet, just the skeleton everything else builds on. Campaign creation, availability input, and the dashboard are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Local dev setup
- Single command startup — `npm run dev` or equivalent. Must be as simple as possible.
- Node.js is already installed on the dev machine (no Node install steps needed in setup docs)
- Fresh start should seed a demo campaign with sample players so the app is immediately usable
- Environment config via `.env` file (copy `.env.example` and fill in values)

### Developer profile
- The person running this is a designer, not an engineer. Setup instructions must be non-technical: short, clear, no assumed command-line knowledge beyond running a single command.
- Avoid complex tooling (no Docker required, no build pipelines to manage manually)

### Claude's Discretion
- Framework and runtime choice (keep it simple for a small personal app)
- Database choice (prioritise zero-config local setup; something that works with a single connection string)
- Deployment platform (pick whatever integrates cleanly with the stack and gives a stable URL)
- Folder structure and project scaffold conventions

</decisions>

<specifics>
## Specific Ideas

- "As simple and non-technical as possible for me, a designer" — this is the guiding constraint for all tooling and setup decisions
- Demo seed data should represent a realistic D&D campaign: a campaign name, 4 player slots, and a planning window

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-23*
