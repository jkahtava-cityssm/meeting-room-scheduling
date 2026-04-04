-- CreateTable
CREATE TABLE "event_room" (
    "event_room_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "room_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_room_pkey" PRIMARY KEY ("event_room_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_room_event_id_room_id_key" ON "event_room"("event_id", "room_id");

-- AddForeignKey
ALTER TABLE "event_room" ADD CONSTRAINT "event_room_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_room" ADD CONSTRAINT "event_room_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("room_id") ON DELETE CASCADE ON UPDATE CASCADE;



-- MigrateData
INSERT INTO "event_room" ("event_id", "room_id", "created_at")
SELECT "event_id", "room_id", CURRENT_TIMESTAMP
FROM "event";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_room_id_fkey";

-- AlterTable
ALTER TABLE "event" DROP COLUMN "room_id";
