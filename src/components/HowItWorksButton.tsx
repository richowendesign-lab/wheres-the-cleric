'use client'

import { useState } from 'react'
import { HowItWorksModal } from './HowItWorksModal'

export function HowItWorksButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How it works"
        className="text-sm text-[var(--dnd-text-muted)] hover:text-white transition-colors px-2 py-1 rounded border border-[var(--dnd-border-muted)] hover:border-[var(--dnd-accent)]"
      >
        ? How it works
      </button>
      {open && <HowItWorksModal onClose={() => setOpen(false)} />}
    </>
  )
}
