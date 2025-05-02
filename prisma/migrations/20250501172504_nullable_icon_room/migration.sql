/*
  Warnings:

  - You are about to drop the column `image` on the `room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "room" DROP COLUMN "image",
ADD COLUMN     "icon" TEXT;
