-- AlterTable
ALTER TABLE "user" ADD COLUMN     "department" TEXT,
ADD COLUMN     "job_title" TEXT,
ADD COLUMN     "supervisor_id" INTEGER;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
