/*
  Warnings:

  - You are about to drop the `resource_action` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "resource_action" DROP CONSTRAINT "resource_action_actionId_fkey";

-- DropForeignKey
ALTER TABLE "resource_action" DROP CONSTRAINT "resource_action_resourceId_fkey";

-- DropTable
DROP TABLE "resource_action";

-- CreateTable
CREATE TABLE "role_resource_action" (
    "resourceActionId" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "actionId" INTEGER NOT NULL,
    "permit" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_resource_action_pkey" PRIMARY KEY ("resourceActionId")
);

-- AddForeignKey
ALTER TABLE "role_resource_action" ADD CONSTRAINT "role_resource_action_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("roleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_resource_action" ADD CONSTRAINT "role_resource_action_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resource"("resourceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_resource_action" ADD CONSTRAINT "role_resource_action_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "action"("actionId") ON DELETE CASCADE ON UPDATE CASCADE;
