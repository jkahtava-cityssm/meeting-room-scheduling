-- AlterTable
ALTER TABLE "room" ALTER COLUMN "icon" SET DEFAULT 'none';

-- AlterTable
ALTER TABLE "status" ADD COLUMN     "icon" TEXT DEFAULT 'none';
