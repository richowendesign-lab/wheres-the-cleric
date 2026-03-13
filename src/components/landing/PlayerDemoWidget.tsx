'use client'
import { useState } from 'react'
import { WeeklySchedule } from '@/components/WeeklySchedule'
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar'

// Hardcoded literals — NEVER new Date() (STATE.md rule)
const WINDOW_START = '2026-04-01'
const WINDOW_END = '2026-04-30'

export function PlayerDemoWidget() {
  const [weeklySelection, setWeeklySelection] = useState<Set<string>>(
    () => new Set(['5', '6'])  // Fri + Sat pre-selected — makes demo feel ready-to-use
  )
  const [overrides, setOverrides] = useState<Map<string, 'free' | 'busy'>>(
    () => new Map()
  )

  function handleDateClick(dateKey: string) {
    // Replicate AvailabilityForm toggle logic without any server-action calls
    const newOverrides = new Map(overrides)
    if (newOverrides.has(dateKey)) {
      newOverrides.delete(dateKey)
    } else {
      const [y, m, d] = dateKey.split('-').map(Number)
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
      const isPatternFree = weeklySelection.has(String(dow))
      newOverrides.set(dateKey, isPatternFree ? 'busy' : 'free')
    }
    setOverrides(newOverrides)
  }

  return (
    <div className="bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-xl p-4 space-y-4">
      <WeeklySchedule selection={weeklySelection} onChange={setWeeklySelection} />
      <AvailabilityCalendar
        planningWindowStart={WINDOW_START}
        planningWindowEnd={WINDOW_END}
        weeklySelection={weeklySelection}
        overrides={overrides}
        onDateClick={handleDateClick}
      />
    </div>
  )
}
