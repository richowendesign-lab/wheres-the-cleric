'use client'

import Link from 'next/link'

export function CtaSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-8 py-16 gap-6">
      <img src="/dnd-icon.png" alt="" width={100} height={100} />
      <h2 className="font-fantasy text-4xl text-white">Ready to plan your next adventure?</h2>
      <div className="flex gap-4">
        <Link
          href="/auth/signup"
          className="px-6 py-3 rounded bg-[var(--dnd-accent)] text-black font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors"
        >
          Sign up
        </Link>
        <Link
          href="/auth/login"
          className="px-6 py-3 rounded border border-[var(--dnd-accent)] text-[var(--dnd-accent)] font-semibold hover:bg-[#ba7df6]/10 transition-colors"
        >
          Log in
        </Link>
      </div>
    </section>
  )
}
