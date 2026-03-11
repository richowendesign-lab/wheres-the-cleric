'use client'

import { useState, useEffect, useRef } from 'react'
import { buildMonthGrid, formatDateKey } from '@/lib/calendarUtils'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** Parse user-typed date strings.
 *  Supports: DD/MM/YYYY · D/M/YY · YYYY-MM-DD · D MMM YYYY · D Month YYYY
 */
function parseTypedDate(raw: string): Date | null {
  const s = raw.trim()
  if (!s) return null

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d))
    if (date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d) return date
    return null
  }

  // DD/MM/YYYY or D/M/YY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashMatch) {
    const day = parseInt(slashMatch[1])
    const month = parseInt(slashMatch[2])
    const rawYear = parseInt(slashMatch[3])
    const year = rawYear < 100 ? 2000 + rawYear : rawYear
    const date = new Date(Date.UTC(year, month - 1, day))
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) return date
    return null
  }

  // D MMM YYYY or D Month YYYY (e.g. "15 Mar 2026", "1 April 2026")
  const textMatch = s.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/)
  if (textMatch) {
    const day = parseInt(textMatch[1])
    const monthStr = textMatch[2].toLowerCase()
    const year = parseInt(textMatch[3])
    const monthIdx = MONTHS.findIndex(m =>
      m.toLowerCase() === monthStr ||
      m.toLowerCase().startsWith(monthStr.slice(0, 3))
    )
    if (monthIdx !== -1) {
      const date = new Date(Date.UTC(year, monthIdx, day))
      if (date.getUTCFullYear() === year && date.getUTCMonth() === monthIdx && date.getUTCDate() === day) return date
    }
    return null
  }

  return null
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

interface DatePickerInputProps {
  name: string
  defaultValue?: string
  required?: boolean
  placeholder?: string
}

export function DatePickerInput({
  name,
  defaultValue,
  required: _required,
  placeholder = 'Pick a date',
}: DatePickerInputProps) {
  const today = new Date()
  const initialDate = defaultValue ? parseDateKey(defaultValue) : undefined

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Date | undefined>(initialDate)
  const [inputValue, setInputValue] = useState(initialDate ? formatDisplay(initialDate) : '')
  const [viewYear, setViewYear] = useState(
    initialDate ? initialDate.getUTCFullYear() : today.getFullYear()
  )
  const [viewMonth, setViewMonth] = useState(
    initialDate ? initialDate.getUTCMonth() : today.getMonth()
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Outside-click dismiss
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Revert input to last valid selection
        setInputValue(selected ? formatDisplay(selected) : '')
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open, selected])

  // Keyboard: Escape closes; ←/→ navigate months only when focus is NOT in text input
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setInputValue(selected ? formatDisplay(selected) : '')
        setOpen(false)
        return
      }
      // Enter confirms a typed date
      if (e.key === 'Enter' && e.target === inputRef.current) {
        const parsed = parseTypedDate(inputValue)
        if (parsed) {
          setSelected(parsed)
          setInputValue(formatDisplay(parsed))
          setOpen(false)
          e.preventDefault()
        }
        return
      }
      // ←/→ navigate months — only when the text input is NOT the active element
      // so cursor movement inside the text input still works normally
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setViewMonth(m => {
          if (m === 0) { setViewYear(y => y - 1); return 11 }
          return m - 1
        })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setViewMonth(m => {
          if (m === 11) { setViewYear(y => y + 1); return 0 }
          return m + 1
        })
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, selected, inputValue])

  function prevMonth() {
    setViewMonth(m => {
      if (m === 0) { setViewYear(y => y - 1); return 11 }
      return m - 1
    })
  }
  function nextMonth() {
    setViewMonth(m => {
      if (m === 11) { setViewYear(y => y + 1); return 0 }
      return m + 1
    })
  }

  function selectDate(date: Date) {
    setSelected(date)
    setInputValue(formatDisplay(date))
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setInputValue(val)
    const parsed = parseTypedDate(val)
    if (parsed) {
      setSelected(parsed)
      setViewYear(parsed.getUTCFullYear())
      setViewMonth(parsed.getUTCMonth())
    }
  }

  const formattedValue = selected ? formatDateKey(selected) : ''
  const grid = buildMonthGrid(viewYear, viewMonth)

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full rounded bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--dnd-accent)] placeholder:text-gray-500${inputValue ? ' text-gray-100' : ''}`}
      />

      <input type="hidden" name={name} value={formattedValue} />

      {open && (
        <div className="absolute z-50 mt-1 bg-[#140326] border border-[var(--dnd-border-card)] shadow-2xl rounded-lg p-3 min-w-[260px]">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={prevMonth}
              className="p-1 rounded text-[var(--dnd-text-muted)] hover:text-white transition-colors"
            >
              &#8592;
            </button>
            <span className="text-sm text-gray-100 font-medium select-none">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={nextMonth}
              className="p-1 rounded text-[var(--dnd-text-muted)] hover:text-white transition-colors"
            >
              &#8594;
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map(day => (
              <div key={day} className="text-xs text-gray-500 text-center py-1 select-none">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((date, di) => {
                if (!date) return <div key={di} />
                const isSelected = selected != null && formatDateKey(selected) === formatDateKey(date)
                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => selectDate(date)}
                    className={`rounded py-1.5 text-sm text-center transition-colors${
                      isSelected
                        ? ' bg-[var(--dnd-accent)] text-black font-semibold'
                        : ' text-gray-300 hover:bg-[var(--dnd-border-card)] hover:text-white'
                    }`}
                  >
                    {date.getUTCDate()}
                  </button>
                )
              })}
            </div>
          ))}

          {/* Keyboard hint */}
          <p className="text-xs text-gray-600 mt-2 text-center select-none">
            ← → to change month · Esc to close
          </p>
        </div>
      )}
    </div>
  )
}
