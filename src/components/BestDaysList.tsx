'use client'

import { DayAggregation, computeBestDays, formatBestDayLabel, formatBestDatesMessage } from '@/lib/availability'
import { CopyBestDatesButton } from '@/components/CopyBestDatesButton'

interface BestDaysListProps {
  days: DayAggregation[]
  playerSlots: { id: string; name: string }[]
  dmExceptionMode?: 'block' | 'flag' | null
  /** Controlled selected date — set by parent */
  selectedDate: string | null
  /** Callback when a row is clicked */
  onSelectDate: (date: string) => void
}

export function BestDaysList({ days, playerSlots, dmExceptionMode, selectedDate, onSelectDate }: BestDaysListProps) {
  const bestDays = computeBestDays(days)

  // When mode is 'block': hide dmBlocked days from the ranked list
  const displayDays = dmExceptionMode === 'block'
    ? bestDays.filter(d => !d.dmBlocked)
    : bestDays

  const message = formatBestDatesMessage(days, playerSlots, dmExceptionMode ?? null)

  if (displayDays.length === 0) {
    return (
      <section>
        <h2 className="text-white font-semibold text-lg mb-2">Best Days</h2>
        <p className="text-gray-500 text-sm">
          No availability data yet — waiting for players to submit their schedules.
        </p>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-white font-semibold text-lg">Best Days</h2>
        <CopyBestDatesButton message={message} />
      </div>
      <ul className="space-y-2">
        {displayDays.map((day, index) => {
          const rank = index + 1
          const dateLabel = formatBestDayLabel(day.date)
          const isSelected = selectedDate === day.date

          return (
            <li key={day.date}>
              <button
                type="button"
                onClick={() => onSelectDate(day.date)}
                className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors cursor-pointer
                  ${isSelected
                    ? 'bg-purple-900/40 ring-1 ring-[var(--dnd-accent)]/50'
                    : 'bg-[#140326]/60 hover:bg-[#200d38]/80'}`}
              >
                {/* Rank */}
                <span className="text-white font-bold w-6 text-center shrink-0">{rank}</span>

                {/* Date */}
                <span className="font-medium text-gray-100 shrink-0">{dateLabel}</span>

                {/* DM busy badge */}
                {day.dmBlocked && dmExceptionMode === 'flag' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-700/40 shrink-0">
                    DM busy
                  </span>
                )}

                {/* Free count with hover tooltip */}
                <div className="relative group/free ml-auto shrink-0">
                  <span className="text-gray-500 text-sm whitespace-nowrap">
                    {day.freeCount}/{day.totalPlayers} free
                  </span>
                  {/* CSS-only hover tooltip — same pattern as calendar cells */}
                  <div className="absolute bottom-full right-0 mb-1 z-30
                    opacity-0 group-hover/free:opacity-100 transition-opacity pointer-events-none
                    bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200
                    whitespace-nowrap shadow-xl">
                    {playerSlots.map(slot => {
                      const status = day.playerStatuses[slot.id] ?? 'no-response'
                      return (
                        <div key={slot.id} className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0
                            ${status === 'free' ? 'bg-green-400' : 'bg-gray-500'}`}
                          />
                          <span>{slot.name}</span>
                          <span className="text-gray-500">
                            {status === 'free' ? 'Free' : 'No response'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
