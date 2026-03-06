/*
  Warnings:

  - You are about to drop the column `room_scope_id` on the `room` table. All the data in the column will be lost.
  - You are about to drop the `room_scope` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "room" DROP CONSTRAINT "room_room_scope_id_fkey";

-- AlterTable
ALTER TABLE "room" DROP COLUMN "room_scope_id",
ADD COLUMN     "public_facing" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "room_category_id" DROP DEFAULT;

-- DropTable
DROP TABLE "room_scope";

-- CreateTable
CREATE TABLE "room_role" (
    "room_role_id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_role_pkey" PRIMARY KEY ("room_role_id")
);

-- CreateIndex
CREATE INDEX "roomrole_role_idx" ON "room_role"("role_id");

-- CreateIndex
CREATE INDEX "roomrole_room_idx" ON "room_role"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_role_room_id_role_id_key" ON "room_role"("room_id", "role_id");

-- AddForeignKey
ALTER TABLE "room_role" ADD CONSTRAINT "room_role_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("room_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_role" ADD CONSTRAINT "room_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;
