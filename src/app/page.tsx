import { redirect } from 'next/navigation'
import { getSessionDM } from '@/lib/auth'
import Link from 'next/link'

export default async function HomePage() {
  const dm = await getSessionDM()

  if (dm) {
    redirect('/campaigns')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <h1 className="font-fantasy text-4xl text-amber-400 mb-4">D&amp;D Session Planner</h1>
      <p className="text-gray-400 mb-8 text-center max-w-sm">
        Coordinate your group&apos;s availability without the back-and-forth.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="px-6 py-3 rounded bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 transition-colors"
        >
          Log In
        </Link>
        <Link
          href="/auth/signup"
          className="px-6 py-3 rounded border border-amber-500 text-amber-400 font-semibold hover:bg-amber-500/10 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </main>
  )
}
