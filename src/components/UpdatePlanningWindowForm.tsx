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
            className="w-full rounded bg-[#200637] border border-[#ba7df6] px-3 py-2 text-gray-100 focus:outline-none focus:border-[#ba7df6]"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">End date</label>
          <input
            type="date"
            name="planningWindowEnd"
            defaultValue={toDateInputValue(campaign.planningWindowEnd)}
            required
            className="w-full rounded bg-[#200637] border border-[#ba7df6] px-3 py-2 text-gray-100 focus:outline-none focus:border-[#ba7df6]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2 rounded bg-[#ba7df6] text-[#030712] font-semibold hover:bg-[#c994f8] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Saving...' : 'Update window'}
      </button>
    </form>
  )
}
