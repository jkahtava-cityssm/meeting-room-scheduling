/*
  Warnings:

  - You are about to drop the column `room_tag` on the `room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "room" DROP COLUMN "room_tag",
ADD COLUMN     "room_category_id" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "room_category" (
    "room_category_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_category_pkey" PRIMARY KEY ("room_category_id")
);

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_room_category_id_fkey" FOREIGN KEY ("room_category_id") REFERENCES "room_category"("room_category_id") ON DELETE CASCADE ON UPDATE CASCADE;
