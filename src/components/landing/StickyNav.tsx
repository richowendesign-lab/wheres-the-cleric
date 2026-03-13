import Link from 'next/link'

export function StickyNav() {
  return (
    <header className="sticky top-0 z-50 w-full px-8 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <img src="/Logo.svg" alt="Where's the Cleric?" className="h-8 w-auto" />
        <span className="text-xs font-semibold bg-[#ba7df6]/20 text-[var(--dnd-accent)] border border-[#ba7df6]/40 rounded px-2 py-0.5 ml-3">Beta</span>
      </div>
      <div className="flex gap-3 opacity-0 pointer-events-none">
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
