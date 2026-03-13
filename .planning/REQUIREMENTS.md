# Requirements: Where's the Cleric — D&D Session Planner

**Defined:** 2026-03-12
**Core Value:** DMs can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.

## v1.4 Requirements

Requirements for Milestone v1.4: Clarity & Polish.

### How It Works Modal

- [x] **HOW-01**: DM and player can open a "How it works" explainer from the logged-out home page, DM campaigns page, and player-facing pages (join + availability)
- [x] **HOW-02**: The trigger on the DM campaigns page is a small `?` icon button in the page heading; on other pages it suits the page context
- [x] **HOW-03**: The explainer modal displays visual numbered step cards (step number + heading + 1-line description) covering both DM and player perspectives
- [x] **HOW-04**: Modal is dismissible via backdrop click or Escape; focus is properly trapped while open

### Calendar & Panel Clarity

- [x] **CLAR-01**: Group Availability calendar legend includes a DM unavailable colour swatch — only shown when the DM has marked at least one date
- [x] **CLAR-02**: Clicking a DM-marked date in the Group Availability calendar shows a DM unavailable indicator in the date panel alongside normal player availability
- [x] **CLAR-03**: Date panel shows a clear single message when no players are available, instead of listing each player as "no response"

## Future Requirements

Deferred to v1.5 or later.

### DM Full Availability

- **DMAV-01**: DM can set recurring availability patterns (mirrors the player availability flow)

### Transparency

- **TRAN-01**: Players can see which dates the DM has marked as unavailable

### Sharing

- **SHAR-01**: Auto-send or email delivery of share messages (requires email infrastructure)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Tabbed DM/Player sections in explainer modal | All steps shown together in one scrollable modal — simpler, no state needed |
| Next/back navigation in explainer | All steps visible at once — no carousel needed |
| Per-player colour coding in calendar | Aggregate fill intensity is clearer; per-player colours are complex |
| DM recurring unavailability patterns | Full DM availability form mirrors player flow — high complexity, defer to future |
| ShareModal accessibility upgrade | Out of scope for this milestone; tracked as future cleanup |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOW-01 | Phase 19 | Complete |
| HOW-02 | Phase 19 | Complete |
| HOW-03 | Phase 18 | Complete |
| HOW-04 | Phase 18 | Complete |
| CLAR-01 | Phase 17 | Complete |
| CLAR-02 | Phase 17 | Complete |
| CLAR-03 | Phase 17 | Complete |

**Coverage:**
- v1.4 requirements: 7 total
- Mapped to phases: 7 (roadmap complete)
- Unmapped: 0

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 after roadmap creation*
