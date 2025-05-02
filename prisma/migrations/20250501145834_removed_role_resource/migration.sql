/*
  Warnings:

  - The primary key for the `role_resource_action` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `resourceActionId` on the `role_resource_action` table. All the data in the column will be lost.
  - You are about to drop the `role_resource` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "role_resource" DROP CONSTRAINT "role_resource_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "role_resource" DROP CONSTRAINT "role_resource_roleId_fkey";

-- AlterTable
ALTER TABLE "role_resource_action" DROP CONSTRAINT "role_resource_action_pkey",
DROP COLUMN "resourceActionId",
ADD COLUMN     "roleResourceActionId" SERIAL NOT NULL,
ADD CONSTRAINT "role_resource_action_pkey" PRIMARY KEY ("roleResourceActionId");

-- DropTable
DROP TABLE "role_resource";
