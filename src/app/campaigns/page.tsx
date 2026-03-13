import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSessionDM } from '@/lib/auth'
import { logOut } from '@/lib/actions/auth'
import { HowItWorksButton } from '@/components/HowItWorksButton'

export default async function CampaignsPage() {
  const dm = await getSessionDM()
  if (!dm) redirect('/auth/login')

  const campaigns = await prisma.campaign.findMany({
    where: { dmId: dm.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      planningWindowStart: true,
      planningWindowEnd: true,
      _count: { select: { playerSlots: true } },
    },
  })

  return (
    <main className="min-h-screen text-gray-100 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--dnd-text-muted)] mb-2">
              Dungeon Master Portal
            </p>
            <h1 className="font-fantasy text-3xl text-white">Your Campaigns</h1>
          </div>
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
        </div>

        <div className="flex flex-col gap-4">
          {campaigns.map(campaign => {
            const { planningWindowStart: start, planningWindowEnd: end } = campaign
            const windowLabel = start && end
              ? (() => {
                  const sameYear = start.getFullYear() === end.getFullYear()
                  const fmt = (d: Date, yr: boolean) =>
                    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(yr ? { year: 'numeric' } : {}) })
                  return `${fmt(start, !sameYear)} – ${fmt(end, true)}`
                })()
              : null
            const playerCount = campaign._count.playerSlots

            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="flex items-center gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-6 py-4 hover:bg-[var(--dnd-card-hover)] hover:border-[var(--dnd-accent)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-[18px] font-semibold text-[var(--dnd-accent)] truncate">
                    {campaign.name ?? 'Untitled Campaign'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {windowLabel && (
                      <span className="text-sm text-[var(--dnd-text-muted)]">Planning: {windowLabel}</span>
                    )}
                    {windowLabel && playerCount > 0 && (
                      <span className="text-sm text-[var(--dnd-border-muted)] select-none">·</span>
                    )}
                    {playerCount > 0 && (
                      <span className="text-sm text-[var(--dnd-text-muted)]">
                        {playerCount} {playerCount === 1 ? 'player' : 'players'}
                      </span>
                    )}
                    {!windowLabel && playerCount === 0 && (
                      <span className="text-sm text-[var(--dnd-text-muted)]">No details yet</span>
                    )}
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-[var(--dnd-accent)] shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}

          {/* Visual create card */}
          <Link
            href="/campaigns/new"
            className="group flex items-center gap-4 bg-[var(--dnd-card-bg)] border-2 border-dashed border-[var(--dnd-border-card)] rounded-lg px-6 py-4 hover:bg-[var(--dnd-card-hover)] hover:border-[var(--dnd-accent)] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[18px] font-semibold text-[var(--dnd-accent)]">Start a new adventure</span>
              <p className="text-sm text-[var(--dnd-text-muted)] mt-1">Create new campaign</p>
            </div>
            <Image
              src="/create-campaign-art.png"
              alt=""
              width={72}
              height={72}
              className="rounded-lg object-cover shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>

      </div>
    </main>
  )
}
