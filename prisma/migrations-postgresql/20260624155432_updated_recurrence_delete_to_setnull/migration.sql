-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_recurrence_id_fkey";

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_recurrence_id_fkey" FOREIGN KEY ("recurrence_id") REFERENCES "recurrence"("recurrence_id") ON DELETE SET NULL ON UPDATE CASCADE;
