# Phase 14: Dashboard Redesign — Context

## Decisions Captured

### Layout: Tabs (Availability / Settings)
Two tabs at the top of the campaign page.
- **Availability tab** (default, shown on load)
- **Settings tab** (join link, planning window, delete campaign)

This satisfies DASH-05: campaign details are accessible but de-emphasised — they're one tab click away, never in the critical path.

### Section order inside Availability tab
1. **Group Availability** (DashboardCalendar + BestDaysList) — the hero section
2. **DM Availability Exceptions** (DmExceptionCalendar) — below the calendar

Rationale: Calendar is the primary output. DM exceptions are an input that refines it, so they sit beneath. Cause-and-effect reads naturally: see result → adjust DM availability.

### Awaiting Response
Remains in the Availability tab, above the calendar (current position relative to calendar is preserved).

### Campaign Settings tab contents
- Join Link (read-only + copy) + UpdateMaxPlayersForm
- Planning Window (UpdatePlanningWindowForm)
- Danger Zone (DeleteCampaignButton)

---

## Requirements to Satisfy

| ID | Requirement | Notes |
|----|-------------|-------|
| DASH-01 | Calendar adapts to planning window with prev/next month arrows | Multi-month windows get navigation; single-month has no arrows |
| DASH-02 | Days outside planning window visually muted | Already partially there; confirm styling |
| DASH-03 | Ranked best-day list alongside calendar | Already exists as BestDaysList; confirm it's correct |
| DASH-04 | Ranked list shows player count + unavailable names per entry | Already in BestDaysList; confirm |
| DASH-05 | Join link / planning window / delete accessible but de-emphasised | → Settings tab |

---

## Implementation Scope

### New: Tab UI component or pattern
- Client component needed for tab state (Availability / Settings)
- Could be a simple controlled toggle — no routing needed (no URL change on tab switch, unless we want deep-linking)
- Recommendation: simple `useState` toggle, no URL-based routing (Settings is rarely visited)

### Modified: DashboardCalendar — add prev/next navigation
- Currently renders all months in the planning window
- Add `currentMonthIndex` state, prev/next buttons
- Show 1 or 2 months at a time (single month on mobile, 2-up on large screens if planning window ≥ 2 months)
- Hide prev/next if only 1 month in window

### Modified: campaigns/[id]/page.tsx
- Wrap page content in tab structure
- Move Join Link, Planning Window, Delete into Settings tab
- Move DmExceptionCalendar below DashboardCalendar + BestDaysList in Availability tab

---

## What Stays the Same
- DashboardCalendar internals (day cell rendering, dmBlocked ring, click behaviour)
- BestDaysList internals
- DmExceptionCalendar internals (UX refinement is explicitly deferred)
- All server actions and data fetching
- All Prisma queries
