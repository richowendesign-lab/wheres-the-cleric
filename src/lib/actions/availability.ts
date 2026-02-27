'use server'

import { prisma } from '@/lib/prisma'

/**
 * Atomically replace all weekly availability entries for a player slot.
 * Deletes existing 'weekly' type entries, then recreates them from the provided list.
 * Each entry in `entries` represents one (dayOfWeek, timeOfDay) selection.
 *
 * Does NOT call revalidatePath — the client manages its own optimistic state.
 */
export async function saveWeeklyPattern(
  playerSlotId: string,
  entries: { dayOfWeek: number }[]
): Promise<{ success: true } | { error: string }> {
  try {
    await prisma.$transaction([
      prisma.availabilityEntry.deleteMany({
        where: { playerSlotId, type: 'weekly' },
      }),
      prisma.availabilityEntry.createMany({
        data: entries.map(e => ({
          playerSlotId,
          type: 'weekly',
          dayOfWeek: e.dayOfWeek,
          status: 'free',
        })),
      }),
    ])
    return { success: true }
  } catch (error) {
    console.error('saveWeeklyPattern error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}

/**
 * Toggle a date-specific override entry for a player slot.
 *
 * @param playerSlotId - The player slot to update
 * @param date - ISO date string in "YYYY-MM-DD" format
 * @param status - 'free' or 'busy' to set an override; null to remove the override
 *
 * Uses Date.UTC to avoid timezone shift when converting ISO date strings to Date objects.
 * Uses the @@unique([playerSlotId, date]) composite accessor for upsert.
 *
 * Does NOT call revalidatePath — the client manages its own optimistic state.
 */
export async function toggleDateOverride(
  playerSlotId: string,
  date: string,
  status: 'free' | 'busy' | null
): Promise<{ success: true } | { error: string }> {
  try {
    const [y, m, d] = date.split('-').map(Number)
    const parsedDate = new Date(Date.UTC(y, m - 1, d))

    if (status === null) {
      await prisma.availabilityEntry.deleteMany({
        where: { playerSlotId, type: 'override', date: parsedDate },
      })
    } else {
      await prisma.availabilityEntry.upsert({
        where: {
          playerSlotId_date: { playerSlotId, date: parsedDate },
        },
        update: { status },
        create: {
          playerSlotId,
          type: 'override',
          date: parsedDate,
          status,
        },
      })
    }
    return { success: true }
  } catch (error) {
    console.error('toggleDateOverride error:', error)
    return { error: 'Failed to save. Please try again.' }
  }
}
