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
        {bestDays.map((day, index) => {
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
