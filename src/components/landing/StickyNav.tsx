'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function StickyNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={[
        'sticky top-0 z-50 w-full px-8 py-4 flex items-center justify-between transition-colors duration-300',
        scrolled ? 'bg-[rgba(20,3,38,0.9)] shadow-lg shadow-black/20' : 'bg-transparent',
      ].join(' ')}
    >
      <div className="flex items-center">
        <img src="/Logo.svg" alt="Where's the Cleric?" className="h-[52px] w-auto" />
        <span className="text-xs font-semibold bg-[#ba7df6]/20 text-[var(--dnd-accent)] border border-[#ba7df6]/40 rounded px-2 py-0.5 ml-3">Beta</span>
      </div>
      <div
        className={[
          'flex gap-3 transition-all duration-300',
          scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
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
    </header>
  )
}
