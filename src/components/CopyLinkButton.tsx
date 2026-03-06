'use client'
import { useState } from 'react'
export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="px-3 py-1 rounded text-sm bg-[var(--dnd-accent)] text-black hover:bg-[var(--dnd-accent-hover)] transition-colors">
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}
