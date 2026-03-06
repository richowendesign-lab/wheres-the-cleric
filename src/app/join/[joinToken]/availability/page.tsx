import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { AvailabilityForm } from '@/components/AvailabilityForm'

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ joinToken: string }>
}) {
  const { joinToken } = await params

  // Verify the campaign exists
  const campaign = await prisma.campaign.findUnique({
    where: { joinToken },
  })

  if (!campaign) {
    notFound()
  }

  const cookieStore = await cookies()
  const playerIdCookie = cookieStore.get('player_id')?.value

  // No player_id cookie — send back to register
  if (!playerIdCookie) {
    redirect(`/join/${joinToken}`)
  }

  // Load the player slot with entries and campaign
  const slot = await prisma.playerSlot.findUnique({
    where: { id: playerIdCookie },
    include: {
      availabilityEntries: true,
      campaign: {
        select: {
          id: true,
          joinToken: true,
          planningWindowStart: true,
          planningWindowEnd: true,
        },
      },
    },
  })

  // Stale cookie — no matching slot
  if (!slot) {
    redirect(`/join/${joinToken}`)
  }

  // Cookie belongs to a different campaign — treat as new visitor
  if (slot.campaignId !== campaign.id) {
    redirect(`/join/${joinToken}`)
  }

  // Serialize data for AvailabilityForm
  const serializedEntries = slot.availabilityEntries.map(e => ({
    id: e.id,
    type: e.type,
    dayOfWeek: e.dayOfWeek,
    date: e.date?.toISOString() ?? null,
    timeOfDay: e.timeOfDay,
    status: e.status,
  }))

  const windowStart = slot.campaign.planningWindowStart?.toISOString().split('T')[0] ?? ''
  const windowEnd = slot.campaign.planningWindowEnd?.toISOString().split('T')[0] ?? ''

  return (
    <main className="min-h-screen text-gray-100 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-fantasy text-3xl text-white mb-4">{slot.name}&apos;s Availability</h1>
        {(campaign.name || campaign.description) && (
          <div className="bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-muted)] rounded-lg px-4 py-3 mb-8">
            {campaign.name && (
              <p className="font-fantasy text-sm text-[var(--dnd-accent)] mb-0.5">{campaign.name}</p>
            )}
            {campaign.description && (
              <p className="text-xs text-[var(--dnd-text-muted)] leading-relaxed">{campaign.description}</p>
            )}
          </div>
        )}
        <AvailabilityForm
          playerSlotId={slot.id}
          planningWindowStart={windowStart}
          planningWindowEnd={windowEnd}
          initialEntries={serializedEntries}
        />
      </div>
    </main>
  )
}
