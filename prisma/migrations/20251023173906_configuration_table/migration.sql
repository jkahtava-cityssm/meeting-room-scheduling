-- CreateTable
CREATE TABLE "configuration" (
    "configuration_id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuration_pkey" PRIMARY KEY ("configuration_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuration_key_key" ON "configuration"("key");
