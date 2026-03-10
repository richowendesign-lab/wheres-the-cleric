'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { updateMaxPlayers } from '@/lib/actions/campaign'

interface Props {
  campaignId: string
  currentMax: number | null
  currentCount: number
  /** When true, the form is always shown without the edit-icon toggle */
  alwaysShowForm?: boolean
}

export function UpdateMaxPlayersForm({ campaignId, currentMax, currentCount, alwaysShowForm }: Props) {
  const [editing, setEditing] = useState(alwaysShowForm ?? false)
  const [state, formAction, isPending] = useActionState(
    async (prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await updateMaxPlayers(campaignId, prev, formData)
      // Only collapse back to read-only if in toggle mode (not alwaysShowForm)
      if (!result?.error && !alwaysShowForm) setEditing(false)
      return result
    },
    null
  )

  if (!editing) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <p className="text-xs text-gray-400">
          {currentCount} joined{currentMax != null ? ` / ${currentMax} max` : ''}
        </p>
        <button
          onClick={() => setEditing(true)}
          aria-label="Edit max players"
          className="p-1 rounded text-[var(--dnd-text-muted)] hover:text-white transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M11.013 1.427a1.75 1.75 0 0 1 2.475 0l1.085 1.086a1.75 1.75 0 0 1 0 2.474L5.91 13.65a.75.75 0 0 1-.364.194l-3.75.833a.75.75 0 0 1-.906-.906l.833-3.75a.75.75 0 0 1 .194-.364L11.013 1.427Zm1.414 1.06a.25.25 0 0 0-.353 0L3.51 11.05l-.585 2.635 2.634-.586 8.573-8.573a.25.25 0 0 0 0-.354L12.427 2.487Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3 mt-2">
      <p className="text-xs text-gray-400">{currentCount} joined</p>
      <span className="text-xs text-gray-500">/</span>
      <input type="number" name="maxPlayers" min={currentCount > 0 ? currentCount : 1} max={99}
        defaultValue={currentMax ?? ''} placeholder="No limit" autoFocus={!alwaysShowForm}
        className="w-24 rounded bg-[var(--dnd-input-bg)] border border-[#ba7df6]/40 px-2 py-1 text-xs text-gray-400 placeholder-gray-500 focus:outline-none focus:border-[var(--dnd-accent)]" />
      <button type="submit" disabled={isPending}
        className="text-xs px-3 py-1 rounded bg-[var(--dnd-accent)] text-black font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors disabled:opacity-50">
        {isPending ? 'Saving…' : 'Save'}
      </button>
      {!alwaysShowForm && (
        <button type="button" onClick={() => setEditing(false)}
          className="text-xs text-[var(--dnd-text-muted)] hover:text-white transition-colors">
          Cancel
        </button>
      )}
      {state?.error && <p className="text-red-400 text-xs w-full">{state.error}</p>}
      {state?.success && alwaysShowForm && <p className="text-green-400 text-xs w-full">Saved.</p>}
    </form>
  )
}
