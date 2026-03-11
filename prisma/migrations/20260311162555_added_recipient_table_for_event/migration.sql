-- CreateTable
CREATE TABLE "EventRecipient" (
    "event_recipient_id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "EventRecipient_pkey" PRIMARY KEY ("event_recipient_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventRecipient_eventId_userId_key" ON "EventRecipient"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "EventRecipient" ADD CONSTRAINT "EventRecipient_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRecipient" ADD CONSTRAINT "EventRecipient_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRecipient" ADD CONSTRAINT "EventRecipient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRecipient" ADD CONSTRAINT "EventRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
