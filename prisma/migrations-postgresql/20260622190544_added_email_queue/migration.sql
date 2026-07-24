-- CreateTable
CREATE TABLE "email_queue" (
    "email_queue_id" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "event_id" INTEGER NOT NULL,
    "email_context" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("email_queue_id")
);

-- CreateIndex
CREATE INDEX "email_queue_event_id_status_idx" ON "email_queue"("event_id", "status");
