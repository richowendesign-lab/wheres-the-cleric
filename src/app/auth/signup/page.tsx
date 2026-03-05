'use client'

import { useActionState } from 'react'
import { signUp } from '@/lib/actions/auth'
import Link from 'next/link'

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUp, null)

  return (
    <main className="relative min-h-screen text-gray-100 flex flex-col items-center justify-center px-4">
      <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white hover:underline transition-colors">
        ← Back
      </Link>
      <h1 className="font-fantasy text-3xl text-white mb-2">Create Account</h1>
      <p className="text-gray-400 mb-8 text-sm">Start scheduling your D&amp;D sessions.</p>

      <form action={action} className="w-full max-w-sm flex flex-col gap-4">
        {state?.error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded px-3 py-2">
            {state.error}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-gray-300">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded bg-[#200637] border border-[#ba7df6] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#ba7df6]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-gray-300">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded bg-[#200637] border border-[#ba7df6] px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#ba7df6]"
          />
          <p className="text-xs text-gray-500">Minimum 8 characters.</p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="px-6 py-3 rounded bg-[#ba7df6] text-[#030712] font-semibold hover:bg-[#c994f8] transition-colors disabled:opacity-50"
        >
          {pending ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-400">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-[#ba7df6] hover:text-[#c994f8] underline">
          Log in
        </Link>
      </p>
    </main>
  )
}
