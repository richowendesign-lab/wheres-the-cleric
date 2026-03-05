'use client'

import { useTransition } from 'react'
import { deleteCampaign } from '@/lib/actions/campaign'

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Delete this campaign? This cannot be undone.')) return
    startTransition(() => deleteCampaign(campaignId))
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer"
    >
      {isPending ? 'Deleting…' : 'Delete campaign'}
    </button>
  )
}
