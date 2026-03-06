'use client'

import { useActionState } from 'react'
import { createCampaign } from '@/lib/actions/campaign'

const inputCls = "w-full rounded bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none"

export function CampaignForm() {
  const [state, formAction, isPending] = useActionState(createCampaign, null)

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}

      <div>
        <label className="block text-sm text-gray-300 mb-1">Campaign name <span className="text-red-400">*</span></label>
        <input type="text" name="name" required maxLength={100} placeholder="The Lost Mine of Phandelver" className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Planning window start</label>
          <input type="date" name="planningWindowStart" required className={inputCls} />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Planning window end</label>
          <input type="date" name="planningWindowEnd" required className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Description <span className="text-[var(--dnd-text-muted)] text-xs">(optional)</span></label>
        <textarea name="description" rows={3} maxLength={500} placeholder="A few words about the campaign for your players..." className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Max players <span className="text-[var(--dnd-text-muted)] text-xs">(optional)</span></label>
        <input type="number" name="maxPlayers" min={1} max={20} placeholder="e.g. 5" className="w-32 rounded bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none" />
      </div>

      <button type="submit" disabled={isPending}
        className="w-full py-3 rounded bg-[var(--dnd-accent)] text-black font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {isPending ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  )
}
