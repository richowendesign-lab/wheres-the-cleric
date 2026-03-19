'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-fantasy text-3xl text-white mb-3">Something went wrong</h1>
      <p className="text-[var(--dnd-text-muted)] text-sm mb-6 max-w-sm">
        An unexpected error occurred. Try again, or head back to your campaigns.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2 rounded bg-[var(--dnd-accent)] text-black font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/campaigns"
          className="px-5 py-2 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
        >
          My campaigns
        </Link>
      </div>
      {error.digest && (
        <p className="mt-4 text-xs text-gray-600">Error ID: {error.digest}</p>
      )}
    </main>
  )
}
