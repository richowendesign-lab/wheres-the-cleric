import { notFound } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { computeDayStatuses } from '@/lib/availability'
import { EditableCampaignField } from '@/components/EditableCampaignField'
import { updateCampaignName, updateCampaignDescription } from '@/lib/actions/campaign'
import { ShareModal } from '@/components/ShareModal'
import { CampaignTabs } from '@/components/CampaignTabs'
import { AppNav } from '@/components/AppNav'

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
    <>
      <AppNav />
      <main className="min-h-screen text-gray-100 px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Breadcrumb + Title + description — stays outside tabs */}
        <div className="flex flex-col gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] mb-1">
            <Link href="/campaigns" className="text-[var(--dnd-text-muted)] hover:text-white transition-colors">Dashboard</Link>
            <span className="text-[var(--dnd-border-muted)] select-none">/</span>
            <span className="text-[var(--dnd-text-muted)] truncate max-w-[250px]">{campaign.name || 'Untitled Campaign'}</span>
          </nav>
          <EditableCampaignField campaignId={campaign.id} value={campaign.name} onSave={updateCampaignName} variant="title" placeholder="Campaign name" />
          <EditableCampaignField campaignId={campaign.id} value={campaign.description} onSave={updateCampaignDescription} variant="description" placeholder="Add a description for your players…" emptyLabel="No description — click to add one" />
        </div>

        {/* Tab component — receives all pre-fetched serialised data */}
        <CampaignTabs
          campaignId={campaign.id}
          joinUrl={joinUrl}
          windowStartStr={windowStartStr}
          windowEndStr={windowEndStr}
          dayAggregations={dayAggregations}
          playerSlots={serializedSlots.map(s => ({ id: s.id, name: s.name }))}
          missingPlayers={missingPlayers.map(s => ({ id: s.id, name: s.name }))}
          dmExceptionDates={dmExceptionDates}
          dmExceptionMode={dmExceptionMode}
          maxPlayers={campaign.maxPlayers}
          playerSlotCount={campaign.playerSlots.length}
        />

        {/* ShareModal — stays outside tabs (triggered by ?share=1) */}
        {share === '1' && <ShareModal joinUrl={joinUrl} />}
        </div>
      </main>
    </>
  )
}
