/*
  Warnings:

  - You are about to drop the `EventRecipient` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventRecipient" DROP CONSTRAINT "EventRecipient_created_by_fkey";

-- DropForeignKey
ALTER TABLE "EventRecipient" DROP CONSTRAINT "EventRecipient_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventRecipient" DROP CONSTRAINT "EventRecipient_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "EventRecipient" DROP CONSTRAINT "EventRecipient_userId_fkey";

-- DropTable
DROP TABLE "EventRecipient";

-- CreateTable
CREATE TABLE "even_recipient" (
    "event_recipient_id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "even_recipient_pkey" PRIMARY KEY ("event_recipient_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "even_recipient_eventId_userId_key" ON "even_recipient"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "even_recipient" ADD CONSTRAINT "even_recipient_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "even_recipient" ADD CONSTRAINT "even_recipient_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "even_recipient" ADD CONSTRAINT "even_recipient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "even_recipient" ADD CONSTRAINT "even_recipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
