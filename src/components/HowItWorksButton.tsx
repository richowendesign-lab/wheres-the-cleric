'use client'

import { useState } from 'react'
import { HowItWorksModal } from './HowItWorksModal'

interface HowItWorksButtonProps {
  defaultRole?: 'dm' | 'player'
  iconOnly?: boolean
}

export function HowItWorksButton({ defaultRole, iconOnly }: HowItWorksButtonProps = {}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="How it works"
          className="w-8 h-8 rounded-full border border-[var(--dnd-border-muted)] flex items-center justify-center text-[13px] font-bold text-[var(--dnd-text-muted)] hover:text-white hover:border-[var(--dnd-accent)] transition-colors shrink-0"
        >
          ?
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="How it works"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--dnd-text-muted)] hover:text-white transition-colors px-2 py-1 rounded border border-[var(--dnd-border-muted)] hover:border-[var(--dnd-accent)]"
        >
          How it works
          <span
            aria-hidden="true"
            className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold leading-none shrink-0"
          >
            ?
          </span>
        </button>
      )}
      {open && <HowItWorksModal onClose={() => setOpen(false)} defaultRole={defaultRole} />}
    </>
  )
}
