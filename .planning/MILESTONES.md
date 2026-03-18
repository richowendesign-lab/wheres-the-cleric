# Milestones

## v1.6 Campaign Detail Rework (Shipped: 2026-03-18)

**Phases completed:** 3 phases, 4 plans, 0 tasks

**Key accomplishments:**
- (none recorded)

---

## v1.5 Marketing Home Page (Shipped: 2026-03-14)

**Phases completed:** 5 phases, 9 plans
**Files modified:** 46 | **LOC:** +5,865 / -996 | **Timeline:** 2 days (2026-03-13 → 2026-03-14)

**Key accomplishments:**
- Full marketing landing page with sticky nav, hero, features step-selector, showcase, players section, FAQ accordion, CTA, and footer
- Interactive availability demos (DM dashboard + player view) with mock data, no auth required
- Progressive scroll-zoom animations with CSS @property beam border effect tied to viewport center
- "Built for Dungeon Masters" showcase section highlighting multi-campaign management and instant updates
- Shared AppNav component for authenticated pages with breadcrumb eyebrow on campaign detail
- FAQ accordion with 6 expandable questions and smooth grid-row animation

---

## v1.4 Clarity & Polish (Shipped: 2026-03-13)

**Phases completed:** 3 phases, 3 plans
**Files modified:** 20 | **LOC:** +2,217 / -80 | **Timeline:** 1 day (2026-03-13)

**Key accomplishments:**
- DM unavailable legend swatch appears in Group Availability calendar key when DM has marked dates — absent otherwise
- Clicking a DM-marked date in the calendar shows an exclamation-circle "DM unavailable" indicator in the date panel; consistent icon also added to Best Days cards ("DM unavailable" label replacing "DM busy")
- Date panel now shows a single clear "No players available this day." message when no players are free, instead of listing each player as "no response"
- "How it works" modal with visual numbered step cards (DM and player workflows) — native dialog element with full focus trap and Escape/backdrop dismiss
- How it works trigger wired into all four pages — icon-only ⓘ button grouped with logout on DM campaigns page; contextual link on home, join, and availability pages

---

## v1.3 DM Experience & Scheduling Flow (Shipped: 2026-03-12)

**Phases completed:** 6 phases, 14 plans
**Files modified:** 62 | **LOC:** +9,558 / -348 | **Timeline:** 17 days (2026-02-23 → 2026-03-12)

**Key accomplishments:**
- Post-creation share modal auto-appears after campaign creation with one-click link copy and pre-written invite message
- DM availability exceptions — click-to-toggle calendar marks DM-unavailable dates with block/flag mode persisted per campaign
- Dashboard redesign — adaptive paginated calendar (1-2 months), ranked best-day list alongside, campaign controls moved to Settings tab
- Shareable best dates — clipboard icon adjacent to Best Days title copies a formatted top-3 message ready to paste into group chat
- Custom date picker — hand-rolled themed picker (purple/dark D&D style) replaces native browser date inputs across all campaign forms, with typed date entry and keyboard month navigation

---

## v1.2 Multi-Campaign DM (Shipped: 2026-03-05)

**Phases completed:** 3 phases, 7 plans, 0 tasks

**Key accomplishments:**
- (none recorded)

---

## v1.1 Simplified Onboarding (Shipped: 2026-03-02)

**Phases completed:** 3 phases, 8 plans
**Files modified:** 40 | **LOC:** +3,053 / -241 | **Timeline:** 4 days (2026-02-27 → 2026-03-02)

**Key accomplishments:**
- v1.1 schema live — joinToken + dmSecret on Campaign, inviteToken removed from PlayerSlot, all v1.0 data wiped
- Date-range-only campaign creation — DM enters only start/end dates, no name or player name fields
- Single shareable join link displayed on dashboard immediately after campaign creation
- DM cookie (dm_secret) persists identity — returning DM auto-redirected to dashboard from home page
- Smart join page (/join/[joinToken]) routes new visitors to name form, returning players to availability, DM to dashboard
- Player availability page (/join/[joinToken]/availability) wired to AvailabilityForm with cookie guard and cross-campaign defence

---

## v1.0 MVP (Shipped: 2026-02-26)

**Phases completed:** 4 phases, 14 plans, 0 tasks

**Key accomplishments:**
- (none recorded)

---

