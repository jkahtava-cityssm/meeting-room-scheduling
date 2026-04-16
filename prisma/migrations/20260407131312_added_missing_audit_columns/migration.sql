/*
  Warnings:

  - Added the required column `updated_at` to the `event_room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `sso_provider` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event_room" 
ADD COLUMN     "created_by" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "updated_by" INTEGER;

-- AlterTable
ALTER TABLE "sso_provider" 
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_by" INTEGER;

UPDATE "event_room" 
SET "updated_at" = UpdateList."updated_at"
FROM
(SELECT "event_id","updated_at" FROM "event") AS UpdateList
WHERE UpdateList."event_id" = "event_room"."event_id";

ALTER TABLE "event_room" 
ALTER COLUMN "updated_at" SET NOT NULL;

ALTER TABLE "sso_provider" 
ALTER COLUMN "updated_at" DROP DEFAULT;


-- AddForeignKey
ALTER TABLE "event_room" ADD CONSTRAINT "event_room_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_room" ADD CONSTRAINT "event_room_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
