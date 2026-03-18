'use client'

import { useState } from 'react'
import { toggleDmException, setDmExceptionMode } from '@/lib/actions/campaign'
import { buildMonthGrid, formatDateKey } from '@/lib/calendarUtils'
import { Toast, SaveStatus } from '@/components/Toast'

interface DmExceptionCalendarProps {
  campaignId: string
  planningWindowStart: string  // 'YYYY-MM-DD'
  planningWindowEnd: string    // 'YYYY-MM-DD'
  initialExceptions: string[]  // 'YYYY-MM-DD' array
  exceptionMode: 'block' | 'flag' | null
}

type CellState = 'outside-window' | 'dm-blocked' | 'normal'

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getCellState(
  date: Date,
  windowStart: Date,
  windowEnd: Date,
  exceptions: Set<string>
): CellState {
  const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  if (dateUTC < windowStart || dateUTC > windowEnd) return 'outside-window'
  const dateKey = formatDateKey(date)
  return exceptions.has(dateKey) ? 'dm-blocked' : 'normal'
}

export function DmExceptionCalendar({
  campaignId,
  planningWindowStart,
  planningWindowEnd,
  initialExceptions,
  exceptionMode,
}: DmExceptionCalendarProps) {
  const [exceptions, setExceptions] = useState<Set<string>>(() => new Set(initialExceptions))
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [mode, setMode] = useState<'block' | 'flag'>(exceptionMode ?? 'block')
  const [modeStatus, setModeStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)

  function handleDateClick(dateKey: string) {
    const isCurrentlyBlocked = exceptions.has(dateKey)
    const prevExceptions = exceptions                    // save for rollback
    const newExceptions = new Set(exceptions)
    if (isCurrentlyBlocked) newExceptions.delete(dateKey)
    else newExceptions.add(dateKey)

    setExceptions(newExceptions)   // optimistic update
    setSaveStatus('saving')

    toggleDmException(campaignId, dateKey, !isCurrentlyBlocked)
      .then(result => {
        if ('error' in result) {
          setSaveStatus('error')
          setExceptions(prevExceptions)  // rollback
        } else {
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
      })
      .catch(() => {
        setSaveStatus('error')
        setExceptions(prevExceptions)  // rollback
      })
  }

  function handleModeChange(newMode: 'block' | 'flag') {
    if (newMode === mode) return
    const prevMode = mode

    setMode(newMode)   // optimistic update
    setModeStatus('saving')

    setDmExceptionMode(campaignId, newMode)
      .then(result => {
        if ('error' in result) {
          setModeStatus('error')
          setMode(prevMode)  // rollback
        } else {
          setModeStatus('saved')
          setTimeout(() => setModeStatus('idle'), 2000)
        }
      })
      .catch(() => {
        setModeStatus('error')
        setMode(prevMode)  // rollback
      })
  }

  // Build list of months to render
  const windowStartDate = new Date(planningWindowStart)
  const windowEndDate = new Date(planningWindowEnd)

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
    <div>
      {/* Calendar grid */}
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
              onClick={() => setCurrentMonthIndex(i => i + 2)}
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

                        const cellState = getCellState(date, windowStartDate, windowEndDate, exceptions)
                        const dateKey = formatDateKey(date)

                        if (cellState === 'outside-window') {
                          return (
                            <div key={di} className="text-gray-700 text-sm text-center py-1.5 leading-none">
                              {date.getUTCDate()}
                            </div>
                          )
                        }

                        return (
                          <button
                            key={di}
                            type="button"
                            onClick={() => handleDateClick(dateKey)}
                            className={`w-full text-sm text-center py-1.5 leading-none
                              ${cellState === 'dm-blocked'
                                ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/50 cursor-pointer hover:opacity-70 transition-opacity rounded-md'
                                : 'text-gray-500 cursor-pointer hover:bg-amber-500/10 hover:text-amber-400 transition-colors rounded-md'
                              }`}
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
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-amber-500/20 ring-1 ring-amber-400/50" />
          DM unavailable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-gray-800" />
          Available
        </span>
      </div>

      {/* Mode toggle — below legend, close to sync toggle */}
      <div className="mt-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={mode === 'block'}
            onClick={() => handleModeChange(mode === 'block' ? 'flag' : 'block')}
            disabled={modeStatus === 'saving'}
            className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dnd-accent)] disabled:opacity-60 ${
              mode === 'block' ? 'bg-[var(--dnd-accent)]' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${
                mode === 'block' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-base text-gray-300 select-none">
            {mode === 'block'
              ? 'Exclude from Best Days'
              : 'Show as busy in Best Days'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2 ml-14">
          When I mark a date as unavailable
        </p>
      </div>

      <Toast
        status={saveStatus}
        onRetry={() => setSaveStatus('idle')}
        onDismiss={() => setSaveStatus('idle')}
      />
    </div>
  )
}
