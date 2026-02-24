'use client'

import { useState } from 'react'

export function PlayerSlotsInput() {
  const [names, setNames] = useState<string[]>([''])

  const addSlot = () => setNames(prev => [...prev, ''])
  const removeSlot = (i: number) => setNames(prev => prev.filter((_, idx) => idx !== i))
  const updateSlot = (i: number, val: string) =>
    setNames(prev => prev.map((n, idx) => (idx === i ? val : n)))

  return (
    <div className="space-y-2">
      {names.map((name, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            name="playerName"
            value={name}
            onChange={e => updateSlot(i, e.target.value)}
            placeholder={`Player ${i + 1} name`}
            required
            className="flex-1 rounded bg-gray-800 border border-gray-600 px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
          {names.length > 1 && (
            <button
              type="button"
              onClick={() => removeSlot(i)}
              className="px-3 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addSlot}
        className="text-sm text-amber-400 hover:text-amber-300"
      >
        + Add player
      </button>
    </div>
  )
}
