'use client'

import { useState } from 'react'
import { DayAggregation } from '@/lib/availability'
import { buildMonthGrid, formatDateKey } from '@/lib/calendarUtils'

interface DashboardCalendarProps {
  dayAggregations: DayAggregation[]
  playerSlots: { id: string; name: string }[]
  windowStart: string  // 'YYYY-MM-DD'
  windowEnd: string    // 'YYYY-MM-DD'
  /** Controlled selected date — set by parent */
  selectedDate: string | null
  /** Callback when a date cell is clicked */
  onSelectDate: (date: string | null) => void
}

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function DashboardCalendar({
  dayAggregations,
  playerSlots,
  windowStart,
  windowEnd,
  selectedDate,
  onSelectDate,
}: DashboardCalendarProps) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)

  // Empty state — no planning window set
  if (dayAggregations.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        Set a planning window to see the availability grid.
      </p>
    )
  }

  // Build O(1) lookup map from dateKey -> DayAggregation
  const aggMap = new Map<string, DayAggregation>()
  for (const agg of dayAggregations) {
    aggMap.set(agg.date, agg)
  }

  // Build list of months to render
  const windowStartDate = new Date(windowStart)
  const windowEndDate = new Date(windowEnd)

  const months: { year: number; month: number }[] = []
  let y = windowStartDate.getUTCFullYear()
  let mo = windowStartDate.getUTCMonth()
  const endYear = windowEndDate.getUTCFullYear()
  const endMonth = windowEndDate.getUTCMonth()
  while (y < endYear || (y === endYear && mo <= endMonth)) {
    months.push({ year: y, month: mo })
    mo++
    if (mo > 11) { mo = 0; y++ }
  }

  const showNav = months.length > 2
  const displayedMonths = months.slice(currentMonthIndex, currentMonthIndex + 2)
  const canGoPrev = currentMonthIndex > 0
  const canGoNext = currentMonthIndex + 2 < months.length

  return (
    <div className="rounded-lg bg-[#140326]/60 p-4">
      {showNav && (
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setCurrentMonthIndex(i => Math.max(0, i - 2))}
            disabled={!canGoPrev}
            className="p-1.5 rounded text-[var(--dnd-text-muted)] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous months"
          >
            &#8592;
          </button>
          <span className="text-xs text-gray-400">
            {displayedMonths.map(({ year, month }) =>
              new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
            ).join(' – ')}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonthIndex(i => Math.min(months.length - 2, i + 2))}
            disabled={!canGoNext}
            className="p-1.5 rounded text-[var(--dnd-text-muted)] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            aria-label="Next months"
          >
            &#8594;
          </button>
        </div>
      )}
      <div className={displayedMonths.length > 1 ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
        {displayedMonths.map(({ year, month }) => {
          const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-GB', {
            month: 'long', year: 'numeric', timeZone: 'UTC',
          })
          const grid = buildMonthGrid(year, month)

          return (
            <div key={`${year}-${month}`}>
              <p className="text-sm font-semibold text-gray-200 mb-2">{monthLabel}</p>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAY_HEADERS.map((h, i) => (
                  <div key={i} className="text-xs text-gray-500 text-center py-1">{h}</div>
                ))}
              </div>
              <div className="space-y-0.5">
                {grid.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-0.5">
                    {week.map((date, di) => {
                      if (!date) return <div key={di} />

                      const dateKey = formatDateKey(date)
                      const agg = aggMap.get(dateKey)

                      // Dates outside the planning window: non-interactive, muted
                      const dateUTC = date.getTime()
                      const startUTC = windowStartDate.getTime()
                      const endUTC = windowEndDate.getTime()
                      const isOutside = dateUTC < startUTC || dateUTC > endUTC

                      if (isOutside) {
                        return (
                          <div key={di} className="text-gray-700 text-sm text-center py-1.5 leading-none">
                            {date.getUTCDate()}
                          </div>
                        )
                      }

                      const isSelected = selectedDate === dateKey

                      return (
                        <div key={di} className="relative group">
                          <button
                            type="button"
                            onClick={() => onSelectDate(isSelected ? null : dateKey)}
                            className={`w-full rounded-md py-1.5 text-sm text-center transition-colors leading-none cursor-pointer
                              ${agg?.allFree
                                ? 'bg-green-800/60 hover:bg-green-700/60 text-gray-100'
                                : 'text-gray-400 hover:bg-gray-800'}
                              ${agg?.dmBlocked ? 'ring-1 ring-amber-400/60' : ''}
                              ${isSelected ? 'ring-2 ring-[var(--dnd-accent)]' : ''}`}
                          >
                            <span className="block">{date.getUTCDate()}</span>
                            {/* Player dots — one per player */}
                            <div className="flex justify-center gap-0.5 mt-0.5">
                              {playerSlots.map(slot => {
                                const status = agg?.playerStatuses[slot.id] ?? 'no-response'
                                return (
                                  <span
                                    key={slot.id}
                                    className={`w-1.5 h-1.5 rounded-full inline-block
                                      ${status === 'free' ? 'bg-green-400' : 'bg-gray-600'}`}
                                  />
                                )
                              })}
                            </div>
                          </button>

                          {/* Hover tooltip — CSS only, no JS state */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10
                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                            bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200
                            whitespace-nowrap shadow-xl min-w-max">
                            {playerSlots.map(slot => {
                              const status = agg?.playerStatuses[slot.id] ?? 'no-response'
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
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
