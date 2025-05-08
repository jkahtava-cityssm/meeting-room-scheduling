-- CreateTable
CREATE TABLE "recurrence" (
    "recurrenceId" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurrence_pkey" PRIMARY KEY ("recurrenceId")
);

-- CreateTable
CREATE TABLE "event" (
    "eventId" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parentEventId" INTEGER,

    CONSTRAINT "event_pkey" PRIMARY KEY ("eventId")
);

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "event"("eventId") ON DELETE SET NULL ON UPDATE CASCADE;
