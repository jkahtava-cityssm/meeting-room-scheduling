/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "uuid" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "user_uuid_key" ON "user"("uuid");
