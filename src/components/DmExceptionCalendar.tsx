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

  function handleModeToggle() {
    const newMode = mode === 'block' ? 'flag' : 'block'
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

  return (
    <section>
      <h2 className="text-lg font-semibold text-white mb-3">My Unavailable Dates</h2>

      {/* Mode toggle */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-gray-400">Blocked dates:</span>
        <button
          type="button"
          onClick={handleModeToggle}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            mode === 'block'
              ? 'bg-red-900/40 border-red-700/50 text-red-300'
              : 'bg-amber-900/30 border-amber-700/40 text-amber-300'
          }`}
        >
          {mode === 'block' ? 'Exclude from Best Days' : 'Show as busy in Best Days'}
        </button>
        {modeStatus === 'saving' && <span className="text-xs text-gray-500">Saving...</span>}
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg bg-[#140326]/60 p-4">
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

      <Toast
        status={saveStatus}
        onRetry={() => setSaveStatus('idle')}
        onDismiss={() => setSaveStatus('idle')}
      />
    </section>
  )
}
