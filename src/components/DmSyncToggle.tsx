'use client'

import { useState } from 'react'
import { setDmSyncEnabled } from '@/lib/actions/campaign'
import { Toast, SaveStatus } from '@/components/Toast'

interface DmSyncToggleProps {
  campaignId: string
  initialEnabled: boolean
}

export function DmSyncToggle({ campaignId, initialEnabled }: DmSyncToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [status, setStatus] = useState<SaveStatus>('idle')

  async function handleToggle() {
    const prev = enabled
    const next = !enabled
    setEnabled(next)
    setStatus('saving')

    try {
      const result = await setDmSyncEnabled(campaignId, next)
      if ('error' in result) {
        setEnabled(prev)
        setStatus('error')
      } else {
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      }
    } catch {
      setEnabled(prev)
      setStatus('error')
    }
  }

  return (
    <div>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          disabled={status === 'saving'}
          className={`relative flex-shrink-0 h-5 w-9 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dnd-accent)] ${
            enabled ? 'bg-[var(--dnd-accent)]' : 'bg-gray-700'
          }`}
        >
          <span
            className={`absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
        <span className="text-sm text-gray-300">
          {enabled
            ? 'Sync enabled — unavailable dates apply across all your campaigns'
            : 'Sync off — unavailable dates are independent for this campaign'}
        </span>
      </label>
      <p className="text-xs text-gray-500 mt-1 ml-12">
        Re-enabling sync applies to future changes only — existing dates are not changed.
      </p>
      <Toast status={status} onRetry={() => setStatus('idle')} onDismiss={() => setStatus('idle')} />
    </div>
  )
}
