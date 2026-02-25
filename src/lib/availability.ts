export type PlayerDayStatus = 'free' | 'busy' | 'no-response'

export interface PlayerSlotWithEntries {
  id: string
  name: string
  availabilityEntries: {
    id: string
    type: string        // 'weekly' | 'override'
    dayOfWeek: number | null
    date: string | null // ISO string (already serialized from server component)
    timeOfDay: string | null
    status: string      // 'free' | 'busy'
  }[]
}

export interface DayAggregation {
  date: string              // 'YYYY-MM-DD'
  playerStatuses: Record<string, PlayerDayStatus>  // playerSlotId -> status
  freeCount: number
  totalPlayers: number
  allFree: boolean
}

function formatDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

/**
 * Resolve a single player's status on a given date.
 * Override beats weekly pattern; no-response when neither applies.
 * Players with zero total entries always return 'no-response'.
 */
export function resolvePlayerStatusOnDate(
  slot: PlayerSlotWithEntries,
  dateKey: string,
  dow: number,
): PlayerDayStatus {
  if (slot.availabilityEntries.length === 0) return 'no-response'

  // Check for override first (at most one per player/date per schema @@unique)
  const override = slot.availabilityEntries.find(e => {
    if (e.type !== 'override' || !e.date) return false
    const [y, m, d] = e.date.split('T')[0].split('-').map(Number)
    const entryDateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return entryDateKey === dateKey
  })

  if (override) {
    return override.status as PlayerDayStatus
  }

  // Fall back to weekly pattern
  const weeklyFree = slot.availabilityEntries.find(
    e => e.type === 'weekly' && e.dayOfWeek === dow && e.status === 'free'
  )

  return weeklyFree ? 'free' : 'no-response'
}

/**
 * Compute per-day aggregated availability for all player slots across the planning window.
 * Returns an empty array if either window bound is missing.
 */
export function computeDayStatuses(
  playerSlots: PlayerSlotWithEntries[],
  windowStart: string,
  windowEnd: string,
): DayAggregation[] {
  if (!windowStart || !windowEnd) return []

  const [sy, sm, sd] = windowStart.split('T')[0].split('-').map(Number)
  const [ey, em, ed] = windowEnd.split('T')[0].split('-').map(Number)

  const start = new Date(Date.UTC(sy, sm - 1, sd))
  const end = new Date(Date.UTC(ey, em - 1, ed))

  const result: DayAggregation[] = []
  const cursor = new Date(start)

  while (cursor <= end) {
    const dateKey = formatDateKey(cursor)
    const dow = cursor.getUTCDay()

    const playerStatuses: Record<string, PlayerDayStatus> = {}
    let freeCount = 0

    for (const slot of playerSlots) {
      // Players with zero total entries always show 'no-response'
      const status = slot.availabilityEntries.length === 0
        ? 'no-response'
        : resolvePlayerStatusOnDate(slot, dateKey, dow)

      playerStatuses[slot.id] = status
      if (status === 'free') freeCount++
    }

    result.push({
      date: dateKey,
      playerStatuses,
      freeCount,
      totalPlayers: playerSlots.length,
      allFree: freeCount === playerSlots.length && playerSlots.length > 0,
    })

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return result
}

/**
 * Return the top-5 days sorted by freeCount descending, then date ascending.
 * Days with no free players are excluded.
 */
export function computeBestDays(days: DayAggregation[]): DayAggregation[] {
  return [...days]
    .filter(d => d.freeCount > 0)
    .sort((a, b) => {
      if (b.freeCount !== a.freeCount) return b.freeCount - a.freeCount
      return a.date.localeCompare(b.date)  // ISO strings sort correctly
    })
    .slice(0, 5)
}

/**
 * Format a 'YYYY-MM-DD' date key to a human-readable label like 'Sat 8 Mar'.
 */
export function formatBestDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}
