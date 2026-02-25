import { DayAggregation, computeBestDays, formatBestDayLabel } from '@/lib/availability'

interface BestDaysListProps {
  days: DayAggregation[]
  playerSlots: { id: string; name: string }[]
}

export function BestDaysList({ days, playerSlots }: BestDaysListProps) {
  const bestDays = computeBestDays(days)

  if (bestDays.length === 0) {
    return (
      <section>
        <h2 className="font-fantasy text-amber-400 text-xl mb-3">Best Days</h2>
        <p className="text-gray-500 text-sm">
          No availability data yet — waiting for players to submit their schedules.
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="font-fantasy text-amber-400 text-xl mb-3">Best Days</h2>
      <ul className="space-y-2">
        {bestDays.map((day, index) => {
          const rank = index + 1
          const dateLabel = formatBestDayLabel(day.date)
          const freePlayerNames = playerSlots
            .filter(slot => day.playerStatuses[slot.id] === 'free')
            .map(slot => slot.name)

          return (
            <li
              key={day.date}
              className="flex items-center gap-4 bg-gray-900 rounded-lg px-4 py-3"
            >
              <span className="text-amber-400 font-bold w-6 text-center">
                {rank}
              </span>
              <span className="font-medium text-gray-100">{dateLabel}</span>
              <span className="text-gray-400 text-sm">
                {day.freeCount}/{day.totalPlayers} players free
              </span>
              {freePlayerNames.length > 0 && (
                <span className="text-gray-400 text-sm">
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
