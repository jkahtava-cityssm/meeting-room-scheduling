-- CreateTable
CREATE TABLE "system_process" (
    "system_process_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "pid" INTEGER NOT NULL,
    "parameter" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER NOT NULL,

    CONSTRAINT "system_process_pkey" PRIMARY KEY ("system_process_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_process_key_key" ON "system_process"("key");

-- AddForeignKey
ALTER TABLE "system_process" ADD CONSTRAINT "system_process_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_process" ADD CONSTRAINT "system_process_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
