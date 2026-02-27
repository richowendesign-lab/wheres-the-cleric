'use client'

interface WeeklyScheduleProps {
  // Set of day-number strings: "0"=Sun, "1"=Mon, ..., "6"=Sat
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

export function WeeklySchedule({ selection, onChange }: WeeklyScheduleProps) {
  function handleDayClick(dow: number) {
    const newSelection = new Set(selection)
    const key = String(dow)
    if (newSelection.has(key)) newSelection.delete(key)
    else newSelection.add(key)
    onChange(newSelection)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map(({ label, dow }) => {
        const active = selection.has(String(dow))
        return (
          <button
            key={dow}
            type="button"
            onClick={() => handleDayClick(dow)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
              active
                ? 'bg-amber-500 text-gray-950 font-bold hover:bg-amber-400'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
