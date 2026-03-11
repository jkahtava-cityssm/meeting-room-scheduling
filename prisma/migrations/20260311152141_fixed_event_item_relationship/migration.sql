/*
  Warnings:

  - You are about to drop the `_EventItemToItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_EventItemToItem" DROP CONSTRAINT "_EventItemToItem_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventItemToItem" DROP CONSTRAINT "_EventItemToItem_B_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_event_item_id_fkey";

-- DropTable
DROP TABLE "_EventItemToItem";

-- AddForeignKey
ALTER TABLE "event_item" ADD CONSTRAINT "event_item_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_item" ADD CONSTRAINT "event_item_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;
