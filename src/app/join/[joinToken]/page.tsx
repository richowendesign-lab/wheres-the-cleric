import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { registerPlayer } from '@/lib/actions/player'
import JoinForm from './JoinForm'

export default async function JoinPage({
  params,
}: {
  params: Promise<{ joinToken: string }>
}) {
  const { joinToken } = await params

  const campaign = await prisma.campaign.findUnique({
    where: { joinToken },
    include: { playerSlots: { select: { id: true } } },
  })

  if (!campaign) {
    notFound()
  }

  const cookieStore = await cookies()

  // DM redirect — if the dm_secret cookie matches this campaign
  const dmSecret = cookieStore.get('dm_secret')?.value
  if (dmSecret && dmSecret === campaign.dmSecret) {
    redirect(`/campaigns/${campaign.id}`)
  }

  // Returning player redirect — if player_id cookie matches a slot in this campaign
  const playerIdCookie = cookieStore.get('player_id')?.value
  if (playerIdCookie && campaign.playerSlots.some((slot) => slot.id === playerIdCookie)) {
    redirect(`/join/${joinToken}/availability`)
  }

  // New visitor — render name entry form
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-fantasy text-3xl text-amber-400 mb-2 text-center">
          Join the Campaign
        </h1>
        <p className="text-gray-400 mb-8 text-center">Enter your name to get started.</p>
        <JoinForm
          action={registerPlayer}
          campaignId={campaign.id}
          joinToken={joinToken}
        />
      </div>
    </main>
  )
}
