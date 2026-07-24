/*
  Warnings:

  - Added the required column `uid` to the `event` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[event] ADD [sequence] INT NOT NULL CONSTRAINT [event_sequence_df] DEFAULT 0,
[uid] NVARCHAR(255) NULL;

UPDATE [dbo].[event]
SET [uid] = 'event-' + CAST([event_id] AS NVARCHAR(20)) + '@migration_update'
WHERE [uid] IS NULL;

ALTER TABLE [dbo].[event] 
ALTER COLUMN [uid] NVARCHAR(255) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
