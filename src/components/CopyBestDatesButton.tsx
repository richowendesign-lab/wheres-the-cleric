'use client'
import { useState } from 'react'

export function CopyBestDatesButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(message)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="px-3 py-1.5 rounded text-sm bg-[var(--dnd-accent)] text-black hover:bg-[var(--dnd-accent-hover)] transition-colors font-medium"
    >
      {copied ? 'Copied!' : 'Copy best dates'}
    </button>
  )
}
