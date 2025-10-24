-- AlterTable
ALTER TABLE "room" ADD COLUMN     "room_tag" TEXT;

-- CreateTable
CREATE TABLE "room_property" (
    "room_property_id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_property_pkey" PRIMARY KEY ("room_property_id")
);

-- AddForeignKey
ALTER TABLE "room_property" ADD CONSTRAINT "room_property_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("room_id") ON DELETE CASCADE ON UPDATE CASCADE;
