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

  async function handleChange(next: boolean) {
    if (next === enabled) return
    const prev = enabled
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
      <p className="text-base text-gray-300 mb-2">Sync unavailable dates across campaigns:</p>
      <div className="flex gap-3 flex-wrap">
        {([
          { value: true,  label: 'Sync enabled' },
          { value: false, label: 'Sync off' },
        ] as const).map(({ value, label }) => (
          <label
            key={String(value)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded cursor-pointer select-none border transition-colors
              ${enabled === value
                ? 'bg-[var(--dnd-input-bg)] border-[var(--dnd-accent)] text-gray-100'
                : 'bg-[var(--dnd-input-bg)] border-gray-700 text-gray-400 hover:border-gray-500'}`}
          >
            <input
              type="radio"
              name={`dm-sync-${campaignId}`}
              checked={enabled === value}
              onChange={() => handleChange(value)}
              disabled={status === 'saving'}
              className="accent-[var(--dnd-accent)] cursor-pointer"
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
        {status === 'saving' && <span className="text-xs text-gray-500 self-center">Saving…</span>}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Re-enabling sync applies to future changes only — existing dates are not changed.
      </p>
      <Toast status={status} onRetry={() => setStatus('idle')} onDismiss={() => setStatus('idle')} />
    </div>
  )
}
