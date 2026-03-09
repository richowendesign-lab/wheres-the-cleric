// src/lib/calendarUtils.ts
// Shared calendar utility functions extracted from DashboardCalendar.tsx and AvailabilityCalendar.tsx.
// Both source copies were byte-for-byte identical.

/**
 * Build a 2D calendar grid for a given year/month.
 * month is 0-indexed (0=January), matching Date.getUTCMonth().
 * Returns an array of weeks; each week is an array of 7 cells.
 * Null cells are padding (days before the 1st or after the last of the month).
 */
export function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(Date.UTC(year, month, 1))
  const startDow = firstDay.getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(Date.UTC(year, month, i + 1))),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/**
 * Serialize a Date to a YYYY-MM-DD key string using UTC methods.
 * Always use this over date.toISOString().split('T')[0] — the ISO split
 * is timezone-unsafe when Date is in local time.
 */
export function formatDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}
