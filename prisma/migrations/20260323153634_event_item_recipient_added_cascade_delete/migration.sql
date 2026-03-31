-- DropForeignKey
ALTER TABLE "event_item" DROP CONSTRAINT "event_item_event_id_fkey";

-- DropForeignKey
ALTER TABLE "event_item" DROP CONSTRAINT "event_item_item_id_fkey";

-- AddForeignKey
ALTER TABLE "event_item" ADD CONSTRAINT "event_item_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_item" ADD CONSTRAINT "event_item_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("item_id") ON DELETE CASCADE ON UPDATE CASCADE;
