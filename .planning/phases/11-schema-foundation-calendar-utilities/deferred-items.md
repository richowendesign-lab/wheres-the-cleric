# Deferred Items — Phase 11

## Pre-existing TypeScript errors (out of scope for 11-01)

These errors existed before Plan 11-01 and are unrelated to the schema changes.

### src/components/AvailabilityCalendar.tsx
- TS2440: Import declaration conflicts with local declaration of 'buildMonthGrid'
- TS2440: Import declaration conflicts with local declaration of 'formatDateKey'
- Likely caused by Plan 11-02 (calendarUtils extraction) partially applied or an import conflict

### src/components/DeleteCampaignButton.tsx
- TS2322: Type 'Promise<{ error: string; }>' is not assignable to type 'VoidOrUndefinedOnly | Promise<VoidOrUndefinedOnly>'
- Server action return type mismatch

**These should be addressed in subsequent plans where these files are modified.**
