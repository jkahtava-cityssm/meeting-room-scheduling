/*
  Warnings:

  - Added the required column `name` to the `configuration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "configuration" ADD COLUMN     "name" TEXT NOT NULL;
