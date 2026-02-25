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

export function WeeklySchedule({ selection, onChange }: WeeklyScheduleProps) {
  function handleDayClick(dow: number) {
    const newSelection = new Set(selection)
    if (isDayActive(dow, selection)) {
      TIMES.forEach(t => newSelection.delete(`${dow}-${t}`))
    } else {
      newSelection.add(`${dow}-afternoon`)
    }
    onChange(newSelection)
  }

  function handleTimeClick(dow: number, time: TimeOfDay) {
    const newSelection = new Set(selection)
    const key = `${dow}-${time}`
    if (newSelection.has(key)) {
      newSelection.delete(key)
    } else {
      newSelection.add(key)
    }
    onChange(newSelection)
  }

  const activeDays = DAYS.filter(({ dow }) => isDayActive(dow, selection))

  return (
    <div className="space-y-4">
      {/* Day toggle row — fixed height, no layout shift */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map(({ label, dow }) => {
          const active = isDayActive(dow, selection)
          return (
            <button
              key={dow}
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
          )
        })}
      </div>

      {/* Time preferences — appears below the day row, one row per active day */}
      {activeDays.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-gray-800">
          {activeDays.map(({ label, dow }) => (
            <div key={dow} className="flex items-center gap-3">
              <span className="text-sm text-amber-400 w-8 shrink-0">{label}</span>
              <div className="flex gap-1.5">
                {TIMES.map(time => {
                  const timeActive = selection.has(`${dow}-${time}`)
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeClick(dow, time)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors capitalize ${
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
