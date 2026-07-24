/*
  Warnings:

  - Added the required column `uid` to the `event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event" ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "uid" TEXT;

UPDATE "event" 
SET "uid" = CONCAT('event-', "event_id", '@migration_update');

ALTER TABLE "event" 
ALTER COLUMN "uid" SET NOT NULL;