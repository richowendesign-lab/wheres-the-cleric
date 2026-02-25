'use client'

interface AvailabilityCalendarProps {
  planningWindowStart: string
  planningWindowEnd: string
  weeklySelection: Set<string>
  overrides: Map<string, 'free' | 'busy'>
  onDateClick: (dateKey: string) => void
}

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
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

function formatDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

type CellState = 'outside-window' | 'free-pattern' | 'free-override' | 'not-selected'

function getCellState(
  date: Date,
  windowStart: Date,
  windowEnd: Date,
  weeklySelection: Set<string>,
  overrides: Map<string, 'free' | 'busy'>
): CellState {
  const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const startUTC = new Date(Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth(), windowStart.getUTCDate()))
  const endUTC = new Date(Date.UTC(windowEnd.getUTCFullYear(), windowEnd.getUTCMonth(), windowEnd.getUTCDate()))

  if (dateUTC < startUTC || dateUTC > endUTC) return 'outside-window'

  const dateKey = formatDateKey(date)
  const override = overrides.get(dateKey)
  if (override === 'free') return 'free-override'

  const dow = date.getUTCDay()
  const isPatternFree = Array.from(weeklySelection).some(k => k.startsWith(`${dow}-`))
  return isPatternFree ? 'free-pattern' : 'not-selected'
}

export function AvailabilityCalendar({
  planningWindowStart,
  planningWindowEnd,
  weeklySelection,
  overrides,
  onDateClick,
}: AvailabilityCalendarProps) {
  const windowStart = new Date(planningWindowStart)
  const windowEnd = new Date(planningWindowEnd)

  const months: { year: number; month: number }[] = []
  let y = windowStart.getUTCFullYear()
  let m = windowStart.getUTCMonth()
  const endYear = windowEnd.getUTCFullYear()
  const endMonth = windowEnd.getUTCMonth()
  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push({ year: y, month: m })
    m++
    if (m > 11) { m = 0; y++ }
  }

  return (
    <div className="space-y-6">
      {months.map(({ year, month }) => {
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

                    const state = getCellState(date, windowStart, windowEnd, weeklySelection, overrides)
                    const dateKey = formatDateKey(date)

                    // Pattern-free dates are already free — not clickable via calendar
                    // Override-free and not-selected dates are clickable
                    const isClickable = state === 'not-selected' || state === 'free-override'

                    const cellClass =
                      state === 'outside-window' ? 'text-gray-700 cursor-default' :
                      state === 'free-pattern'   ? 'bg-amber-900/40 text-amber-200 cursor-default' :
                      state === 'free-override'  ? 'bg-amber-500/60 text-amber-100 ring-1 ring-amber-400 cursor-pointer hover:bg-amber-500/80' :
                      /* not-selected */            'text-gray-500 cursor-pointer hover:bg-gray-800'

                    return (
                      <button
                        key={di}
                        type="button"
                        disabled={!isClickable}
                        onClick={isClickable ? () => onDateClick(dateKey) : undefined}
                        className={`rounded-md text-sm text-center py-1.5 transition-colors leading-none ${cellClass}`}
                      >
                        {date.getUTCDate()}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-amber-900/40" />
          Free (weekly pattern)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-amber-500/60 ring-1 ring-amber-400" />
          Free (exception added)
        </span>
      </div>
    </div>
  )
}
