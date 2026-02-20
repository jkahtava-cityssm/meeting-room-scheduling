/*
  Warnings:

  - Added the required column `type` to the `configuration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "configuration" ADD COLUMN     "type" TEXT NOT NULL;
