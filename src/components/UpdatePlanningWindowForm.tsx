'use client'

import { useActionState } from 'react'
import { updatePlanningWindow } from '@/lib/actions/campaign'

type Campaign = {
  id: string
  planningWindowStart: Date | null
  planningWindowEnd: Date | null
}

function toDateInputValue(date: Date | null): string {
  if (!date) return ''
  return date.toISOString().slice(0, 10)
}

export function UpdatePlanningWindowForm({ campaign }: { campaign: Campaign }) {
  const boundAction = updatePlanningWindow.bind(null, campaign.id)
  const [state, formAction, isPending] = useActionState(boundAction, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      {state?.success && <p className="text-green-400 text-sm">Planning window updated.</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Start date</label>
          <input
            type="date"
            name="planningWindowStart"
            defaultValue={toDateInputValue(campaign.planningWindowStart)}
            required
            className="w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">End date</label>
          <input
            type="date"
            name="planningWindowEnd"
            defaultValue={toDateInputValue(campaign.planningWindowEnd)}
            required
            className="w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2 rounded bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Saving...' : 'Update window'}
      </button>
    </form>
  )
}
