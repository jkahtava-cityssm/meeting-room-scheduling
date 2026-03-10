/*
  Warnings:

  - You are about to drop the column `name` on the `event_item` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[event_id,item_id]` on the table `event_item` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `event_id` to the `event_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `item_id` to the `event_item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event_item" DROP COLUMN "name",
ADD COLUMN     "event_id" INTEGER NOT NULL,
ADD COLUMN     "item_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "item" (
    "item_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "item_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "_EventItemToItem" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_EventItemToItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_name_key" ON "item"("name");

-- CreateIndex
CREATE INDEX "_EventItemToItem_B_index" ON "_EventItemToItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "event_item_event_id_item_id_key" ON "event_item"("event_id", "item_id");

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventItemToItem" ADD CONSTRAINT "_EventItemToItem_A_fkey" FOREIGN KEY ("A") REFERENCES "event_item"("event_item_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventItemToItem" ADD CONSTRAINT "_EventItemToItem_B_fkey" FOREIGN KEY ("B") REFERENCES "item"("item_id") ON DELETE CASCADE ON UPDATE CASCADE;
