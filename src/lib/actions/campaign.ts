'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function createCampaign(_prevState: unknown, formData: FormData) {
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

  const campaign = await prisma.campaign.create({
    data: { planningWindowStart, planningWindowEnd },
  })

  const cookieStore = await cookies()
  cookieStore.set('dm_secret', campaign.dmSecret, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })

  redirect(`/campaigns/${campaign.id}`)
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
