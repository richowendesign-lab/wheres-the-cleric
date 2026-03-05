'use client'

import { useActionState } from 'react'
import { createCampaign } from '@/lib/actions/campaign'

export function CampaignForm() {
  const [state, formAction, isPending] = useActionState(createCampaign, null)

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}

      <div>
        <label className="block text-sm text-gray-300 mb-1">
          Campaign name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="name"
          required
          maxLength={100}
          placeholder="The Lost Mine of Phandelver"
          className="w-full rounded bg-[#200637] border border-[#ba7df6] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#ba7df6]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Planning window start</label>
          <input
            type="date"
            name="planningWindowStart"
            required
            className="w-full rounded bg-[#200637] border border-[#ba7df6] px-3 py-2 text-gray-100 focus:outline-none focus:border-[#ba7df6]"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Planning window end</label>
          <input
            type="date"
            name="planningWindowEnd"
            required
            className="w-full rounded bg-[#200637] border border-[#ba7df6] px-3 py-2 text-gray-100 focus:outline-none focus:border-[#ba7df6]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Description <span className="text-gray-500 text-xs">(optional)</span></label>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          placeholder="A few words about the campaign for your players..."
          className="w-full rounded bg-[#200637] border border-[#ba7df6] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#ba7df6] resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Max players <span className="text-gray-500 text-xs">(optional)</span></label>
        <input
          type="number"
          name="maxPlayers"
          min={1}
          max={20}
          placeholder="e.g. 5"
          className="w-32 rounded bg-[#200637] border border-[#ba7df6] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#ba7df6]"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded bg-[#ba7df6] text-[#030712] font-semibold hover:bg-[#c994f8] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  )
}
