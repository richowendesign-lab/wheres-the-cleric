# Requirements: Where's the Cleric — D&D Session Planner

**Defined:** 2026-03-09
**Core Value:** DMs can coordinate session scheduling with their group without friction — from campaign creation to picking a date everyone can make.

## v1.3 Requirements

Requirements for Milestone v1.3: DM Experience & Scheduling Flow.

### Share Modal

- [ ] **SHARE-01**: DM sees a share modal automatically after creating a campaign
- [x] **SHARE-02**: DM can copy the join link with one click (button gives "Copied!" feedback)
- [x] **SHARE-03**: Join link is displayed in a read-only field in the modal
- [x] **SHARE-04**: DM can copy a pre-written invite message (includes link + player instructions)
- [ ] **SHARE-05**: DM can dismiss the modal to proceed to the campaign dashboard

### Dashboard Redesign

- [ ] **DASH-01**: Calendar view adapts to the planning window — one or two months visible at a time, with prev/next arrows to navigate when the window spans more
- [ ] **DASH-02**: Days outside the planning window are visually muted on the calendar
- [ ] **DASH-03**: DM sees a ranked best-day list alongside the calendar
- [ ] **DASH-04**: Each ranked date shows player count and names of unavailable players
- [ ] **DASH-05**: Share link, planning window dates, and delete campaign remain accessible on the dashboard but are visually de-emphasised (e.g. secondary section, collapsible, or tab)

### DM Availability Exceptions

- [ ] **DMEX-01**: DM can click calendar dates to mark themselves as unavailable for a campaign
- [ ] **DMEX-02**: DM can click a marked date again to remove the exception
- [ ] **DMEX-03**: DM-unavailable dates are visually distinct from player-unavailable dates
- [ ] **DMEX-04**: DM can toggle between "block" (removes date from rankings) and "flag" (shows warning badge)

### Shareable Best Dates

- [ ] **COPY-01**: DM can copy a formatted best-dates message from the campaign dashboard
- [ ] **COPY-02**: Copied message lists top 3 dates with day name, full date, and plain-English availability ("everyone free" / "3/4 free, Alex busy")

### Custom Date Picker

- [ ] **PICK-01**: Planning window fields use a custom themed date picker matching the app's visual style
- [ ] **PICK-02**: Custom picker replaces native date inputs in campaign creation and planning window update forms

## Future Requirements

Deferred to v1.4 or later. Tracked but not in current roadmap.

### DM Full Availability

- **DMAV-01**: DM can set recurring availability patterns (mirrors the player availability flow)

### Transparency

- **TRAN-01**: Players can see which dates the DM has marked as unavailable (requires UX/transparency decision)

### Sharing

- **SHAR-01**: Auto-send or email delivery of share messages (requires email infrastructure)

## Out of Scope

Explicitly excluded from v1.3.

| Feature | Reason |
|---------|--------|
| In-modal editing of the pre-written invite message | DMs can edit naturally in their chat app after pasting — in-app editing adds complexity for no gain |
| More than 3 dates in the "copy best dates" message | Decision paralysis in group chat — top 3 enforced; ranked list on dashboard shows more |
| Per-player colour coding in calendar | Aggregate fill intensity is clearer; per-player colours are already complex in the current view |
| DM recurring unavailability patterns | Full DM availability form mirrors player flow — high complexity, defer to v1.4 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SHARE-01 | Phase 12 | Pending |
| SHARE-02 | Phase 12 | Complete |
| SHARE-03 | Phase 12 | Complete |
| SHARE-04 | Phase 12 | Complete |
| SHARE-05 | Phase 12 | Pending |
| DASH-01 | Phase 14 | Pending |
| DASH-02 | Phase 14 | Pending |
| DASH-03 | Phase 14 | Pending |
| DASH-04 | Phase 14 | Pending |
| DASH-05 | Phase 14 | Pending |
| DMEX-01 | Phase 13 | Pending |
| DMEX-02 | Phase 13 | Pending |
| DMEX-03 | Phase 13 | Pending |
| DMEX-04 | Phase 13 | Pending |
| COPY-01 | Phase 15 | Pending |
| COPY-02 | Phase 15 | Pending |
| PICK-01 | Phase 16 | Pending |
| PICK-02 | Phase 16 | Pending |

**Coverage:**
- v1.3 requirements: 18 total
- Mapped to phases: 18 (complete)
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after roadmap creation*
