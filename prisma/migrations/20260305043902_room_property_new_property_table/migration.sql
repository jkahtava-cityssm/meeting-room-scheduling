/*
  Warnings:

  - You are about to drop the column `name` on the `room_property` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[room_id,property_id]` on the table `room_property` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `property_id` to the `room_property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "room_property" DROP COLUMN "name",
ADD COLUMN     "property_id" INTEGER NOT NULL,
ALTER COLUMN "value" DROP NOT NULL;

-- CreateTable
CREATE TABLE "property" (
    "property_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_pkey" PRIMARY KEY ("property_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_name_key" ON "property"("name");

-- CreateIndex
CREATE UNIQUE INDEX "room_property_room_id_property_id_key" ON "room_property"("room_id", "property_id");

-- AddForeignKey
ALTER TABLE "room_property" ADD CONSTRAINT "room_property_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("property_id") ON DELETE RESTRICT ON UPDATE CASCADE;
