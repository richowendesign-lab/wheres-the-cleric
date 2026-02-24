import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { UpdatePlanningWindowForm } from '@/components/UpdatePlanningWindowForm'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { playerSlots: { orderBy: { createdAt: 'asc' } } },
  })

  if (!campaign) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <h1 className="font-fantasy text-3xl text-amber-400 mb-1">{campaign.name}</h1>
          <p className="text-gray-400 text-sm">Organised by {campaign.dmName}</p>
        </div>

        {/* Invite Links */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Player Invite Links</h2>
          <div className="space-y-3">
            {campaign.playerSlots.map(slot => {
              const inviteUrl = `${baseUrl}/invite/${slot.inviteToken}`
              return (
                <div
                  key={slot.id}
                  className="flex items-center gap-3 bg-gray-900 rounded-lg px-4 py-3"
                >
                  <span className="font-medium text-gray-100 w-28 shrink-0">{slot.name}</span>
                  <span className="flex-1 text-gray-400 text-sm truncate font-mono">{inviteUrl}</span>
                  <CopyLinkButton url={inviteUrl} />
                </div>
              )
            })}
          </div>
        </section>

        {/* Planning Window */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Planning Window</h2>
          <UpdatePlanningWindowForm campaign={campaign} />
        </section>
      </div>
    </main>
  )
}
