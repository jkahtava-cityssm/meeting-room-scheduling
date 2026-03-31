
-- AlterTable


ALTER TABLE "user" RENAME COLUMN "employee_active" TO "is_active";
ALTER TABLE "user" RENAME COLUMN "employee_number" TO "external_id";
ALTER TABLE "user" RENAME COLUMN "receive_emails" TO "email_enabled";
ALTER TABLE "user" RENAME COLUMN "is_external" TO "is_managed";

ALTER TABLE "user" ALTER COLUMN "email_enabled" SET DEFAULT true;
ALTER TABLE "user" ALTER COLUMN "is_active" SET DEFAULT true;
ALTER TABLE "user" ALTER COLUMN "is_managed" SET DEFAULT true;
