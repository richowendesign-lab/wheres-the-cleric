import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionDM } from '@/lib/auth'
import { logOut } from '@/lib/actions/auth'

export default async function CampaignsPage() {
  const dm = await getSessionDM()
  if (!dm) redirect('/auth/login')

  const campaigns = await prisma.campaign.findMany({
    where: { dmId: dm.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true },
  })

  return (
    <main className="min-h-screen text-gray-100 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-fantasy text-3xl text-white">Your Campaigns</h1>
          <form action={logOut}>
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors underline"
            >
              Log out
            </button>
          </form>
        </div>

        {/* Create new campaign button */}
        <Link
          href="/campaigns/new"
          className="inline-block px-6 py-3 rounded bg-[#ba7df6] text-[#030712] font-semibold hover:bg-[#c994f8] transition-colors"
        >
          Create new campaign
        </Link>

        {/* Campaign list or empty state */}
        {campaigns.length === 0 ? (
          <div className="mt-8">
            <p className="text-gray-500">No campaigns yet.</p>
            <p className="text-gray-600 text-sm mt-1">Click the button above to create your first one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-8">
            {campaigns.map(campaign => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="block bg-[#140326]/60 border border-[#53366D] rounded-lg px-6 py-4 hover:border-[#ba7df6] transition-colors"
              >
                <h2 className="text-lg font-semibold text-white">
                  {campaign.name ?? 'Untitled Campaign'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">View dashboard &rarr;</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
