---
phase: 03-availability
plan: 01
subsystem: backend
tags: [prisma, server-actions, typescript, availability, schema]

# Dependency graph
requires:
  - phase: 02-campaign
    provides: PlayerSlot model with id field for playerSlotId FK
provides:
  - saveWeeklyPattern Server Action: atomically replaces all weekly availability entries
  - toggleDateOverride Server Action: upserts or removes date-specific override entries
  - @@unique([playerSlotId, date]) constraint enabling Prisma upsert in toggleDateOverride
affects:
  - 03-02 (AvailabilityCalendar calls toggleDateOverride)
  - 03-03 (AvailabilityForm wires both actions via useDebouncedCallback and useTransition)

# Tech tracking
tech-stack:
  added:
    - use-debounce@10.1.0
  patterns:
    - "saveWeeklyPattern: delete-then-createMany in $transaction (no composite unique needed)"
    - "toggleDateOverride: upsert via playerSlotId_date accessor (requires @@unique)"
    - "Date.UTC(y, m-1, d) for timezone-safe ISO date string → Date object conversion"
    - "No revalidatePath in Server Actions — client manages optimistic state"

key-files:
  created:
    - src/lib/actions/availability.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Used $transaction([deleteMany, createMany]) for weekly pattern — simpler than upsert, avoids 3-field composite unique"
  - "toggleDateOverride accepts status: 'free' | 'busy' | null — null triggers delete (removes override)"
  - "Date.UTC used throughout to prevent timezone-shift when parsing YYYY-MM-DD strings"
  - "No revalidatePath calls in actions per RESEARCH.md pitfall #3 — avoids form state loss on save"

requirements-completed: [AVAIL-01, AVAIL-02, AVAIL-03]

# Metrics
duration: ~3min
completed: 2026-02-25
---

# Phase 3 Plan 01: Schema Migration + Server Actions Summary

**@@unique constraint added to AvailabilityEntry, use-debounce installed, saveWeeklyPattern and toggleDateOverride Server Actions implemented**

## Performance

- **Tasks:** 2
- **Files modified:** 4 (schema.prisma, availability.ts, package.json, package-lock.json)

## Accomplishments

- Added `@@unique([playerSlotId, date])` to `AvailabilityEntry` model and ran `prisma db push` + `prisma generate`
- Installed `use-debounce@10.1.0` (the only new dependency for this phase)
- Implemented `saveWeeklyPattern`: delete-all-then-createMany in a `$transaction` — atomically replaces weekly pattern
- Implemented `toggleDateOverride`: upserts or deletes override entries using the composite `playerSlotId_date` accessor; status `null` removes the override
- UTC-safe date parsing via `Date.UTC(y, m-1, d)` throughout to prevent timezone-shift bugs

## Task Commits

1. **Task 1: Schema migration and dependency install** - `4fbfc60` (chore)
2. **Task 2: Availability Server Actions** - `d233df3` (feat)

## Files Created/Modified

- `src/lib/actions/availability.ts` — saveWeeklyPattern + toggleDateOverride Server Actions
- `prisma/schema.prisma` — @@unique([playerSlotId, date]) on AvailabilityEntry

## Decisions Made

- delete-then-createMany strategy for weekly pattern (simpler than upsert with 3-field composite key)
- No revalidatePath in any action (client manages its own state for snappy auto-save UX)
- status: null as the "remove override" signal rather than a separate deleteOverride action

## Deviations from Plan

None.

## Issues Encountered

None.

## Self-Check: PASSED

---
*Phase: 03-availability*
*Completed: 2026-02-25*
