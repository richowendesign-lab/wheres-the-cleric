import Link from 'next/link'

export default function InviteNotFound() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="text-5xl mb-4">🗡️</div>
        <h1 className="font-fantasy text-2xl text-amber-400">This link doesn&apos;t look right</h1>
        <p className="text-gray-400">
          Ask your DM to resend your invite link — this one may be outdated or incorrect.
        </p>
      </div>
    </main>
  )
}
