import { redirect } from 'next/navigation'
import { getSessionDM } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'
import { HowItWorksButton } from '@/components/HowItWorksButton'

export default async function HomePage() {
  const dm = await getSessionDM()
  if (dm) redirect('/campaigns')

  return (
    <main className="min-h-screen text-gray-100 flex flex-col items-center justify-center px-4">
      <Image src="/dnd-icon.png" alt="" width={96} height={96} className="mb-6" />
      <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
        <h1 className="font-fantasy text-4xl text-white text-center">D&amp;D Session Planner</h1>
        <span className="text-xs font-semibold bg-[#ba7df6]/20 text-[var(--dnd-accent)] border border-[#ba7df6]/40 rounded px-2 py-0.5 translate-y-[-2px]">
          Beta
        </span>
      </div>
      <p className="text-[var(--dnd-text-muted)] mb-8 text-center max-w-sm">
        Coordinate your group&apos;s availability without the back-and-forth.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="px-6 py-3 rounded bg-[var(--dnd-accent)] text-black font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors"
        >
          Log In
        </Link>
        <Link
          href="/auth/signup"
          className="px-6 py-3 rounded border border-[var(--dnd-accent)] text-[var(--dnd-accent)] font-semibold hover:bg-[#ba7df6]/10 transition-colors"
        >
          Sign Up
        </Link>
      </div>
      <div className="mt-6">
        <HowItWorksButton />
      </div>
    </main>
  )
}
