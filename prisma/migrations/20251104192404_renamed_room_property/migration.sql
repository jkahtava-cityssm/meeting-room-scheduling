-- DropForeignKey
ALTER TABLE "room" DROP CONSTRAINT "room_room_category_id_fkey";

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_room_category_id_fkey" FOREIGN KEY ("room_category_id") REFERENCES "room_category"("room_category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
