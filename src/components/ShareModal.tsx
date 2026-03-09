'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="w-full py-2 rounded bg-[var(--dnd-accent)] text-black text-sm font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}

export function ShareModal({ joinUrl }: { joinUrl: string }) {
  const [open, setOpen] = useState(true)
  const router = useRouter()

  const inviteMessage = `You're invited to join my D&D campaign!\n\nClick the link below to set your availability and help us find the best session date:\n\n${joinUrl}`

  function dismiss() {
    setOpen(false)
    router.replace(window.location.pathname, { scroll: false })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={dismiss} />
      <div className="relative bg-[var(--dnd-input-bg)] border border-[#ba7df6]/30 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
        <h2 className="font-fantasy text-xl text-white">Campaign created!</h2>
        <p className="text-sm text-[var(--dnd-text-muted)]">
          Share this link with your players to get them started.
        </p>
        <input
          type="text"
          readOnly
          value={joinUrl}
          className="w-full rounded bg-black/30 border border-[#ba7df6]/20 px-3 py-2 text-sm font-mono text-[var(--dnd-accent)] focus:outline-none select-all"
        />
        <CopyButton text={joinUrl} label="Copy link" />
        <CopyButton text={inviteMessage} label="Copy invite message" />
        <button
          onClick={dismiss}
          className="w-full py-2 rounded border border-[var(--dnd-border-muted)] text-sm text-[var(--dnd-text-muted)] hover:text-white transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}
