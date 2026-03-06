import Link from 'next/link'
import Image from 'next/image'
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-fantasy text-3xl text-white">Your Campaigns</h1>
          <form action={logOut}>
            <button type="submit" className="text-sm text-[var(--dnd-text-muted)] hover:text-gray-200 transition-colors underline">
              Log out
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          {campaigns.map(campaign => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="block bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-6 py-4 hover:bg-[var(--dnd-card-hover)] hover:border-[var(--dnd-accent)] transition-colors"
            >
              <h2 className="text-[18px] font-semibold text-[var(--dnd-accent)] truncate">
                {campaign.name ?? 'Untitled Campaign'}
              </h2>
              <p className="text-sm text-[var(--dnd-text-muted)] mt-1">View dashboard →</p>
            </Link>
          ))}

          {/* Visual create card */}
          <Link
            href="/campaigns/new"
            className="block bg-[var(--dnd-card-bg)] border border-dashed border-[var(--dnd-border-card)] rounded-lg px-6 py-8 hover:bg-[var(--dnd-card-hover)] hover:border-[var(--dnd-accent)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[18px] font-semibold text-[var(--dnd-accent)]">Start a new adventure</span>
                <span className="text-sm text-[var(--dnd-text-muted)]">Create new campaign →</span>
              </div>
              <Image src="/create-campaign-art.png" alt="" width={112} height={112} className="rounded-lg object-cover shrink-0" />
            </div>
          </Link>
        </div>

        {campaigns.length === 0 && (
          <p className="text-[var(--dnd-text-muted)] text-sm mt-4">No campaigns yet. Click the card above to create your first one.</p>
        )}
      </div>
    </main>
  )
}
