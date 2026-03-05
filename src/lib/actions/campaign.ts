'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getSessionDM } from '@/lib/auth'

export async function createCampaign(_prevState: unknown, formData: FormData) {
  const dm = await getSessionDM()
  if (!dm) {
    return { error: 'You must be logged in to create a campaign.' }
  }

  const rawName = formData.get('name') as string
  const rawDescription = formData.get('description') as string
  const rawMaxPlayers = formData.get('maxPlayers') as string
  const startVal = formData.get('planningWindowStart') as string
  const endVal = formData.get('planningWindowEnd') as string

  const trimmedName = (rawName ?? '').trim()
  if (!trimmedName) {
    return { error: 'Campaign name is required.' }
  }

  const trimmedDescription = (rawDescription ?? '').trim()

  let parsedMaxPlayers: number | null = null
  if (rawMaxPlayers && rawMaxPlayers.trim() !== '') {
    const parsed = parseInt(rawMaxPlayers, 10)
    if (isNaN(parsed) || parsed <= 0) {
      return { error: 'Max players must be a positive number.' }
    }
    parsedMaxPlayers = parsed
  }

  if (!startVal || !endVal) {
    return { error: 'Both dates are required.' }
  }

  const planningWindowStart = new Date(startVal)
  const planningWindowEnd = new Date(endVal)

  if (planningWindowEnd <= planningWindowStart) {
    return { error: 'End date must be after start date.' }
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: trimmedName,
      description: trimmedDescription || null,
      maxPlayers: parsedMaxPlayers,
      dmId: dm.id,
      planningWindowStart,
      planningWindowEnd,
    },
  })

  redirect(`/campaigns/${campaign.id}`)
}

export async function deleteCampaign(campaignId: string) {
  await prisma.campaign.delete({ where: { id: campaignId } })
  const cookieStore = await cookies()
  cookieStore.delete('dm_secret')
  redirect('/')
}

export async function updateMaxPlayers(campaignId: string, _prevState: unknown, formData: FormData) {
  const rawMaxPlayers = formData.get('maxPlayers') as string

  let parsedMaxPlayers: number | null = null
  if (rawMaxPlayers && rawMaxPlayers.trim() !== '') {
    const parsed = parseInt(rawMaxPlayers, 10)
    if (isNaN(parsed) || parsed <= 0) {
      return { error: 'Max players must be a positive number.' }
    }
    parsedMaxPlayers = parsed
  }

  if (parsedMaxPlayers !== null) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { _count: { select: { playerSlots: true } } },
    })
    if (campaign && parsedMaxPlayers < campaign._count.playerSlots) {
      return { error: `Can't set below current player count (${campaign._count.playerSlots}).` }
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { maxPlayers: parsedMaxPlayers },
  })

  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true }
}

export async function updatePlanningWindow(campaignId: string, _prevState: unknown, formData: FormData) {
  const startVal = formData.get('planningWindowStart') as string
  const endVal = formData.get('planningWindowEnd') as string

  if (!startVal || !endVal) {
    return { error: 'Both dates are required.' }
  }

  const planningWindowStart = new Date(startVal)
  const planningWindowEnd = new Date(endVal)

  if (planningWindowEnd <= planningWindowStart) {
    return { error: 'End date must be after start date.' }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { planningWindowStart, planningWindowEnd },
  })

  return { success: true }
}
