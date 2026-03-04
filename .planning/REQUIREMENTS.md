# Requirements: D&D Session Planner

**Defined:** 2026-03-04
**Core Value:** The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.

## v1.2 Requirements

Requirements for the Multi-Campaign DM milestone. Phase numbering continues from v1.1 (last phase: 7).

### Authentication

- [x] **AUTH-01**: DM can sign up with email and password
- [x] **AUTH-02**: DM can log in with email and password
- [x] **AUTH-03**: DM session persists across browser refresh (httpOnly session cookie)
- [x] **AUTH-04**: DM can log out and session is cleared

### Campaign Management

- [x] **CAMP-01**: DM can create a campaign with a required name
- [x] **CAMP-02**: DM can optionally add a description (notes / flavour text) when creating a campaign
- [x] **CAMP-03**: DM can optionally set a max players limit when creating a campaign
- [ ] **CAMP-04**: DM can view all their campaigns from a home dashboard (cards)
- [ ] **CAMP-05**: DM home dashboard has a "Create new campaign" button

### Join Flow

- [x] **JOIN-01**: Join link enforces max players cap — new player sees a "campaign full" message when limit is reached

## Future Requirements

### Account Management

- **ACCT-01**: DM can change their email address
- **ACCT-02**: DM can change their password
- **ACCT-03**: DM can reset forgotten password via email link

### Campaign Editing

- **CAMP-F01**: DM can edit campaign name, description, or max players after creation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automated reminders sent to players | DM handles nudging manually |
| Per-session polls with pre-selected dates | Replaced by open availability model |
| In-app chat or session notes | Scheduling only |
| OAuth / magic link login | Email+password sufficient; no external service dependency |
| Player accounts or login | Player identity stays cookie-based — zero friction |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 8 | Complete |
| AUTH-02 | Phase 8 | Complete |
| AUTH-03 | Phase 8 | Complete |
| AUTH-04 | Phase 8 | Complete |
| CAMP-01 | Phase 9 | Complete |
| CAMP-02 | Phase 9 | Complete |
| CAMP-03 | Phase 9 | Complete |
| CAMP-04 | Phase 10 | Pending |
| CAMP-05 | Phase 10 | Pending |
| JOIN-01 | Phase 9 | Complete |

**Coverage:**
- v1.2 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 — AUTH-04 marked complete after 08-02 (logOut server action)*
