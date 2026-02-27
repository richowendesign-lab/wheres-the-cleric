-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dmName" TEXT NOT NULL,
    "planningWindowStart" TIMESTAMP(3),
    "planningWindowEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSlot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityEntry" (
    "id" TEXT NOT NULL,
    "playerSlotId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "date" TIMESTAMP(3),
    "timeOfDay" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSlot_inviteToken_key" ON "PlayerSlot"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityEntry_playerSlotId_date_key" ON "AvailabilityEntry"("playerSlotId", "date");

-- AddForeignKey
ALTER TABLE "PlayerSlot" ADD CONSTRAINT "PlayerSlot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityEntry" ADD CONSTRAINT "AvailabilityEntry_playerSlotId_fkey" FOREIGN KEY ("playerSlotId") REFERENCES "PlayerSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
