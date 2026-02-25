import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AvailabilityForm } from '@/components/AvailabilityForm'

export const metadata = {
  title: 'D&D Session Planner',
}

function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start || !end) return 'Dates to be confirmed'
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return `${fmt(start)} – ${fmt(end)}`
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const slot = await prisma.playerSlot.findUnique({
    where: { inviteToken: token },
    include: {
      campaign: {
        include: {
          playerSlots: {
            select: { id: true, name: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
      availabilityEntries: true,
    },
  })

  if (!slot) notFound()

  const { campaign } = slot
  const fellows = campaign.playerSlots.filter(s => s.id !== slot.id)
  const dateRange = formatDateRange(campaign.planningWindowStart, campaign.planningWindowEnd)

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-amber-500 uppercase tracking-widest mb-1">D&D Session Planner</p>
          <h1 className="font-fantasy text-3xl text-amber-400">{campaign.name}</h1>
          <p className="text-gray-400 mt-1">{campaign.dmName} is organising this campaign</p>
        </div>
      </div>

      {/* Player info */}
      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        <div>
          <p className="text-sm text-gray-400 mb-1">Your seat</p>
          <p className="text-2xl font-semibold text-gray-100">{slot.name}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Planning window</p>
          <p className="text-gray-100">{dateRange}</p>
        </div>

        {fellows.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Playing with</p>
            <div className="flex flex-wrap gap-2">
              {fellows.map(f => (
                <span
                  key={f.id}
                  className="px-3 py-1 rounded-full bg-gray-800 text-gray-200 text-sm"
                >
                  {f.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Availability Form */}
        <div className="pt-4 border-t border-gray-800">
          <AvailabilityForm
            playerSlotId={slot.id}
            planningWindowStart={campaign.planningWindowStart?.toISOString() ?? ''}
            planningWindowEnd={campaign.planningWindowEnd?.toISOString() ?? ''}
            initialEntries={slot.availabilityEntries.map(e => ({
              id: e.id,
              type: e.type,
              dayOfWeek: e.dayOfWeek,
              date: e.date?.toISOString() ?? null,
              timeOfDay: e.timeOfDay,
              status: e.status,
            }))}
          />
        </div>
      </div>
    </main>
  )
}
