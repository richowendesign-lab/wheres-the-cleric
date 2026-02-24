import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'prisma/dev.db')
const adapter = new PrismaBetterSqlite3({ url: dbPath })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Clear existing seed data (idempotent re-runs)
  await prisma.availabilityEntry.deleteMany()
  await prisma.playerSlot.deleteMany()
  await prisma.campaign.deleteMany()

  // Create demo campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Curse of Strahd',
      dmName: 'Richard',
      planningWindowStart: new Date('2026-03-01'),
      planningWindowEnd: new Date('2026-03-31'),
      playerSlots: {
        create: [
          { name: 'Aragorn' },
          { name: 'Gandalf' },
          { name: 'Legolas' },
          { name: 'Gimli' },
        ],
      },
    },
    include: { playerSlots: true },
  })

  console.log('Seeded campaign:', campaign.name)
  console.log('Player slots:')
  campaign.playerSlots.forEach((slot) => {
    console.log(`  - ${slot.name}: /invite/${slot.inviteToken}`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
