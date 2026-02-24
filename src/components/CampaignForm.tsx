'use client'

import { useActionState } from 'react'
import { createCampaign } from '@/lib/actions/campaign'
import { PlayerSlotsInput } from './PlayerSlotsInput'

export function CampaignForm() {
  const [state, formAction, isPending] = useActionState(createCampaign, null)

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}

      <div>
        <label className="block text-sm text-gray-300 mb-1">Campaign name</label>
        <input
          type="text"
          name="name"
          required
          placeholder="The Lost Mines of Phandelver"
          className="w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Your name (DM)</label>
        <input
          type="text"
          name="dmName"
          required
          placeholder="Richard"
          className="w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Planning window start</label>
          <input
            type="date"
            name="planningWindowStart"
            required
            className="w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Planning window end</label>
          <input
            type="date"
            name="planningWindowEnd"
            required
            className="w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-2">Player slots</label>
        <PlayerSlotsInput />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  )
}
