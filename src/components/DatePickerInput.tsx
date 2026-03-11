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
  const [viewYear, setViewYear] = useState(
    initialDate ? initialDate.getUTCFullYear() : today.getFullYear()
  )
  const [viewMonth, setViewMonth] = useState(
    initialDate ? initialDate.getUTCMonth() : today.getMonth()
  )

  const containerRef = useRef<HTMLDivElement>(null)

  // Outside-click dismiss (mousedown + touchstart for mobile)
  useEffect(() => {
    if (!open) return

    function handleOutsideClick(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [open])

  // Escape-key dismiss
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  function selectDate(date: Date) {
    setSelected(date)
    setOpen(false)
  }

  const formattedValue = selected ? formatDateKey(selected) : ''
  const displayLabel = selected
    ? selected.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : placeholder

  const grid = buildMonthGrid(viewYear, viewMonth)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full text-left rounded bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] px-3 py-2 focus:outline-none${selected ? ' text-gray-100' : ' text-gray-500'}`}
      >
        {displayLabel}
      </button>

      <input type="hidden" name={name} value={formattedValue} />

      {open && (
        <div className="absolute z-50 mt-1 bg-[#140326] border border-[var(--dnd-border-card)] shadow-2xl rounded-lg p-3 min-w-[260px]">
          {/* Month navigation header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={prevMonth}
              className="p-1 text-[var(--dnd-text-muted)] hover:text-white"
            >
              &#8592;
            </button>
            <span className="text-sm text-gray-100 font-medium">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={nextMonth}
              className="p-1 text-[var(--dnd-text-muted)] hover:text-white"
            >
              &#8594;
            </button>
          </div>

          {/* Day header row */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map(day => (
              <div key={day} className="text-xs text-gray-500 text-center py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((date, di) => {
                if (!date) {
                  return <div key={di} />
                }

                const isSelected = selected != null && formatDateKey(selected) === formatDateKey(date)

                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => selectDate(date)}
                    className={`rounded py-1.5 text-sm text-center transition-colors${isSelected ? ' bg-[var(--dnd-accent)] text-black font-semibold' : ' text-gray-300 hover:bg-[var(--dnd-border-card)] hover:text-white'}`}
                  >
                    {date.getUTCDate()}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
