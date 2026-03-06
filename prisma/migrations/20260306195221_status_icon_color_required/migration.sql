/*
  Warnings:

  - Made the column `icon` on table `status` required. This step will fail if there are existing NULL values in that column.
  - Made the column `color` on table `status` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "status" ALTER COLUMN "icon" SET NOT NULL,
ALTER COLUMN "color" SET NOT NULL;
