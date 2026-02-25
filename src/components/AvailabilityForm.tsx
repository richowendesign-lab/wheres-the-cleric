'use client'

import { useState, useTransition, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { saveWeeklyPattern, toggleDateOverride } from '@/lib/actions/availability'
import { WeeklySchedule } from './WeeklySchedule'
import { AvailabilityCalendar } from './AvailabilityCalendar'

interface AvailabilityFormProps {
  playerSlotId: string
  campaignName: string
  playerName: string
  planningWindowStart: string   // ISO string serialized from server
  planningWindowEnd: string     // ISO string serialized from server
  // Existing AvailabilityEntry rows from database (pre-populate state)
  initialEntries: Array<{
    id: string
    type: string           // "weekly" | "override"
    dayOfWeek: number | null
    date: string | null    // ISO string or null
    timeOfDay: string | null
    status: string         // "free" | "busy"
  }>
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function SaveIndicator({
  status,
  onRetry,
}: {
  status: SaveStatus
  onRetry: () => void
}) {
  return (
    <div
      className={`text-sm transition-opacity duration-500 ${
        status === 'idle' ? 'opacity-0' : 'opacity-100'
      } ${status === 'saved' ? 'text-green-400' : ''} ${
        status === 'saving' ? 'text-gray-400' : ''
      } ${status === 'error' ? 'text-red-400' : ''}`}
    >
      {status === 'saved' && 'Availability saved'}
      {status === 'saving' && 'Saving...'}
      {status === 'error' && (
        <span>
          Couldn&apos;t save —{' '}
          <button className="underline" onClick={onRetry}>
            try again
          </button>
        </span>
      )}
    </div>
  )
}

export function AvailabilityForm({
  playerSlotId,
  campaignName,
  playerName,
  planningWindowStart,
  planningWindowEnd,
  initialEntries,
}: AvailabilityFormProps) {
  // Derive initial weekly selection from initialEntries
  const weeklyEntries = initialEntries.filter(e => e.type === 'weekly')
  const initialWeeklySelection = new Set(
    weeklyEntries
      .filter(e => e.dayOfWeek !== null && e.timeOfDay !== null)
      .map(e => `${e.dayOfWeek}-${e.timeOfDay}`)
  )

  // Derive initial overrides from initialEntries
  const overrideEntries = initialEntries.filter(e => e.type === 'override')
  const initialOverrides = new Map<string, 'free' | 'busy'>(
    overrideEntries
      .filter(e => e.date !== null)
      .map(e => {
        const d = new Date(e.date!)
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
        return [key, e.status as 'free' | 'busy']
      })
  )

  const [weeklySelection, setWeeklySelection] = useState<Set<string>>(initialWeeklySelection)
  const [overrides, setOverrides] = useState<Map<string, 'free' | 'busy'>>(initialOverrides)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [, startTransition] = useTransition()

  // Debounced weekly save — fires 600ms after last toggle
  const debouncedSaveWeekly = useDebouncedCallback(
    (selection: Set<string>) => {
      startTransition(async () => {
        setSaveStatus('saving')
        const entries = Array.from(selection).map(key => {
          const [day, time] = key.split('-')
          return { dayOfWeek: Number(day), timeOfDay: time }
        })
        const result = await saveWeeklyPattern(playerSlotId, entries)
        if ('error' in result) {
          setSaveStatus('error')
        } else {
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
      })
    },
    600
  )

  // Flush on unmount to prevent lost saves on tab close
  useEffect(() => {
    return () => {
      debouncedSaveWeekly.flush()
    }
  }, [debouncedSaveWeekly])

  function handleWeeklyChange(newSelection: Set<string>) {
    setWeeklySelection(new Set(newSelection))  // update local state immediately
    debouncedSaveWeekly(newSelection)           // persist after debounce
  }

  function handleDateClick(dateKey: string) {
    const current = overrides.get(dateKey)
    let newStatus: 'free' | 'busy' | null
    if (current === undefined) newStatus = 'busy'
    else if (current === 'busy') newStatus = 'free'
    else newStatus = null  // remove override

    // Update local state immediately
    const newOverrides = new Map(overrides)
    if (newStatus === null) newOverrides.delete(dateKey)
    else newOverrides.set(dateKey, newStatus)
    setOverrides(newOverrides)

    // Persist via Server Action (non-debounced — each date click is discrete)
    startTransition(async () => {
      setSaveStatus('saving')
      const result = await toggleDateOverride(playerSlotId, dateKey, newStatus)
      if ('error' in result) {
        setSaveStatus('error')
        // Rollback local state on failure
        setOverrides(overrides)
      } else {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    })
  }

  const hasCalendar = Boolean(planningWindowStart && planningWindowEnd)

  return (
    <div className="space-y-8">
      {/* Context header */}
      <div>
        <p className="text-xs text-amber-500 uppercase tracking-widest mb-0.5">{campaignName}</p>
        <p className="text-lg font-semibold text-gray-100">{playerName}</p>
      </div>

      {/* Save indicator */}
      <SaveIndicator
        status={saveStatus}
        onRetry={() => debouncedSaveWeekly.flush()}
      />

      {/* Weekly schedule section */}
      <div>
        <h2 className="text-amber-400 font-semibold text-lg mb-4">Your weekly availability</h2>
        <WeeklySchedule selection={weeklySelection} onChange={handleWeeklyChange} />
      </div>

      {/* Calendar section — only rendered if planning window is set */}
      {hasCalendar && (
        <div>
          <h2 className="text-amber-400 font-semibold text-lg mb-4">Date exceptions</h2>
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
