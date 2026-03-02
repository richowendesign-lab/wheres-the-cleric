import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function HomePage() {
  const cookieStore = await cookies()
  const dmSecret = cookieStore.get('dm_secret')?.value

  if (dmSecret) {
    const campaign = await prisma.campaign.findUnique({
      where: { dmSecret },
      select: { id: true },
    })
    if (campaign) {
      redirect(`/campaigns/${campaign.id}`)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <h1 className="font-fantasy text-4xl text-amber-400 mb-4">D&D Session Planner</h1>
      <p className="text-gray-400 mb-8 text-center max-w-sm">
        Coordinate your group&apos;s availability without the back-and-forth.
      </p>
      <Link
        href="/campaigns/new"
        className="px-6 py-3 rounded bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400"
      >
        Create a Campaign
      </Link>
    </main>
  )
}
