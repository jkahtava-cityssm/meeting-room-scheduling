-- CreateTable
CREATE TABLE "event_status_history" (
    "history_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" INTEGER NOT NULL,

    CONSTRAINT "event_status_history_pkey" PRIMARY KEY ("history_id")
);

-- AddForeignKey
ALTER TABLE "event_status_history" ADD CONSTRAINT "event_status_history_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_status_history" ADD CONSTRAINT "event_status_history_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "status"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_status_history" ADD CONSTRAINT "event_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
