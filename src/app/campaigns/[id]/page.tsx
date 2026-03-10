import { notFound } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { UpdatePlanningWindowForm } from '@/components/UpdatePlanningWindowForm'
import { UpdateMaxPlayersForm } from '@/components/UpdateMaxPlayersForm'
import { computeDayStatuses } from '@/lib/availability'
import { DashboardCalendar } from '@/components/DashboardCalendar'
import { BestDaysList } from '@/components/BestDaysList'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { DeleteCampaignButton } from '@/components/DeleteCampaignButton'
import { EditableCampaignField } from '@/components/EditableCampaignField'
import { logOut } from '@/lib/actions/auth'
import { updateCampaignName, updateCampaignDescription } from '@/lib/actions/campaign'
import { ShareModal } from '@/components/ShareModal'

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ share?: string }>
}) {
  const { id } = await params
  const { share } = await searchParams

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      playerSlots: { include: { availabilityEntries: true }, orderBy: { createdAt: 'asc' } },
      dmAvailabilityExceptions: true,
    },
  })
  if (!campaign) notFound()

  const serializedSlots = campaign.playerSlots.map(slot => ({
    id: slot.id,
    name: slot.name,
    availabilityEntries: slot.availabilityEntries.map(e => ({
      id: e.id, type: e.type, dayOfWeek: e.dayOfWeek,
      date: e.date?.toISOString() ?? null, timeOfDay: e.timeOfDay, status: e.status,
    })),
  }))

  const windowStartStr = campaign.planningWindowStart?.toISOString().split('T')[0] ?? null
  const windowEndStr = campaign.planningWindowEnd?.toISOString().split('T')[0] ?? null

  const dmExceptionDateKeys = new Set(
    campaign.dmAvailabilityExceptions.map(e =>
      e.date.toISOString().split('T')[0]
      // Safe: stored as UTC midnight by toggleDmException
    )
  )
  const dmExceptionDates = Array.from(dmExceptionDateKeys) // for DmExceptionCalendar prop

  const dayAggregations = (windowStartStr && windowEndStr)
    ? computeDayStatuses(serializedSlots, windowStartStr, windowEndStr, dmExceptionDateKeys) : []

  const dmExceptionMode = (campaign.dmExceptionMode === 'block' || campaign.dmExceptionMode === 'flag')
    ? campaign.dmExceptionMode
    : null

  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'localhost:3000'
  const proto = hdrs.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const joinUrl = `${proto}://${host}/join/${campaign.joinToken}`
  const missingPlayers = campaign.playerSlots.filter(s => s.availabilityEntries.length === 0)

  return (
    <main className="min-h-screen text-gray-100 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/campaigns" className="inline-flex items-center gap-1 text-sm text-[var(--dnd-text-muted)] hover:text-white hover:underline transition-colors">
            ← Back
          </Link>
          <form action={logOut}>
            <button type="submit" className="text-sm text-[var(--dnd-text-muted)] hover:text-gray-200 transition-colors underline">Log out</button>
          </form>
        </div>

        {/* Title + description — tight grouping */}
        <div className="flex flex-col gap-2">
          <EditableCampaignField campaignId={campaign.id} value={campaign.name} onSave={updateCampaignName} variant="title" placeholder="Campaign name" />
          <EditableCampaignField campaignId={campaign.id} value={campaign.description} onSave={updateCampaignDescription} variant="description" placeholder="Add a description for your players…" emptyLabel="No description — click to add one" />
        </div>

        {/* Join Link */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Join Link</h2>
          <p className="text-sm text-[var(--dnd-text-muted)] mb-3">Share this link with your players. Anyone who visits it can join the campaign.</p>
          <div className="flex items-center gap-3 bg-[var(--dnd-input-bg)] border border-[#ba7df6]/30 rounded px-4 py-3">
            <span className="flex-1 text-sm font-mono text-[var(--dnd-accent)] truncate">{joinUrl}</span>
            <CopyLinkButton url={joinUrl} />
          </div>
          <UpdateMaxPlayersForm key={String(campaign.maxPlayers ?? '')} campaignId={campaign.id} currentMax={campaign.maxPlayers} currentCount={campaign.playerSlots.length} />
        </section>

        {/* Planning Window */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Planning Window</h2>
          <UpdatePlanningWindowForm campaign={campaign} />
        </section>

        <hr className="border-[var(--dnd-border-muted)]" />

        {missingPlayers.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Awaiting Response</h2>
            <div className="flex flex-wrap gap-2">
              {missingPlayers.map(slot => (
                <span key={slot.id} className="bg-purple-950/40 border border-[var(--dnd-border-muted)] text-[var(--dnd-text-muted)] text-sm rounded-md px-3 py-1.5">
                  {slot.name}
                </span>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-2">
              {missingPlayers.length === 1 ? '1 player has not yet submitted availability.' : `${missingPlayers.length} players have not yet submitted availability.`}
            </p>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <section className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white mb-2">Group Availability</h2>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" />Free</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-600" />No response</span>
            </div>
            <DashboardCalendar dayAggregations={dayAggregations} playerSlots={serializedSlots.map(s => ({ id: s.id, name: s.name }))} windowStart={windowStartStr ?? ''} windowEnd={windowEndStr ?? ''} />
          </section>
          <section className="w-full lg:w-72 shrink-0">
            <BestDaysList days={dayAggregations} playerSlots={serializedSlots.map(s => ({ id: s.id, name: s.name }))} />
          </section>
        </div>

        <div className="border-t border-[var(--dnd-border-muted)] pt-6 mt-4">
          <h2 className="text-lg font-semibold text-white mb-3">Danger Zone</h2>
          <DeleteCampaignButton campaignId={campaign.id} />
        </div>

        {share === '1' && <ShareModal joinUrl={joinUrl} />}
      </div>
    </main>
  )
}
