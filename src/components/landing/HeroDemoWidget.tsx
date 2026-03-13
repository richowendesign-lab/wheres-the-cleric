'use client'
import { useState } from 'react'
import { DashboardCalendar } from '@/components/DashboardCalendar'
import { BestDaysList } from '@/components/BestDaysList'
import { computeDayStatuses } from '@/lib/availability'

// Hardcoded literals — NEVER new Date() — avoids SSR hydration mismatch (STATE.md rule)
const WINDOW_START = '2026-04-01'
const WINDOW_END = '2026-04-30'

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Aria' },
  { id: 'p2', name: 'Brom' },
  { id: 'p3', name: 'Cass' },
  { id: 'p4', name: 'Dwyn' },
]

// Weekly patterns: spread across different days so BestDaysList has interesting variation
// dayOfWeek: 0=Sun, 1=Mon, 5=Fri, 6=Sat
// April 2026 contains Fridays (3,10,17,24), Saturdays (4,11,18,25), Sundays (5,12,19,26)
const MOCK_SLOTS = [
  {
    id: 'p1', name: 'Aria',
    availabilityEntries: [
      { id: 'e1a', type: 'weekly' as const, dayOfWeek: 5, date: null, timeOfDay: null, status: 'free' as const },
      { id: 'e1b', type: 'weekly' as const, dayOfWeek: 6, date: null, timeOfDay: null, status: 'free' as const },
    ],
  },
  {
    id: 'p2', name: 'Brom',
    availabilityEntries: [
      { id: 'e2a', type: 'weekly' as const, dayOfWeek: 6, date: null, timeOfDay: null, status: 'free' as const },
      { id: 'e2b', type: 'weekly' as const, dayOfWeek: 0, date: null, timeOfDay: null, status: 'free' as const },
    ],
  },
  {
    id: 'p3', name: 'Cass',
    availabilityEntries: [
      { id: 'e3a', type: 'weekly' as const, dayOfWeek: 5, date: null, timeOfDay: null, status: 'free' as const },
      { id: 'e3b', type: 'weekly' as const, dayOfWeek: 0, date: null, timeOfDay: null, status: 'free' as const },
    ],
  },
  {
    id: 'p4', name: 'Dwyn',
    availabilityEntries: [
      { id: 'e4a', type: 'weekly' as const, dayOfWeek: 6, date: null, timeOfDay: null, status: 'free' as const },
    ],
  },
]

const DAY_AGGREGATIONS = computeDayStatuses(MOCK_SLOTS, WINDOW_START, WINDOW_END)

export function HeroDemoWidget() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  return (
    <div className="bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-xl p-4 flex flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="flex-1 min-w-0">
        <DashboardCalendar
          dayAggregations={DAY_AGGREGATIONS}
          playerSlots={MOCK_PLAYERS}
          windowStart={WINDOW_START}
          windowEnd={WINDOW_END}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>
      <div className="lg:w-56 flex-shrink-0">
        <BestDaysList
          days={DAY_AGGREGATIONS}
          playerSlots={MOCK_PLAYERS}
          dmExceptionMode={null}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>
    </div>
  )
}
