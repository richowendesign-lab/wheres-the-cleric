'use client'

import { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { saveWeeklyPattern, toggleDateOverride } from '@/lib/actions/availability'
import { WeeklySchedule } from './WeeklySchedule'
import { AvailabilityCalendar } from './AvailabilityCalendar'

interface AvailabilityFormProps {
  playerSlotId: string
  planningWindowStart: string
  planningWindowEnd: string
  initialEntries: Array<{
    id: string
    type: string
    dayOfWeek: number | null
    date: string | null
    timeOfDay: string | null
    status: string
  }>
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function Toast({
  status,
  onRetry,
  onDismiss,
}: {
  status: SaveStatus
  onRetry: () => void
  onDismiss: () => void
}) {
  const visible = status === 'saved' || status === 'error'
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      } ${status === 'saved' ? 'bg-green-800 text-green-100' : 'bg-red-900/90 text-red-100'}`}
    >
      {status === 'saved' && <span>Availability saved</span>}
      {status === 'error' && (
        <>
          <span>Couldn&apos;t save</span>
          <button className="underline hover:text-red-300 cursor-pointer" onClick={onRetry}>
            Retry
          </button>
          <button
            aria-label="Dismiss"
            className="ml-1 opacity-70 hover:opacity-100 cursor-pointer"
            onClick={onDismiss}
          >
            ✕
          </button>
        </>
      )}
    </div>
  )
}

export function AvailabilityForm({
  playerSlotId,
  planningWindowStart,
  planningWindowEnd,
  initialEntries,
}: AvailabilityFormProps) {
  // Derive initial weekly selection — keys are just the day-number string ("0"–"6")
  const initialWeeklySelection = new Set(
    initialEntries
      .filter(e => e.type === 'weekly' && e.dayOfWeek !== null)
      .map(e => String(e.dayOfWeek))
  )

  // Derive initial overrides
  const initialOverrides = new Map<string, 'free' | 'busy'>(
    initialEntries
      .filter(e => e.type === 'override' && e.date !== null)
      .map(e => {
        const d = new Date(e.date!)
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
        return [key, e.status as 'free' | 'busy']
      })
  )

  const [weeklySelection, setWeeklySelection] = useState<Set<string>>(initialWeeklySelection)
  const [overrides, setOverrides] = useState<Map<string, 'free' | 'busy'>>(initialOverrides)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const debouncedSaveWeekly = useDebouncedCallback(
    async (selection: Set<string>) => {
      setSaveStatus('saving')
      const entries = Array.from(selection).map(key => ({ dayOfWeek: Number(key) }))
      try {
        const result = await saveWeeklyPattern(playerSlotId, entries)
        if ('error' in result) {
          setSaveStatus('error')
        } else {
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
      } catch {
        setSaveStatus('error')
      }
    },
    600
  )

  useEffect(() => {
    return () => { debouncedSaveWeekly.flush() }
  }, [debouncedSaveWeekly])

  function handleWeeklyChange(newSelection: Set<string>) {
    setWeeklySelection(new Set(newSelection))
    debouncedSaveWeekly(newSelection)
  }

  function handleDateClick(dateKey: string) {
    const current = overrides.get(dateKey)
    let newStatus: 'free' | 'busy' | null

    if (current === 'free') {
      newStatus = null
    } else if (current === 'busy') {
      newStatus = null
    } else {
      const [y, m, d] = dateKey.split('-').map(Number)
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
      const isPatternFree = weeklySelection.has(String(dow))
      newStatus = isPatternFree ? 'busy' : 'free'
    }

    const prevOverrides = overrides
    const newOverrides = new Map(overrides)
    if (newStatus === null) newOverrides.delete(dateKey)
    else newOverrides.set(dateKey, newStatus)
    setOverrides(newOverrides)
    setSaveStatus('saving')

    toggleDateOverride(playerSlotId, dateKey, newStatus)
      .then(result => {
        if ('error' in result) {
          setSaveStatus('error')
          setOverrides(prevOverrides)
        } else {
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
      })
      .catch(() => {
        setSaveStatus('error')
        setOverrides(prevOverrides)
      })
  }

  const hasCalendar = Boolean(planningWindowStart && planningWindowEnd)

  return (
    <div className="space-y-8">
      <Toast
        status={saveStatus}
        onRetry={() => debouncedSaveWeekly.flush()}
        onDismiss={() => setSaveStatus('idle')}
      />

      <div>
        <h2 className="text-amber-400 font-semibold text-lg mb-1">Quick-select your usual days</h2>
        <p className="text-sm text-gray-400 mb-4">Toggle the days you&apos;re generally free — these will pre-fill the calendar below.</p>
        <WeeklySchedule selection={weeklySelection} onChange={handleWeeklyChange} />
      </div>

      {hasCalendar && (
        <div>
          <h2 className="text-amber-400 font-semibold text-lg mb-1">Select available dates</h2>
          <p className="text-sm text-gray-400 mb-4">Your weekly pattern is pre-filled. Click any date to add or remove it.</p>
          <AvailabilityCalendar
            planningWindowStart={planningWindowStart}
            planningWindowEnd={planningWindowEnd}
            weeklySelection={weeklySelection}
            overrides={overrides}
            onDateClick={handleDateClick}
          />
        </div>
      )}
    </div>
  )
}
