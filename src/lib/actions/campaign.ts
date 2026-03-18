'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
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

  redirect(`/campaigns/${campaign.id}?share=1`)
}

export async function deleteCampaign(campaignId: string) {
  const dm = await getSessionDM()
  if (!dm) return { error: 'Not authenticated' }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { dmId: true } })
  if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

  await prisma.campaign.delete({ where: { id: campaignId } })
  redirect('/')
}

export async function updateMaxPlayers(campaignId: string, _prevState: unknown, formData: FormData) {
  const dm = await getSessionDM()
  if (!dm) return { error: 'Not authenticated' }

  const rawMaxPlayers = formData.get('maxPlayers') as string

  let parsedMaxPlayers: number | null = null
  if (rawMaxPlayers && rawMaxPlayers.trim() !== '') {
    const parsed = parseInt(rawMaxPlayers, 10)
    if (isNaN(parsed) || parsed <= 0) {
      return { error: 'Max players must be a positive number.' }
    }
    parsedMaxPlayers = parsed
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { dmId: true, _count: { select: { playerSlots: true } } },
  })
  if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

  if (parsedMaxPlayers !== null && parsedMaxPlayers < campaign._count.playerSlots) {
    return { error: `Can't set below current player count (${campaign._count.playerSlots}).` }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { maxPlayers: parsedMaxPlayers },
  })

  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true }
}

export async function updateCampaignName(campaignId: string, name: string) {
  const dm = await getSessionDM()
  if (!dm) return { error: 'Not authenticated' }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { dmId: true } })
  if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

  const trimmed = name.trim()
  if (!trimmed) return { error: 'Campaign name is required.' }
  if (trimmed.length > 100) return { error: 'Campaign name must be 100 characters or fewer.' }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { name: trimmed },
  })

  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true }
}

export async function updateCampaignDescription(campaignId: string, description: string) {
  const dm = await getSessionDM()
  if (!dm) return { error: 'Not authenticated' }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { dmId: true } })
  if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

  const trimmed = description.trim()
  if (trimmed.length > 500) return { error: 'Description must be 500 characters or fewer.' }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { description: trimmed || null },
  })

  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true }
}

export async function toggleDmException(
  campaignId: string,
  date: string,   // 'YYYY-MM-DD'
  isBlocked: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    const dm = await getSessionDM()
    if (!dm) return { error: 'Not authenticated' }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { dmId: true } })
    if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

    const [y, m, d] = date.split('-').map(Number)
    const parsedDate = new Date(Date.UTC(y, m - 1, d))

    if (!isBlocked) {
      // Toggle off — remove the exception
      await prisma.dmAvailabilityException.deleteMany({
        where: { campaignId, date: parsedDate },
      })
    } else {
      // Toggle on — safe upsert via @@unique
      await prisma.dmAvailabilityException.upsert({
        where: { campaignId_date: { campaignId, date: parsedDate } },
        update: {},
        create: { campaignId, date: parsedDate },
      })
    }
    revalidatePath(`/campaigns/${campaignId}`)

    // Propagate to sync-enabled sibling campaigns
    const siblings = await prisma.campaign.findMany({
      where: {
        dmId: dm.id,
        id: { not: campaignId },
        dmSyncEnabled: true,
      },
      select: {
        id: true,
        planningWindowStart: true,
        planningWindowEnd: true,
      },
    })

    for (const sibling of siblings) {
      if (!sibling.planningWindowStart || !sibling.planningWindowEnd) continue
      if (parsedDate < sibling.planningWindowStart || parsedDate > sibling.planningWindowEnd) continue

      if (!isBlocked) {
        await prisma.dmAvailabilityException.deleteMany({
          where: { campaignId: sibling.id, date: parsedDate },
        })
      } else {
        await prisma.dmAvailabilityException.upsert({
          where: { campaignId_date: { campaignId: sibling.id, date: parsedDate } },
          update: {},
          create: { campaignId: sibling.id, date: parsedDate },
        })
      }
      revalidatePath(`/campaigns/${sibling.id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('toggleDmException error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}

export async function setDmExceptionMode(
  campaignId: string,
  mode: 'block' | 'flag'
): Promise<{ success: true } | { error: string }> {
  try {
    const dm = await getSessionDM()
    if (!dm) return { error: 'Not authenticated' }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { dmId: true } })
    if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { dmExceptionMode: mode },
    })

    revalidatePath(`/campaigns/${campaignId}`)
    return { success: true }
  } catch (error) {
    console.error('setDmExceptionMode error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}

export async function setDmSyncEnabled(
  campaignId: string,
  enabled: boolean
): Promise<{ success: true } | { error: string }> {
  try {
    const dm = await getSessionDM()
    if (!dm) return { error: 'Not authenticated' }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { dmId: true },
    })
    if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { dmSyncEnabled: enabled },
    })

    revalidatePath(`/campaigns/${campaignId}`)
    return { success: true }
  } catch (error) {
    console.error('setDmSyncEnabled error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}

export async function removePlayer(
  campaignId: string,
  playerSlotId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const dm = await getSessionDM()
    if (!dm) return { error: 'Not authenticated' }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { dmId: true } })
    if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

    await prisma.playerSlot.delete({ where: { id: playerSlotId } })

    revalidatePath(`/campaigns/${campaignId}`)
    return { success: true }
  } catch (error) {
    console.error('removePlayer error:', error)
    return { error: 'Failed to remove player. Please try again.' }
  }
}

export async function updatePlanningWindow(campaignId: string, _prevState: unknown, formData: FormData) {
  const dm = await getSessionDM()
  if (!dm) return { error: 'Not authenticated' }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { dmId: true } })
  if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }

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

  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true }
}
