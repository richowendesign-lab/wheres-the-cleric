'use client'

import { useActionState, useEffect, useRef } from 'react'
import { updatePlanningWindow } from '@/lib/actions/campaign'
import { DatePickerInput } from '@/components/DatePickerInput'

interface UpdatePlanningWindowFormProps {
  campaignId: string
  planningWindowStart: string | null  // 'YYYY-MM-DD' or null
  planningWindowEnd: string | null    // 'YYYY-MM-DD' or null
  onSuccess?: () => void
}

export function UpdatePlanningWindowForm({ campaignId, planningWindowStart, planningWindowEnd, onSuccess }: UpdatePlanningWindowFormProps) {
  const [state, formAction, isPending] = useActionState(updatePlanningWindow.bind(null, campaignId), null)

  // Use a ref so the effect always calls the latest callback without re-registering
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  useEffect(() => {
    if (state?.success) {
      onSuccessRef.current?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success])

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Start date</label>
          <DatePickerInput
            name="planningWindowStart"
            defaultValue={planningWindowStart ?? undefined}
            required
            placeholder="Start date"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">End date</label>
          <DatePickerInput
            name="planningWindowEnd"
            defaultValue={planningWindowEnd ?? undefined}
            required
            placeholder="End date"
          />
        </div>
      </div>
      <button type="submit" disabled={isPending}
        className="px-5 py-2 rounded bg-[var(--dnd-accent)] text-black font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors disabled:opacity-50">
        {isPending ? 'Saving...' : 'Update window'}
      </button>
    </form>
  )
}
