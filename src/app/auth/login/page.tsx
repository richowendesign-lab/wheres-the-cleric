'use client'

import { useActionState } from 'react'
import { logIn } from '@/lib/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [state, action, pending] = useActionState(logIn, null)

  return (
    <main className="relative min-h-screen text-gray-100 flex flex-col items-center justify-center px-4">
      <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-1 text-sm text-[var(--dnd-text-muted)] hover:text-white hover:underline transition-colors">
        ← Back
      </Link>
      <h1 className="font-fantasy text-3xl text-white mb-2">Welcome Back</h1>
      <p className="text-[var(--dnd-text-muted)] mb-8 text-sm">Log in to manage your campaigns.</p>

      <form action={action} className="w-full max-w-sm flex flex-col gap-4">
        {state?.error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded px-3 py-2">
            {state.error}
          </p>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-gray-300">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email"
            className="rounded bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-gray-300">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password"
            className="rounded bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none" />
        </div>
        <button type="submit" disabled={pending}
          className="px-6 py-3 rounded bg-[var(--dnd-accent)] text-black font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors disabled:opacity-50">
          {pending ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[var(--dnd-text-muted)]">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-[var(--dnd-accent)] hover:text-[var(--dnd-accent-hover)] underline">Sign up</Link>
      </p>
    </main>
  )
}
