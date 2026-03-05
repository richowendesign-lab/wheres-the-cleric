import { redirect } from 'next/navigation'
import { getSessionDM } from '@/lib/auth'
import Link from 'next/link'

export default async function HomePage() {
  const dm = await getSessionDM()

  if (dm) {
    redirect('/campaigns')
  }

  return (
    <main className="min-h-screen text-gray-100 flex flex-col items-center justify-center px-4">
      <h1 className="font-fantasy text-4xl text-white mb-4">D&amp;D Session Planner</h1>
      <p className="text-gray-400 mb-8 text-center max-w-sm">
        Coordinate your group&apos;s availability without the back-and-forth.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="px-6 py-3 rounded bg-[#ba7df6] text-[#030712] font-semibold hover:bg-[#c994f8] transition-colors"
        >
          Log In
        </Link>
        <Link
          href="/auth/signup"
          className="px-6 py-3 rounded border border-[#ba7df6] text-[#ba7df6] font-semibold hover:bg-[#ba7df6]/10 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </main>
  )
}
