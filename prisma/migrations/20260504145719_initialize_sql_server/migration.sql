BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[user] (
    [user_id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [email] NVARCHAR(255),
    [email_verified] BIT NOT NULL CONSTRAINT [user_email_verified_df] DEFAULT 0,
    [email_enabled] BIT NOT NULL CONSTRAINT [user_email_enabled_df] DEFAULT 1,
    [image] NVARCHAR(max),
    [uuid] NVARCHAR(36),
    [external_id] NVARCHAR(255),
    [department] NVARCHAR(255),
    [job_title] NVARCHAR(255),
    [supervisor_id] INT,
    [is_active] BIT NOT NULL CONSTRAINT [user_is_active_df] DEFAULT 1,
    [is_managed] BIT NOT NULL CONSTRAINT [user_is_managed_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [user_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT,
    [updated_by] INT,
    CONSTRAINT [user_pkey] PRIMARY KEY CLUSTERED ([user_id])
);

-- CreateTable
CREATE TABLE [dbo].[user_session] (
    [user_session_id] INT NOT NULL IDENTITY(1,1),
    [user_id] INT NOT NULL,
    [token] VARCHAR(2048) NOT NULL,
    [expires_at] DATETIME2 NOT NULL,
    [ip_address] NVARCHAR(255),
    [user_agent] NVARCHAR(1000),
    [impersonated_role] NVARCHAR(255),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [user_session_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT,
    [updated_by] INT,
    CONSTRAINT [user_session_pkey] PRIMARY KEY CLUSTERED ([user_session_id]),
    CONSTRAINT [user_session_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[user_account] (
    [user_account_id] INT NOT NULL IDENTITY(1,1),
    [user_id] INT NOT NULL,
    [account_id] VARCHAR(255) NOT NULL,
    [provider_id] VARCHAR(255) NOT NULL,
    [access_token] VARCHAR(max),
    [refresh_token] VARCHAR(2048),
    [access_token_expires_at] DATETIME2,
    [refresh_token_expires_at] DATETIME2,
    [scope] VARCHAR(255),
    [id_token] VARCHAR(2048),
    [password] VARCHAR(255),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [user_account_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT,
    [updated_by] INT,
    CONSTRAINT [user_account_pkey] PRIMARY KEY CLUSTERED ([user_account_id])
);

-- CreateTable
CREATE TABLE [dbo].[user_verification] (
    [user_verification_id] INT NOT NULL IDENTITY(1,1),
    [identifier] NVARCHAR(255) NOT NULL,
    [value] NVARCHAR(4000) NOT NULL,
    [expires_at] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [user_verification_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT,
    [updated_by] INT,
    CONSTRAINT [user_verification_pkey] PRIMARY KEY CLUSTERED ([user_verification_id])
);

-- CreateTable
CREATE TABLE [dbo].[sso_provider] (
    [sso_provider_id] INT NOT NULL IDENTITY(1,1),
    [issuer] NVARCHAR(255) NOT NULL,
    [domain] NVARCHAR(255) NOT NULL,
    [oidc_config] NVARCHAR(max),
    [saml_config] NVARCHAR(max),
    [user_id] INT,
    [provider_id] VARCHAR(255) NOT NULL,
    [organization_id] VARCHAR(255),
    [created_by] INT,
    [updated_by] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [sso_provider_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [sso_provider_pkey] PRIMARY KEY CLUSTERED ([sso_provider_id])
);

-- CreateTable
CREATE TABLE [dbo].[room] (
    [room_id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [color] NVARCHAR(255) NOT NULL,
    [icon] NVARCHAR(255) CONSTRAINT [room_icon_df] DEFAULT 'none',
    [public_facing] BIT NOT NULL CONSTRAINT [room_public_facing_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [room_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [room_category_id] INT NOT NULL,
    [display_order] INT,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [room_pkey] PRIMARY KEY CLUSTERED ([room_id])
);

-- CreateTable
CREATE TABLE [dbo].[room_category] (
    [room_category_id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [room_category_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [room_category_pkey] PRIMARY KEY CLUSTERED ([room_category_id])
);

-- CreateTable
CREATE TABLE [dbo].[room_property] (
    [room_property_id] INT NOT NULL IDENTITY(1,1),
    [room_id] INT NOT NULL,
    [property_id] INT NOT NULL,
    [value] NVARCHAR(255),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [room_property_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [room_property_pkey] PRIMARY KEY CLUSTERED ([room_property_id]),
    CONSTRAINT [room_property_room_id_property_id_key] UNIQUE NONCLUSTERED ([room_id],[property_id])
);

-- CreateTable
CREATE TABLE [dbo].[room_role] (
    [room_role_id] INT NOT NULL IDENTITY(1,1),
    [room_id] INT NOT NULL,
    [role_id] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [room_role_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [room_role_pkey] PRIMARY KEY CLUSTERED ([room_role_id]),
    CONSTRAINT [room_role_room_id_role_id_key] UNIQUE NONCLUSTERED ([room_id],[role_id])
);

-- CreateTable
CREATE TABLE [dbo].[property] (
    [property_id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [type] NVARCHAR(255) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [property_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [property_pkey] PRIMARY KEY CLUSTERED ([property_id]),
    CONSTRAINT [property_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[user_role] (
    [user_role_id] INT NOT NULL IDENTITY(1,1),
    [user_id] INT NOT NULL,
    [role_id] INT NOT NULL,
    [granted] BIT NOT NULL CONSTRAINT [user_role_granted_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [user_role_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [user_role_pkey] PRIMARY KEY CLUSTERED ([user_role_id]),
    CONSTRAINT [user_role_user_id_role_id_key] UNIQUE NONCLUSTERED ([user_id],[role_id])
);

-- CreateTable
CREATE TABLE [dbo].[role] (
    [role_id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [role_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [role_pkey] PRIMARY KEY CLUSTERED ([role_id])
);

-- CreateTable
CREATE TABLE [dbo].[resource_action] (
    [resource_action_id] INT NOT NULL IDENTITY(1,1),
    [resource_id] INT NOT NULL,
    [action_id] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [resource_action_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [resource_action_pkey] PRIMARY KEY CLUSTERED ([resource_action_id]),
    CONSTRAINT [resource_action_resource_id_action_id_key] UNIQUE NONCLUSTERED ([resource_id],[action_id])
);

-- CreateTable
CREATE TABLE [dbo].[role_resource_action] (
    [role_resource_action_id] INT NOT NULL IDENTITY(1,1),
    [role_id] INT NOT NULL,
    [resource_action_id] INT NOT NULL,
    [permit] BIT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [role_resource_action_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [role_resource_action_pkey] PRIMARY KEY CLUSTERED ([role_resource_action_id]),
    CONSTRAINT [role_resource_action_role_id_resource_action_id_key] UNIQUE NONCLUSTERED ([role_id],[resource_action_id])
);

-- CreateTable
CREATE TABLE [dbo].[resource] (
    [resource_id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [resource_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [resource_pkey] PRIMARY KEY CLUSTERED ([resource_id])
);

-- CreateTable
CREATE TABLE [dbo].[action] (
    [action_id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [action_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [action_pkey] PRIMARY KEY CLUSTERED ([action_id])
);

-- CreateTable
CREATE TABLE [dbo].[recurrence] (
    [recurrence_id] INT NOT NULL IDENTITY(1,1),
    [recurrence_cancellation_id] INT,
    [recurrence_exception_id] INT,
    [rule] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [start_date] DATETIME2 NOT NULL,
    [end_date] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [recurrence_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [recurrence_pkey] PRIMARY KEY CLUSTERED ([recurrence_id])
);

-- CreateTable
CREATE TABLE [dbo].[recurrence_cancellation] (
    [recurrence_cancellation_id] INT NOT NULL IDENTITY(1,1),
    [recurrence_date] DATETIME2 NOT NULL,
    [cancellation_date] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [recurrence_cancellation_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [recurrence_cancellation_pkey] PRIMARY KEY CLUSTERED ([recurrence_cancellation_id])
);

-- CreateTable
CREATE TABLE [dbo].[recurrence_exception] (
    [recurrence_exception_id] INT NOT NULL IDENTITY(1,1),
    [recurrence_date] DATETIME2 NOT NULL,
    [rescheduled_date] DATETIME2 NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [recurrence_exception_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [recurrence_exception_pkey] PRIMARY KEY CLUSTERED ([recurrence_exception_id])
);

-- CreateTable
CREATE TABLE [dbo].[event] (
    [event_id] INT NOT NULL IDENTITY(1,1),
    [status_id] INT NOT NULL,
    [user_id] INT,
    [start_date] DATETIME2 NOT NULL,
    [end_date] DATETIME2 NOT NULL,
    [title] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [recurrence_id] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [event_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [event_pkey] PRIMARY KEY CLUSTERED ([event_id])
);

-- CreateTable
CREATE TABLE [dbo].[event_room] (
    [event_room_id] INT NOT NULL IDENTITY(1,1),
    [event_id] INT NOT NULL,
    [room_id] INT NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [event_room_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [event_room_pkey] PRIMARY KEY CLUSTERED ([event_room_id]),
    CONSTRAINT [event_room_event_id_room_id_key] UNIQUE NONCLUSTERED ([event_id],[room_id])
);

-- CreateTable
CREATE TABLE [dbo].[event_recipient] (
    [event_recipient_id] INT NOT NULL IDENTITY(1,1),
    [eventId] INT NOT NULL,
    [userId] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [event_recipient_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [event_recipient_pkey] PRIMARY KEY CLUSTERED ([event_recipient_id]),
    CONSTRAINT [event_recipient_eventId_userId_key] UNIQUE NONCLUSTERED ([eventId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[event_item] (
    [event_item_id] INT NOT NULL IDENTITY(1,1),
    [event_id] INT NOT NULL,
    [item_id] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [event_item_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [event_item_pkey] PRIMARY KEY CLUSTERED ([event_item_id]),
    CONSTRAINT [event_item_event_id_item_id_key] UNIQUE NONCLUSTERED ([event_id],[item_id])
);

-- CreateTable
CREATE TABLE [dbo].[item] (
    [item_id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [item_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [item_pkey] PRIMARY KEY CLUSTERED ([item_id]),
    CONSTRAINT [item_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[status] (
    [status_id] INT NOT NULL IDENTITY(1,1),
    [key] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [icon] NVARCHAR(255) NOT NULL CONSTRAINT [status_icon_df] DEFAULT 'none',
    [color] NVARCHAR(255) NOT NULL CONSTRAINT [status_color_df] DEFAULT 'none',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [status_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [status_pkey] PRIMARY KEY CLUSTERED ([status_id]),
    CONSTRAINT [status_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[configuration] (
    [configuration_id] INT NOT NULL IDENTITY(1,1),
    [key] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(1000),
    [value] NVARCHAR(255) NOT NULL,
    [type] NVARCHAR(255) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [configuration_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [configuration_pkey] PRIMARY KEY CLUSTERED ([configuration_id]),
    CONSTRAINT [configuration_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[system_process] (
    [system_process_id] INT NOT NULL IDENTITY(1,1),
    [key] NVARCHAR(255) NOT NULL,
    [tag] NVARCHAR(255) NOT NULL,
    [pid] INT NOT NULL,
    [parameter] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [system_process_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] INT NOT NULL,
    [updated_by] INT NOT NULL,
    CONSTRAINT [system_process_pkey] PRIMARY KEY CLUSTERED ([system_process_id]),
    CONSTRAINT [system_process_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [room_display_order_idx] ON [dbo].[room]([display_order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [roomrole_role_idx] ON [dbo].[room_role]([role_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [roomrole_room_idx] ON [dbo].[room_role]([room_id]);

-- AddForeignKey
ALTER TABLE [dbo].[user] ADD CONSTRAINT [user_supervisor_id_fkey] FOREIGN KEY ([supervisor_id]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user] ADD CONSTRAINT [user_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user] ADD CONSTRAINT [user_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user_session] ADD CONSTRAINT [user_session_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user]([user_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_session] ADD CONSTRAINT [user_session_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user_session] ADD CONSTRAINT [user_session_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user_account] ADD CONSTRAINT [user_account_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user]([user_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_account] ADD CONSTRAINT [user_account_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user_account] ADD CONSTRAINT [user_account_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user_verification] ADD CONSTRAINT [user_verification_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user_verification] ADD CONSTRAINT [user_verification_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[sso_provider] ADD CONSTRAINT [sso_provider_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user]([user_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sso_provider] ADD CONSTRAINT [sso_provider_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[sso_provider] ADD CONSTRAINT [sso_provider_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[room] ADD CONSTRAINT [room_room_category_id_fkey] FOREIGN KEY ([room_category_id]) REFERENCES [dbo].[room_category]([room_category_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[room] ADD CONSTRAINT [room_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[room] ADD CONSTRAINT [room_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[room_category] ADD CONSTRAINT [room_category_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[room_category] ADD CONSTRAINT [room_category_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[room_property] ADD CONSTRAINT [room_property_room_id_fkey] FOREIGN KEY ([room_id]) REFERENCES [dbo].[room]([room_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[room_property] ADD CONSTRAINT [room_property_property_id_fkey] FOREIGN KEY ([property_id]) REFERENCES [dbo].[property]([property_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[room_property] ADD CONSTRAINT [room_property_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[room_property] ADD CONSTRAINT [room_property_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[room_role] ADD CONSTRAINT [room_role_room_id_fkey] FOREIGN KEY ([room_id]) REFERENCES [dbo].[room]([room_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[room_role] ADD CONSTRAINT [room_role_role_id_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[role]([role_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[room_role] ADD CONSTRAINT [room_role_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[room_role] ADD CONSTRAINT [room_role_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[property] ADD CONSTRAINT [property_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[property] ADD CONSTRAINT [property_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user_role] ADD CONSTRAINT [user_role_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user]([user_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_role] ADD CONSTRAINT [user_role_role_id_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[role]([role_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_role] ADD CONSTRAINT [user_role_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user_role] ADD CONSTRAINT [user_role_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[role] ADD CONSTRAINT [role_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[role] ADD CONSTRAINT [role_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[resource_action] ADD CONSTRAINT [resource_action_resource_id_fkey] FOREIGN KEY ([resource_id]) REFERENCES [dbo].[resource]([resource_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[resource_action] ADD CONSTRAINT [resource_action_action_id_fkey] FOREIGN KEY ([action_id]) REFERENCES [dbo].[action]([action_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[resource_action] ADD CONSTRAINT [resource_action_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[resource_action] ADD CONSTRAINT [resource_action_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[role_resource_action] ADD CONSTRAINT [role_resource_action_role_id_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[role]([role_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[role_resource_action] ADD CONSTRAINT [role_resource_action_resource_action_id_fkey] FOREIGN KEY ([resource_action_id]) REFERENCES [dbo].[resource_action]([resource_action_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[role_resource_action] ADD CONSTRAINT [role_resource_action_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[role_resource_action] ADD CONSTRAINT [role_resource_action_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[resource] ADD CONSTRAINT [resource_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[resource] ADD CONSTRAINT [resource_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[action] ADD CONSTRAINT [action_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[action] ADD CONSTRAINT [action_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[recurrence] ADD CONSTRAINT [recurrence_recurrence_cancellation_id_fkey] FOREIGN KEY ([recurrence_cancellation_id]) REFERENCES [dbo].[recurrence_cancellation]([recurrence_cancellation_id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[recurrence] ADD CONSTRAINT [recurrence_recurrence_exception_id_fkey] FOREIGN KEY ([recurrence_exception_id]) REFERENCES [dbo].[recurrence_exception]([recurrence_exception_id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[recurrence] ADD CONSTRAINT [recurrence_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[recurrence] ADD CONSTRAINT [recurrence_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[recurrence_cancellation] ADD CONSTRAINT [recurrence_cancellation_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[recurrence_cancellation] ADD CONSTRAINT [recurrence_cancellation_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[recurrence_exception] ADD CONSTRAINT [recurrence_exception_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[recurrence_exception] ADD CONSTRAINT [recurrence_exception_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event] ADD CONSTRAINT [event_recurrence_id_fkey] FOREIGN KEY ([recurrence_id]) REFERENCES [dbo].[recurrence]([recurrence_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event] ADD CONSTRAINT [event_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user]([user_id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event] ADD CONSTRAINT [event_status_id_fkey] FOREIGN KEY ([status_id]) REFERENCES [dbo].[status]([status_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event] ADD CONSTRAINT [event_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event] ADD CONSTRAINT [event_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_room] ADD CONSTRAINT [event_room_event_id_fkey] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event]([event_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_room] ADD CONSTRAINT [event_room_room_id_fkey] FOREIGN KEY ([room_id]) REFERENCES [dbo].[room]([room_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_room] ADD CONSTRAINT [event_room_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_room] ADD CONSTRAINT [event_room_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_recipient] ADD CONSTRAINT [event_recipient_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_recipient] ADD CONSTRAINT [event_recipient_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_recipient] ADD CONSTRAINT [event_recipient_eventId_fkey] FOREIGN KEY ([eventId]) REFERENCES [dbo].[event]([event_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_recipient] ADD CONSTRAINT [event_recipient_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_item] ADD CONSTRAINT [event_item_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_item] ADD CONSTRAINT [event_item_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[event_item] ADD CONSTRAINT [event_item_event_id_fkey] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event]([event_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event_item] ADD CONSTRAINT [event_item_item_id_fkey] FOREIGN KEY ([item_id]) REFERENCES [dbo].[item]([item_id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[item] ADD CONSTRAINT [item_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[item] ADD CONSTRAINT [item_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[status] ADD CONSTRAINT [status_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[status] ADD CONSTRAINT [status_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[configuration] ADD CONSTRAINT [configuration_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[configuration] ADD CONSTRAINT [configuration_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[system_process] ADD CONSTRAINT [system_process_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[system_process] ADD CONSTRAINT [system_process_updated_by_fkey] FOREIGN KEY ([updated_by]) REFERENCES [dbo].[user]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
