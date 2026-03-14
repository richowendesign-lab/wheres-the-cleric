import Link from 'next/link'
import { logOut } from '@/lib/actions/auth'
import { HowItWorksButton } from '@/components/HowItWorksButton'

export function AppNav() {
  return (
    <header className="sticky top-0 z-50 w-full px-8 py-4 flex items-center justify-between bg-[rgba(20,3,38,0.9)] shadow-lg shadow-black/20">
      <Link href="/campaigns" className="flex items-center shrink-0">
        <img src="/Logo.svg" alt="Where's the Cleric?" className="h-[52px] w-auto" />
        <span className="text-xs font-semibold bg-[#ba7df6]/20 text-[var(--dnd-accent)] border border-[#ba7df6]/40 rounded px-2 py-0.5 ml-3">Beta</span>
      </Link>

      <div className="flex items-center gap-4">
        <HowItWorksButton iconOnly />
        <form action={logOut}>
          <button
            type="submit"
            aria-label="Log out"
            className="w-8 h-8 rounded-full border border-[var(--dnd-border-muted)] flex items-center justify-center text-[var(--dnd-text-muted)] hover:text-white hover:border-[var(--dnd-accent)] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M11 11l3-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </form>
      </div>
    </header>
  )
}
