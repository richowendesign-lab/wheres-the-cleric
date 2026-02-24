'use client'

interface AvailabilityCalendarProps {
  planningWindowStart: string // ISO string from server, e.g. "2026-03-01T00:00:00.000Z"
  planningWindowEnd: string   // ISO string from server
  // weeklySelection: Set<string> — same format as WeeklySchedule ("1-morning" etc)
  weeklySelection: Set<string>
  // overrides: map of ISO date string "YYYY-MM-DD" -> "free" | "busy"
  overrides: Map<string, 'free' | 'busy'>
  onDateClick: (dateKey: string) => void // dateKey = "YYYY-MM-DD"
}

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * Builds a month grid of (Date | null) rows, each row having 7 cells.
 * Null cells are padding before the first day and after the last day.
 * All Date objects are in UTC.
 */
function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  // First day of month
  const firstDay = new Date(Date.UTC(year, month, 1))
  const startDow = firstDay.getUTCDay() // 0=Sun

  // Days in month
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      new Date(Date.UTC(year, month, i + 1))
    ),
  ]

  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  // Split into rows of 7
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

function formatDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

type CellState =
  | 'outside-window'
  | 'pattern-free'
  | 'pattern-busy'
  | 'override-free'
  | 'override-busy'

function getCellState(
  date: Date,
  windowStart: Date,
  windowEnd: Date,
  weeklySelection: Set<string>,
  overrides: Map<string, 'free' | 'busy'>
): CellState {
  // Compare using UTC date boundaries (start of day)
  const dateUTCMidnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const startUTCMidnight = new Date(Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth(), windowStart.getUTCDate()))
  const endUTCMidnight = new Date(Date.UTC(windowEnd.getUTCFullYear(), windowEnd.getUTCMonth(), windowEnd.getUTCDate()))

  if (dateUTCMidnight < startUTCMidnight || dateUTCMidnight > endUTCMidnight) {
    return 'outside-window'
  }

  const dateKey = formatDateKey(date)
  const override = overrides.get(dateKey)
  if (override === 'free') return 'override-free'
  if (override === 'busy') return 'override-busy'

  // Check weekly pattern: any "{dow}-*" key in selection means this day is free
  const dow = date.getUTCDay()
  const hasWeeklyFree = Array.from(weeklySelection).some(k => k.startsWith(`${dow}-`))
  return hasWeeklyFree ? 'pattern-free' : 'pattern-busy'
}

const CELL_STATE_CLASSES: Record<CellState, string> = {
  'outside-window': 'text-gray-700 cursor-default',
  'pattern-free': 'bg-amber-900/40 text-amber-200 cursor-pointer hover:bg-amber-800/50',
  'pattern-busy': 'text-gray-500 cursor-pointer hover:bg-gray-800',
  'override-free': 'bg-green-800 text-green-200 ring-1 ring-green-500 cursor-pointer hover:bg-green-700',
  'override-busy': 'bg-red-900 text-red-300 ring-1 ring-red-700 cursor-pointer hover:bg-red-800',
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

  // Determine the range of months to display
  const startYear = windowStart.getUTCFullYear()
  const startMonth = windowStart.getUTCMonth()
  const endYear = windowEnd.getUTCFullYear()
  const endMonth = windowEnd.getUTCMonth()

  // Build list of {year, month} entries to render
  const months: { year: number; month: number }[] = []
  let y = startYear
  let m = startMonth
  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push({ year: y, month: m })
    m++
    if (m > 11) {
      m = 0
      y++
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-400 uppercase tracking-widest mb-3">Date Exceptions</p>
      <p className="text-xs text-gray-500 mb-4">
        Click a date to mark it as busy or free, overriding your weekly pattern. Click again to cycle through states.
      </p>

      <div className="space-y-6">
        {months.map(({ year, month }) => {
          const headerDate = new Date(Date.UTC(year, month, 1))
          const monthLabel = headerDate.toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          })
          const grid = buildMonthGrid(year, month)

          return (
            <div key={`${year}-${month}`}>
              {/* Month header */}
              <p className="text-sm font-semibold text-gray-200 mb-2">{monthLabel}</p>

              {/* Day-of-week header row */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAY_HEADERS.map((h, i) => (
                  <div key={i} className="text-xs text-gray-500 text-center py-1">
                    {h}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="space-y-0.5">
                {grid.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-0.5">
                    {week.map((date, di) => {
                      if (!date) {
                        // Empty padding cell
                        return <div key={di} />
                      }

                      const state = getCellState(
                        date,
                        windowStart,
                        windowEnd,
                        weeklySelection,
                        overrides
                      )
                      const isClickable = state !== 'outside-window'
                      const dateKey = formatDateKey(date)

                      return (
                        <button
                          key={di}
                          type="button"
                          disabled={!isClickable}
                          onClick={isClickable ? () => onDateClick(dateKey) : undefined}
                          className={`rounded-md text-sm text-center py-1.5 transition-colors leading-none ${CELL_STATE_CLASSES[state]}`}
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
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-amber-900/40 ring-1 ring-amber-700/30" />
          Free (pattern)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-green-800 ring-1 ring-green-500" />
          Free (override)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-red-900 ring-1 ring-red-700" />
          Busy (override)
        </span>
      </div>
    </div>
  )
}
