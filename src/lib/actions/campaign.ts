'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function createCampaign(_prevState: unknown, formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const dmName = (formData.get('dmName') as string)?.trim()
  const startVal = formData.get('planningWindowStart') as string
  const endVal = formData.get('planningWindowEnd') as string
  const playerNames = (formData.getAll('playerName') as string[]).filter(n => n.trim())

  if (!name || !dmName || !startVal || !endVal || playerNames.length === 0) {
    return { error: 'All fields are required, and at least one player slot must be added.' }
  }

  const planningWindowStart = new Date(startVal)
  const planningWindowEnd = new Date(endVal)

  if (planningWindowEnd <= planningWindowStart) {
    return { error: 'End date must be after start date.' }
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      dmName,
      planningWindowStart,
      planningWindowEnd,
      playerSlots: {
        create: playerNames.map(n => ({ name: n.trim() })),
      },
    },
  })

  redirect(`/campaigns/${campaign.id}`)
}
