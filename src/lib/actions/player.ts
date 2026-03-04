'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function registerPlayer(_prevState: unknown, formData: FormData) {
  const rawName = formData.get('name') as string
  const campaignId = formData.get('campaignId') as string
  const joinToken = formData.get('joinToken') as string

  const trimmedName = (rawName ?? '').trim()

  if (!trimmedName) {
    return { error: 'Please enter your name.' }
  }

  if (trimmedName.length > 50) {
    return { error: 'Name must be 50 characters or fewer.' }
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      maxPlayers: true,
      _count: { select: { playerSlots: true } },
    },
  })

  if (!campaign) {
    return { error: 'Campaign not found.' }
  }

  if (campaign.maxPlayers !== null && campaign._count.playerSlots >= campaign.maxPlayers) {
    return { error: 'This campaign is full. No more players can join.' }
  }

  const slot = await prisma.playerSlot.create({
    data: { campaignId, name: trimmedName },
  })

  const cookieStore = await cookies()
  cookieStore.set('player_id', slot.id, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  redirect(`/join/${joinToken}/availability`)
}
