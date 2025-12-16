/*
  Warnings:

  - You are about to drop the column `issue` on the `sso_provider` table. All the data in the column will be lost.
  - Added the required column `issuer` to the `sso_provider` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sso_provider" DROP COLUMN "issue",
ADD COLUMN     "issuer" TEXT NOT NULL;
