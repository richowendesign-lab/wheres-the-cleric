'use client'

import { useActionState } from 'react'
import { updatePlanningWindow } from '@/lib/actions/campaign'

type Campaign = { id: string; planningWindowStart: Date | null; planningWindowEnd: Date | null }

export function UpdatePlanningWindowForm({ campaign }: { campaign: Campaign }) {
  const [state, formAction, isPending] = useActionState(updatePlanningWindow.bind(null, campaign.id), null)
  const toVal = (d: Date | null) => d ? d.toISOString().slice(0, 10) : ''

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      {state?.success && <p className="text-green-400 text-sm">Planning window updated.</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Start date</label>
          <input type="date" name="planningWindowStart" defaultValue={toVal(campaign.planningWindowStart)} required
            className="w-full rounded bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] px-3 py-2 text-gray-100 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">End date</label>
          <input type="date" name="planningWindowEnd" defaultValue={toVal(campaign.planningWindowEnd)} required
            className="w-full rounded bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] px-3 py-2 text-gray-100 focus:outline-none" />
        </div>
      </div>
      <button type="submit" disabled={isPending}
        className="px-5 py-2 rounded bg-[var(--dnd-accent)] text-black font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors disabled:opacity-50">
        {isPending ? 'Saving...' : 'Update window'}
      </button>
    </form>
  )
}
