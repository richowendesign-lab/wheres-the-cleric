'use client'

interface WeeklyScheduleProps {
  // Current selection: Set of strings like "1-morning", "6-evening"
  // Key format: "{dayOfWeek}-{timeOfDay}" where dayOfWeek 0=Sun..6=Sat
  selection: Set<string>
  onChange: (newSelection: Set<string>) => void
}

const DAYS = [
  { label: 'Sun', dow: 0 },
  { label: 'Mon', dow: 1 },
  { label: 'Tue', dow: 2 },
  { label: 'Wed', dow: 3 },
  { label: 'Thu', dow: 4 },
  { label: 'Fri', dow: 5 },
  { label: 'Sat', dow: 6 },
]

const TIMES = ['morning', 'afternoon', 'evening'] as const
type TimeOfDay = (typeof TIMES)[number]

function isDayActive(dow: number, selection: Set<string>): boolean {
  return TIMES.some(t => selection.has(`${dow}-${t}`))
}

function isTimeActive(dow: number, time: TimeOfDay, selection: Set<string>): boolean {
  return selection.has(`${dow}-${time}`)
}

export function WeeklySchedule({ selection, onChange }: WeeklyScheduleProps) {
  function handleDayClick(dow: number) {
    const newSelection = new Set(selection)
    if (isDayActive(dow, selection)) {
      // Toggle day off: remove all times for this day
      TIMES.forEach(t => newSelection.delete(`${dow}-${t}`))
    } else {
      // Toggle day on: add default time (afternoon)
      newSelection.add(`${dow}-afternoon`)
    }
    onChange(newSelection)
  }

  function handleTimeClick(dow: number, time: TimeOfDay) {
    const newSelection = new Set(selection)
    const key = `${dow}-${time}`
    if (newSelection.has(key)) {
      // Remove this time slot
      newSelection.delete(key)
      // If no times remain for this day, the day is now inactive (nothing to clean up — day state is derived)
    } else {
      // Add this time slot
      newSelection.add(key)
    }
    onChange(newSelection)
  }

  return (
    <div>
      <p className="text-sm text-gray-400 uppercase tracking-widest mb-3">Weekly Schedule</p>

      <div className="flex flex-wrap gap-2">
        {DAYS.map(({ label, dow }) => {
          const active = isDayActive(dow, selection)
          return (
            <div key={dow} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => handleDayClick(dow)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-amber-500 text-gray-950 font-bold'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                {label}
              </button>

              {active && (
                <div className="flex gap-1 mt-1">
                  {TIMES.map(time => {
                    const timeActive = isTimeActive(dow, time, selection)
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeClick(dow, time)}
                        className={`rounded px-2 py-1 text-xs font-medium transition-colors capitalize ${
                          timeActive
                            ? 'bg-amber-700 text-amber-100'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200'
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
