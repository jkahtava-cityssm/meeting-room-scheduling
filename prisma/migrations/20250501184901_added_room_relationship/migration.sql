/*
  Warnings:

  - Added the required column `timeFormat` to the `member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "member" ADD COLUMN     "timeFormat" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "room"("roomId") ON DELETE RESTRICT ON UPDATE CASCADE;
