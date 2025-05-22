/*
  Warnings:

  - You are about to drop the column `daySpan` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `friday` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `monday` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `monthSpan` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `pattern` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `saturday` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `sunday` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `thursday` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `totalOccurrences` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `tuesday` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `wednesday` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `weekSpan` on the `recurrence` table. All the data in the column will be lost.
  - You are about to drop the column `yearSpan` on the `recurrence` table. All the data in the column will be lost.
  - Added the required column `rule` to the `recurrence` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "recurrence" DROP COLUMN "daySpan",
DROP COLUMN "friday",
DROP COLUMN "monday",
DROP COLUMN "monthSpan",
DROP COLUMN "pattern",
DROP COLUMN "saturday",
DROP COLUMN "sunday",
DROP COLUMN "thursday",
DROP COLUMN "totalOccurrences",
DROP COLUMN "tuesday",
DROP COLUMN "type",
DROP COLUMN "wednesday",
DROP COLUMN "weekSpan",
DROP COLUMN "yearSpan",
ADD COLUMN     "recurrenceCancellationId" INTEGER,
ADD COLUMN     "recurrenceExceptionId" INTEGER,
ADD COLUMN     "rule" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "recurrence_cancellation" (
    "recurrenceCancellationId" SERIAL NOT NULL,
    "recurrenceDate" TIMESTAMP(3) NOT NULL,
    "cancellationDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurrence_cancellation_pkey" PRIMARY KEY ("recurrenceCancellationId")
);

-- CreateTable
CREATE TABLE "recurrence_exception" (
    "recurrenceExceptionId" SERIAL NOT NULL,
    "recurrenceDate" TIMESTAMP(3) NOT NULL,
    "rescheduledDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurrence_exception_pkey" PRIMARY KEY ("recurrenceExceptionId")
);

-- AddForeignKey
ALTER TABLE "recurrence" ADD CONSTRAINT "recurrence_recurrenceCancellationId_fkey" FOREIGN KEY ("recurrenceCancellationId") REFERENCES "recurrence_cancellation"("recurrenceCancellationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence" ADD CONSTRAINT "recurrence_recurrenceExceptionId_fkey" FOREIGN KEY ("recurrenceExceptionId") REFERENCES "recurrence_exception"("recurrenceExceptionId") ON DELETE SET NULL ON UPDATE CASCADE;
