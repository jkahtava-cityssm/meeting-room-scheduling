-- AlterTable
ALTER TABLE "room" ADD COLUMN     "room_scope_id" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "room_scope" (
    "room_scope_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "access_level" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "room_scope_pkey" PRIMARY KEY ("room_scope_id")
);

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_room_scope_id_fkey" FOREIGN KEY ("room_scope_id") REFERENCES "room_scope"("room_scope_id") ON DELETE RESTRICT ON UPDATE CASCADE;
