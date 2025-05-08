/*
  Warnings:

  - You are about to drop the `Action` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Member` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MemberRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResourceAction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoleResource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_userId_fkey";

-- DropForeignKey
ALTER TABLE "MemberRole" DROP CONSTRAINT "MemberRole_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MemberRole" DROP CONSTRAINT "MemberRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "ResourceAction" DROP CONSTRAINT "ResourceAction_actionId_fkey";

-- DropForeignKey
ALTER TABLE "ResourceAction" DROP CONSTRAINT "ResourceAction_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "RoleResource" DROP CONSTRAINT "RoleResource_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "RoleResource" DROP CONSTRAINT "RoleResource_roleId_fkey";

-- DropTable
DROP TABLE "Action";

-- DropTable
DROP TABLE "Member";

-- DropTable
DROP TABLE "MemberRole";

-- DropTable
DROP TABLE "Resource";

-- DropTable
DROP TABLE "ResourceAction";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "RoleResource";

-- DropTable
DROP TABLE "Room";

-- CreateTable
CREATE TABLE "room" (
    "roomId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("roomId")
);

-- CreateTable
CREATE TABLE "member" (
    "memberId" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("memberId")
);

-- CreateTable
CREATE TABLE "member_role" (
    "memberRoleId" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_role_pkey" PRIMARY KEY ("memberRoleId")
);

-- CreateTable
CREATE TABLE "role" (
    "roleId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("roleId")
);

-- CreateTable
CREATE TABLE "role_resource" (
    "roleResourceId" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_resource_pkey" PRIMARY KEY ("roleResourceId")
);

-- CreateTable
CREATE TABLE "resource" (
    "resourceId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_pkey" PRIMARY KEY ("resourceId")
);

-- CreateTable
CREATE TABLE "resource_action" (
    "resourceActionId" SERIAL NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "actionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_action_pkey" PRIMARY KEY ("resourceActionId")
);

-- CreateTable
CREATE TABLE "action" (
    "actionId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_pkey" PRIMARY KEY ("actionId")
);

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_role" ADD CONSTRAINT "member_role_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("memberId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_role" ADD CONSTRAINT "member_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("roleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_resource" ADD CONSTRAINT "role_resource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resource"("resourceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_resource" ADD CONSTRAINT "role_resource_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("roleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_action" ADD CONSTRAINT "resource_action_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resource"("resourceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_action" ADD CONSTRAINT "resource_action_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "action"("actionId") ON DELETE CASCADE ON UPDATE CASCADE;
