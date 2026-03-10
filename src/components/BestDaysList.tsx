import { DayAggregation, computeBestDays, formatBestDayLabel } from '@/lib/availability'

interface BestDaysListProps {
  days: DayAggregation[]
  playerSlots: { id: string; name: string }[]
  dmExceptionMode?: 'block' | 'flag' | null  // new optional prop
}

export function BestDaysList({ days, playerSlots, dmExceptionMode }: BestDaysListProps) {
  const bestDays = computeBestDays(days)

  // When mode is 'block': hide dmBlocked days from the ranked list
  const displayDays = dmExceptionMode === 'block'
    ? bestDays.filter(d => !d.dmBlocked)
    : bestDays

  if (displayDays.length === 0) {
    return (
      <section>
        <h2 className="text-white font-semibold text-lg mb-2">Best Days</h2>
        <p className="text-muted text-sm">
          No availability data yet — waiting for players to submit their schedules.
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-white font-semibold text-lg mb-2">Best Days</h2>
      <ul className="space-y-2">
        {displayDays.map((day, index) => {
          const rank = index + 1
          const dateLabel = formatBestDayLabel(day.date)
          const freePlayerNames = playerSlots
            .filter(slot => day.playerStatuses[slot.id] === 'free')
            .map(slot => slot.name)

          return (
            <li
              key={day.date}
              className="flex items-center gap-4 bg-[#140326]/60 rounded-lg px-4 py-3"
            >
              <span className="text-white font-bold w-6 text-center">
                {rank}
              </span>
              <span className="font-medium text-gray-100">{dateLabel}</span>
              {day.dmBlocked && dmExceptionMode === 'flag' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-700/40">
                  DM busy
                </span>
              )}
              <span className="text-muted text-sm">
                {day.freeCount}/{day.totalPlayers} players free
              </span>
              {freePlayerNames.length > 0 && (
                <span className="text-muted text-sm">
                  ({freePlayerNames.join(', ')})
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
