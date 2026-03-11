'use client'
import { useState } from 'react'

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" fill="currentColor"/>
    <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" fill="currentColor"/>
  </svg>
)

export function CopyBestDatesButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative group/copy">
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(message)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        aria-label={copied ? 'Copied!' : 'Copy best dates'}
        className="p-1 rounded text-[var(--dnd-text-muted)] hover:text-white transition-colors"
      >
        <CopyIcon />
      </button>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-30
        opacity-0 group-hover/copy:opacity-100 transition-opacity pointer-events-none
        bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 whitespace-nowrap shadow-lg">
        {copied ? 'Copied!' : 'Copy best dates'}
      </div>
    </div>
  )
}
