/*
  Warnings:

  - You are about to drop the column `period` on the `recurrence` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[selectedDayId]` on the table `recurrence` will be added. If there are existing duplicate values, this will fail.
  - Made the column `totalOccurrences` on table `recurrence` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "recurrence" DROP COLUMN "period",
ADD COLUMN     "daySpan" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "friday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthSpan" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "saturday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "selectedDayId" INTEGER,
ADD COLUMN     "sunday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "thursday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tuesday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wednesday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weekSpan" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "yearSpan" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "totalOccurrences" SET NOT NULL,
ALTER COLUMN "totalOccurrences" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "recurrence_selectedDayId_key" ON "recurrence"("selectedDayId");
