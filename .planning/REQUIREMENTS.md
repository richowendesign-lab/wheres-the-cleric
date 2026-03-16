# Requirements: D&D Session Planner

**Defined:** 2026-03-16
**Core Value:** The DM can instantly see when everyone is free — without chasing people for responses or guessing which dates to offer.

## v1.6 Requirements

Requirements for v1.6 Campaign Detail Rework. Each maps to roadmap phases.

### Layout

- [ ] **LAYOUT-01**: DM sees a two-column Availability tab — large calendar on the left, persistent sidebar on the right
- [ ] **LAYOUT-02**: Sidebar shows the Best Days list and a copyable join link
- [ ] **LAYOUT-03**: Clicking a date overlays the sidebar with a player breakdown for that date; closing returns to Best Days + join link

### Settings

- [ ] **SET-01**: Settings tab displays all options in a flat, visually grouped layout without stacked accordions
- [ ] **SET-02**: Join Link section removed from Settings (accessible from Availability sidebar instead)

### Sync

- [ ] **SYNC-01**: DM marking a date unavailable in one campaign automatically marks it in all their other sync-enabled campaigns
- [ ] **SYNC-02**: DM removing an unavailable date in one campaign removes it from all their other sync-enabled campaigns
- [ ] **SYNC-03**: Each campaign has a "Sync DM availability" toggle in Settings (on by default); turning it off makes that campaign's exceptions independent
- [ ] **SYNC-04**: Re-enabling sync does not backfill existing exceptions — only future toggles propagate

## Future Requirements

None identified for v1.7+.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Retroactive sync backfill on toggle-on | Unpredictable for DMs with diverged exceptions — forward-only is clearest |
| Sync the block/flag mode across campaigns | Each campaign has a different player set; mode choice is campaign-specific |
| Exception mode sync | Mode (block/flag) is independent per campaign — only dates propagate |
| Mobile-specific layout changes | Desktop-first scope; mobile graceful degradation not a v1.6 requirement |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SYNC-01 | Phase 25 | In progress (schema done; logic in 25-02) |
| SYNC-02 | Phase 25 | In progress (schema done; logic in 25-02) |
| SYNC-04 | Phase 25 | In progress (schema done; logic in 25-02) |
| LAYOUT-01 | Phase 26 | Pending |
| LAYOUT-02 | Phase 26 | Pending |
| LAYOUT-03 | Phase 26 | Pending |
| SET-02 | Phase 26 | Pending |
| SET-01 | Phase 27 | Pending |
| SYNC-03 | Phase 27 | Pending |

**Coverage:**
- v1.6 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 — SYNC-01/02/04 in progress after 25-01 schema migration*
