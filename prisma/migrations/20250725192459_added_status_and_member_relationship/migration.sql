-- AlterTable
ALTER TABLE "event" ADD COLUMN     "memberId" INTEGER,
ADD COLUMN     "statusId" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "status" (
    "statusId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_pkey" PRIMARY KEY ("statusId")
);

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("memberId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "status"("statusId") ON DELETE RESTRICT ON UPDATE CASCADE;
