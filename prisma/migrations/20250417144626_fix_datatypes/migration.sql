/*
  Warnings:

  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `emailVerified` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "accessToken" DROP NOT NULL,
ALTER COLUMN "refreshToken" DROP NOT NULL,
ALTER COLUMN "accessTokenExpiresAt" DROP NOT NULL,
ALTER COLUMN "refreshTokenExpiresAt" DROP NOT NULL,
ALTER COLUMN "scope" DROP NOT NULL,
ALTER COLUMN "idToken" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "ipAddress" DROP NOT NULL,
ALTER COLUMN "userAgent" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL,
DROP COLUMN "emailVerified",
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL;
