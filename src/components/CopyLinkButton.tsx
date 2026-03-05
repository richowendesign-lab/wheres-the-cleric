'use client'

import { useState } from 'react'

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1 rounded text-sm bg-[#ba7df6] text-[#030712] hover:bg-[#c994f8] transition-colors cursor-pointer"
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}
