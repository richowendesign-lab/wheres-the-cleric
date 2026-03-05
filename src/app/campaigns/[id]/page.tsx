import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { UpdatePlanningWindowForm } from '@/components/UpdatePlanningWindowForm'
import { UpdateMaxPlayersForm } from '@/components/UpdateMaxPlayersForm'
import { computeDayStatuses } from '@/lib/availability'
import { DashboardCalendar } from '@/components/DashboardCalendar'
import { BestDaysList } from '@/components/BestDaysList'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { DeleteCampaignButton } from '@/components/DeleteCampaignButton'
import { logOut } from '@/lib/actions/auth'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      playerSlots: {
        include: { availabilityEntries: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!campaign) notFound()

  // Serialize playerSlots for client components (Date -> string)
  const serializedSlots = campaign.playerSlots.map(slot => ({
    id: slot.id,
    name: slot.name,
    availabilityEntries: slot.availabilityEntries.map(e => ({
      id: e.id,
      type: e.type,
      dayOfWeek: e.dayOfWeek,
      date: e.date?.toISOString() ?? null,
      timeOfDay: e.timeOfDay,
      status: e.status,
    })),
  }))

  // Convert planning window Date objects to ISO strings (null if not set)
  const windowStartStr = campaign.planningWindowStart?.toISOString().split('T')[0] ?? null
  const windowEndStr = campaign.planningWindowEnd?.toISOString().split('T')[0] ?? null

  // Compute aggregates server-side
  const dayAggregations = (windowStartStr && windowEndStr)
    ? computeDayStatuses(serializedSlots, windowStartStr, windowEndStr)
    : []

  // Construct join URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const joinUrl = `${appUrl}/join/${campaign.joinToken}`

  // Detect missing players (zero total availability entries)
  const missingPlayers = campaign.playerSlots.filter(
    slot => slot.availabilityEntries.length === 0
  )

  return (
    <main className="min-h-screen text-gray-100 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <Link href="/campaigns" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white hover:underline transition-colors">
            ← Back
          </Link>
          <form action={logOut}>
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors underline"
            >
              Log out
            </button>
          </form>
        </div>

        <h1 className="font-fantasy text-3xl text-white mb-1">
          {campaign.name ?? 'Campaign Dashboard'}
        </h1>

        {campaign.description && (
          <p className="text-gray-400 text-sm leading-relaxed -mt-2">{campaign.description}</p>
        )}

        {/* Join Link */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Join Link</h2>
          <p className="text-sm text-gray-400 mb-3">
            Share this link with your players. Anyone who visits it can join the campaign.
          </p>
          <div className="flex items-center gap-3 bg-[#200637] border border-[#ba7df6]/30 rounded px-4 py-3">
            <span className="flex-1 text-sm font-mono text-[#ba7df6] truncate">{joinUrl}</span>
            <CopyLinkButton url={joinUrl} />
          </div>
          <UpdateMaxPlayersForm
            key={String(campaign.maxPlayers ?? '')}
            campaignId={campaign.id}
            currentMax={campaign.maxPlayers}
            currentCount={campaign.playerSlots.length}
          />
        </section>

        {/* Planning Window */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Planning Window</h2>
          <UpdatePlanningWindowForm campaign={campaign} />
        </section>

        {/* Divider */}
        <hr className="border-[#53366D]" />

        {/* Missing Players */}
        {missingPlayers.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Awaiting Response</h2>
            <div className="flex flex-wrap gap-2">
              {missingPlayers.map(slot => (
                <span
                  key={slot.id}
                  className="bg-purple-950/40 border border-[#53366D] text-gray-400 text-sm rounded-md px-3 py-1.5"
                >
                  {slot.name}
                </span>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-2">
              {missingPlayers.length === 1
                ? '1 player has not yet submitted availability.'
                : `${missingPlayers.length} players have not yet submitted availability.`}
            </p>
          </section>
        )}

        {/* Availability + Best Days side by side */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Availability Calendar */}
          <section className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white mb-4">Group Availability</h2>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" />Free
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-600" />No response
              </span>
            </div>
            <DashboardCalendar
              dayAggregations={dayAggregations}
              playerSlots={serializedSlots.map(s => ({ id: s.id, name: s.name }))}
              windowStart={windowStartStr ?? ''}
              windowEnd={windowEndStr ?? ''}
            />
          </section>

          {/* Best Days */}
          <section className="w-full lg:w-72 shrink-0">
            <BestDaysList
              days={dayAggregations}
              playerSlots={serializedSlots.map(s => ({ id: s.id, name: s.name }))}
            />
          </section>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-[#53366D] pt-6 mt-4">
          <h2 className="text-lg font-semibold text-white mb-3">Danger Zone</h2>
          <DeleteCampaignButton campaignId={campaign.id} />
        </div>
      </div>
    </main>
  )
}
