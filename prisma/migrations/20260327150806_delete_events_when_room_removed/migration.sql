-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_room_id_fkey";

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("room_id") ON DELETE CASCADE ON UPDATE CASCADE;
