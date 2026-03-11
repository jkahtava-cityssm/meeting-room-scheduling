/*
  Warnings:

  - You are about to drop the `even_recipient` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "even_recipient" DROP CONSTRAINT "even_recipient_created_by_fkey";

-- DropForeignKey
ALTER TABLE "even_recipient" DROP CONSTRAINT "even_recipient_eventId_fkey";

-- DropForeignKey
ALTER TABLE "even_recipient" DROP CONSTRAINT "even_recipient_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "even_recipient" DROP CONSTRAINT "even_recipient_userId_fkey";

-- DropTable
DROP TABLE "even_recipient";

-- CreateTable
CREATE TABLE "event_recipient" (
    "event_recipient_id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "event_recipient_pkey" PRIMARY KEY ("event_recipient_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_recipient_eventId_userId_key" ON "event_recipient"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "event_recipient" ADD CONSTRAINT "event_recipient_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_recipient" ADD CONSTRAINT "event_recipient_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_recipient" ADD CONSTRAINT "event_recipient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_recipient" ADD CONSTRAINT "event_recipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
