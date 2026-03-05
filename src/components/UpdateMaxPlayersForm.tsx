'use client'

import { useActionState } from 'react'
import { updateMaxPlayers } from '@/lib/actions/campaign'

export function UpdateMaxPlayersForm({
  campaignId,
  currentMax,
  currentCount,
}: {
  campaignId: string
  currentMax: number | null
  currentCount: number
}) {
  const boundAction = updateMaxPlayers.bind(null, campaignId)
  const [state, formAction, isPending] = useActionState(boundAction, null)

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3 mt-2">
      <p className="text-xs text-gray-400">{currentCount} joined</p>
      <span className="text-xs text-gray-500">/</span>
      <input
        type="number"
        name="maxPlayers"
        min={currentCount > 0 ? currentCount : 1}
        max={99}
        defaultValue={currentMax ?? ''}
        placeholder="No limit"
        className="w-24 rounded bg-[#200637] border border-[#ba7df6]/40 px-2 py-1 text-xs text-gray-400 placeholder-gray-500 focus:outline-none focus:border-[#ba7df6]"
      />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs px-3 py-1 rounded bg-[#ba7df6] text-[#030712] font-semibold hover:bg-[#c994f8] transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Update'}
      </button>
      {state?.error && <p className="text-red-400 text-xs w-full">{state.error}</p>}
      {state?.success && <p className="text-green-400 text-xs w-full">Max players updated.</p>}
    </form>
  )
}
