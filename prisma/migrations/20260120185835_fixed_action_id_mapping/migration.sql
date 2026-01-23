/*
  Warnings:

  - The primary key for the `action` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `actionId` on the `action` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "resource_action" DROP CONSTRAINT "resource_action_action_id_fkey";

-- AlterTable
ALTER TABLE "action" DROP CONSTRAINT "action_pkey",
DROP COLUMN "actionId",
ADD COLUMN     "action_id" SERIAL NOT NULL,
ADD CONSTRAINT "action_pkey" PRIMARY KEY ("action_id");

-- AddForeignKey
ALTER TABLE "resource_action" ADD CONSTRAINT "resource_action_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "action"("action_id") ON DELETE CASCADE ON UPDATE CASCADE;
