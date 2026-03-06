'use client'
interface WeeklyScheduleProps { selection: Set<string>; onChange: (s: Set<string>) => void }
const DAYS = [{ label: 'Sun', dow: 0 },{ label: 'Mon', dow: 1 },{ label: 'Tue', dow: 2 },{ label: 'Wed', dow: 3 },{ label: 'Thu', dow: 4 },{ label: 'Fri', dow: 5 },{ label: 'Sat', dow: 6 }]
export function WeeklySchedule({ selection, onChange }: WeeklyScheduleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map(({ label, dow }) => {
        const active = selection.has(String(dow))
        return (
          <button key={dow} type="button" onClick={() => { const s = new Set(selection); s.has(String(dow)) ? s.delete(String(dow)) : s.add(String(dow)); onChange(s) }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-[var(--dnd-accent)] text-black font-bold hover:bg-[var(--dnd-accent-hover)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
            {label}
          </button>
        )
      })}
    </div>
  )
}
