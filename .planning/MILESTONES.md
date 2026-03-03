# Milestones

## v1.1 Simplified Onboarding (Shipped: 2026-03-02)

**Phases completed:** 3 phases, 8 plans
**Files modified:** 40 | **LOC:** +3,053 / -241 | **Timeline:** 4 days (2026-02-27 → 2026-03-02)

**Key accomplishments:**
- v1.1 schema live — `joinToken` + `dmSecret` on Campaign, `inviteToken` removed from PlayerSlot, all v1.0 data wiped
- Date-range-only campaign creation — DM enters only start/end dates, no name or player name fields
- Single shareable join link displayed on dashboard immediately after campaign creation
- DM cookie (`dm_secret`) persists identity — returning DM auto-redirected to dashboard from home page
- Smart join page (`/join/[joinToken]`) routes new visitors to name form, returning players to availability, DM to dashboard
- Player availability page (`/join/[joinToken]/availability`) wired to AvailabilityForm with cookie guard and cross-campaign defence

---

## v1.0 MVP (Shipped: 2026-02-26)

**Phases completed:** 4 phases, 14 plans, 0 tasks

**Key accomplishments:**
- (none recorded)

---

