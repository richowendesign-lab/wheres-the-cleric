'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { logIn } from '@/lib/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(logIn, null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (state && 'success' in state && state.success) {
      router.push('/campaigns')
    }
  }, [state, router])

  return (
    <main className="relative min-h-screen text-gray-100 flex flex-col items-center justify-center px-4">
      <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-1 text-sm text-[var(--dnd-text-muted)] hover:text-white hover:underline transition-colors">
        ← Back
      </Link>
      <h1 className="font-fantasy text-3xl text-white mb-2">Welcome Back</h1>
      <p className="text-[var(--dnd-text-muted)] mb-8 text-sm">Log in to manage your campaigns.</p>

      <form action={action} className="w-full max-w-sm flex flex-col gap-4">
        {state && 'error' in state && state.error && (
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
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              className="w-full rounded bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] px-3 py-2 pr-10 text-gray-100 placeholder-gray-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
                  <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
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
