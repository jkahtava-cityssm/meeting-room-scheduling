/*
  Warnings:

  - You are about to drop the column `selectedDayId` on the `recurrence` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "recurrence_selectedDayId_key";

-- AlterTable
ALTER TABLE "recurrence" DROP COLUMN "selectedDayId";
