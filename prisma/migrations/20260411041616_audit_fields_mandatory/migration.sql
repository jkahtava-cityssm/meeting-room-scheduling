/*
  Warnings:

  - Made the column `created_by` on table `action` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `action` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `configuration` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `configuration` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `event_item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `event_item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `event_recipient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `event_recipient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `event_room` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `event_room` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `recurrence` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `recurrence` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `recurrence_cancellation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `recurrence_cancellation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `recurrence_exception` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `recurrence_exception` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `resource` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `resource` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `resource_action` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `resource_action` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `role_resource_action` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `role_resource_action` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `room` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `room` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `room_category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `room_category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `room_property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `room_property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `room_role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `room_role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `sso_provider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `sso_provider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `status` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `status` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `user_account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `user_account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `user_role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `user_role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `user_session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `user_session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `user_verification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_by` on table `user_verification` required. This step will fail if there are existing NULL values in that column.

*/
INSERT INTO "user" (
    user_id, 
    name, 
    email, 
    email_verified, 
    external_id, 
    is_active, 
    created_by, 
    updated_by, 
    created_at, 
    updated_at
) 
VALUES (
    0, 
    'SYSTEM', 
    '', 
    false, 
    '000', 
    false, 
    0, -- The system user is created by itself
    0, -- and updated by itself
    NOW(), 
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    external_id = EXCLUDED.external_id;

-- user_session
UPDATE "user_session" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "user_session" SET updated_by = 0 WHERE updated_by IS NULL;

-- user_account
UPDATE "user_account" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "user_account" SET updated_by = 0 WHERE updated_by IS NULL;

-- user_verification
UPDATE "user_verification" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "user_verification" SET updated_by = 0 WHERE updated_by IS NULL;

-- sso_provider
UPDATE "sso_provider" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "sso_provider" SET updated_by = 0 WHERE updated_by IS NULL;

-- room
UPDATE "room" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "room" SET updated_by = 0 WHERE updated_by IS NULL;

-- room_category
UPDATE "room_category" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "room_category" SET updated_by = 0 WHERE updated_by IS NULL;

-- room_property
UPDATE "room_property" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "room_property" SET updated_by = 0 WHERE updated_by IS NULL;

-- room_role
UPDATE "room_role" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "room_role" SET updated_by = 0 WHERE updated_by IS NULL;

-- property
UPDATE "property" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "property" SET updated_by = 0 WHERE updated_by IS NULL;

-- user_role
UPDATE "user_role" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "user_role" SET updated_by = 0 WHERE updated_by IS NULL;

-- role
UPDATE "role" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "role" SET updated_by = 0 WHERE updated_by IS NULL;

-- resource_action
UPDATE "resource_action" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "resource_action" SET updated_by = 0 WHERE updated_by IS NULL;

-- role_resource_action
UPDATE "role_resource_action" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "role_resource_action" SET updated_by = 0 WHERE updated_by IS NULL;

-- resource
UPDATE "resource" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "resource" SET updated_by = 0 WHERE updated_by IS NULL;

-- action
UPDATE "action" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "action" SET updated_by = 0 WHERE updated_by IS NULL;

-- recurrence
UPDATE "recurrence" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "recurrence" SET updated_by = 0 WHERE updated_by IS NULL;

-- recurrence_cancellation
UPDATE "recurrence_cancellation" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "recurrence_cancellation" SET updated_by = 0 WHERE updated_by IS NULL;

-- recurrence_exception
UPDATE "recurrence_exception" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "recurrence_exception" SET updated_by = 0 WHERE updated_by IS NULL;

-- event
UPDATE "event" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "event" SET updated_by = 0 WHERE updated_by IS NULL;

-- event_room
UPDATE "event_room" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "event_room" SET updated_by = 0 WHERE updated_by IS NULL;

-- event_recipient
UPDATE "event_recipient" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "event_recipient" SET updated_by = 0 WHERE updated_by IS NULL;

-- event_item
UPDATE "event_item" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "event_item" SET updated_by = 0 WHERE updated_by IS NULL;

-- item
UPDATE "item" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "item" SET updated_by = 0 WHERE updated_by IS NULL;

-- status
UPDATE "status" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "status" SET updated_by = 0 WHERE updated_by IS NULL;

-- configuration
UPDATE "configuration" SET created_by = 0 WHERE created_by IS NULL;
UPDATE "configuration" SET updated_by = 0 WHERE updated_by IS NULL;


-- DropForeignKey
ALTER TABLE "action" DROP CONSTRAINT "action_created_by_fkey";

-- DropForeignKey
ALTER TABLE "action" DROP CONSTRAINT "action_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "configuration" DROP CONSTRAINT "configuration_created_by_fkey";

-- DropForeignKey
ALTER TABLE "configuration" DROP CONSTRAINT "configuration_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_created_by_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "event_item" DROP CONSTRAINT "event_item_created_by_fkey";

-- DropForeignKey
ALTER TABLE "event_item" DROP CONSTRAINT "event_item_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "event_recipient" DROP CONSTRAINT "event_recipient_created_by_fkey";

-- DropForeignKey
ALTER TABLE "event_recipient" DROP CONSTRAINT "event_recipient_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "event_room" DROP CONSTRAINT "event_room_created_by_fkey";

-- DropForeignKey
ALTER TABLE "event_room" DROP CONSTRAINT "event_room_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "item" DROP CONSTRAINT "item_created_by_fkey";

-- DropForeignKey
ALTER TABLE "item" DROP CONSTRAINT "item_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "property" DROP CONSTRAINT "property_created_by_fkey";

-- DropForeignKey
ALTER TABLE "property" DROP CONSTRAINT "property_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "recurrence" DROP CONSTRAINT "recurrence_created_by_fkey";

-- DropForeignKey
ALTER TABLE "recurrence" DROP CONSTRAINT "recurrence_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "recurrence_cancellation" DROP CONSTRAINT "recurrence_cancellation_created_by_fkey";

-- DropForeignKey
ALTER TABLE "recurrence_cancellation" DROP CONSTRAINT "recurrence_cancellation_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "recurrence_exception" DROP CONSTRAINT "recurrence_exception_created_by_fkey";

-- DropForeignKey
ALTER TABLE "recurrence_exception" DROP CONSTRAINT "recurrence_exception_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "resource" DROP CONSTRAINT "resource_created_by_fkey";

-- DropForeignKey
ALTER TABLE "resource" DROP CONSTRAINT "resource_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "resource_action" DROP CONSTRAINT "resource_action_created_by_fkey";

-- DropForeignKey
ALTER TABLE "resource_action" DROP CONSTRAINT "resource_action_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "role" DROP CONSTRAINT "role_created_by_fkey";

-- DropForeignKey
ALTER TABLE "role" DROP CONSTRAINT "role_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "role_resource_action" DROP CONSTRAINT "role_resource_action_created_by_fkey";

-- DropForeignKey
ALTER TABLE "role_resource_action" DROP CONSTRAINT "role_resource_action_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "room" DROP CONSTRAINT "room_created_by_fkey";

-- DropForeignKey
ALTER TABLE "room" DROP CONSTRAINT "room_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "room_category" DROP CONSTRAINT "room_category_created_by_fkey";

-- DropForeignKey
ALTER TABLE "room_category" DROP CONSTRAINT "room_category_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "room_property" DROP CONSTRAINT "room_property_created_by_fkey";

-- DropForeignKey
ALTER TABLE "room_property" DROP CONSTRAINT "room_property_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "room_role" DROP CONSTRAINT "room_role_created_by_fkey";

-- DropForeignKey
ALTER TABLE "room_role" DROP CONSTRAINT "room_role_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "status" DROP CONSTRAINT "status_created_by_fkey";

-- DropForeignKey
ALTER TABLE "status" DROP CONSTRAINT "status_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "user_account" DROP CONSTRAINT "user_account_created_by_fkey";

-- DropForeignKey
ALTER TABLE "user_account" DROP CONSTRAINT "user_account_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_created_by_fkey";

-- DropForeignKey
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "user_session" DROP CONSTRAINT "user_session_created_by_fkey";

-- DropForeignKey
ALTER TABLE "user_session" DROP CONSTRAINT "user_session_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "user_verification" DROP CONSTRAINT "user_verification_created_by_fkey";

-- DropForeignKey
ALTER TABLE "user_verification" DROP CONSTRAINT "user_verification_updated_by_fkey";

-- AlterTable
ALTER TABLE "action" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "configuration" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "event" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "event_item" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "event_recipient" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "event_room" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "item" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "property" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "recurrence" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "recurrence_cancellation" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "recurrence_exception" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "resource" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "resource_action" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "role" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "role_resource_action" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "room" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "room_category" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "room_property" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "room_role" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "sso_provider" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "status" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_account" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_role" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_session" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_verification" ALTER COLUMN "created_by" SET NOT NULL,
ALTER COLUMN "updated_by" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_verification" ADD CONSTRAINT "user_verification_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_verification" ADD CONSTRAINT "user_verification_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_category" ADD CONSTRAINT "room_category_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_category" ADD CONSTRAINT "room_category_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_property" ADD CONSTRAINT "room_property_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_property" ADD CONSTRAINT "room_property_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_role" ADD CONSTRAINT "room_role_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_role" ADD CONSTRAINT "room_role_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_action" ADD CONSTRAINT "resource_action_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_action" ADD CONSTRAINT "resource_action_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_resource_action" ADD CONSTRAINT "role_resource_action_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_resource_action" ADD CONSTRAINT "role_resource_action_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action" ADD CONSTRAINT "action_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action" ADD CONSTRAINT "action_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence" ADD CONSTRAINT "recurrence_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence" ADD CONSTRAINT "recurrence_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence_cancellation" ADD CONSTRAINT "recurrence_cancellation_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence_cancellation" ADD CONSTRAINT "recurrence_cancellation_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence_exception" ADD CONSTRAINT "recurrence_exception_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrence_exception" ADD CONSTRAINT "recurrence_exception_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_room" ADD CONSTRAINT "event_room_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_room" ADD CONSTRAINT "event_room_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_recipient" ADD CONSTRAINT "event_recipient_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_recipient" ADD CONSTRAINT "event_recipient_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_item" ADD CONSTRAINT "event_item_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_item" ADD CONSTRAINT "event_item_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status" ADD CONSTRAINT "status_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status" ADD CONSTRAINT "status_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration" ADD CONSTRAINT "configuration_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration" ADD CONSTRAINT "configuration_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
