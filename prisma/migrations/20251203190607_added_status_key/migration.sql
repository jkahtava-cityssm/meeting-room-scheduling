/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `status` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `status` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "status" ADD COLUMN     "key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "status_key_key" ON "status"("key");
