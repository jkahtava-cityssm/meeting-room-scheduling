'use server';

import { ClientSecretCredential } from '@azure/identity';
import { Client, GraphError } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { TEmailAction, TStatusKey } from './types';

import { Message } from '@microsoft/microsoft-graph-types';
import { getMeetingResponseEmailTemplate, IEmailTemplate } from './emails/html-templates/meeting-response';
import { findFirstUser, findManyUsers } from './data/users';
import { findManyRooms } from './data/rooms';
import { findFirstStatus } from './data/status';
import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { getDurationText } from './helpers';
import { getRolesByUserId } from './data/permissions';
import { buildPermissionCache, GuardRequest, isGroupRequirementMet } from './auth-permission-checks';
import { APP_FULL_URL } from './api-helpers';

const SHARED_MAILBOX = process.env.SHARED_MAILBOX;

export async function sendEmail(requestingUser: string, notifyUsers: string[], content: IEmailTemplate) {
  if (!SHARED_MAILBOX) {
    console.log('SHARED_MAILBOX Environment Variable Not Configured');
    return;
  }

  const credential = new ClientSecretCredential(
    process.env.AZURE_AD_TENANT_ID!,
    process.env.AZURE_AD_CLIENT_ID!,
    process.env.AZURE_AD_CLIENT_SECRET!,
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  const graphClient = Client.initWithMiddleware({ authProvider });

  const mailPayload = {
    message: {
      subject: `Booking ${getSubjectKeyword(content.status, content.action)} [${content.date}]`,
      body: {
        contentType: 'html',
        content: getMeetingResponseEmailTemplate(content),
      },
      toRecipients: [
        {
          emailAddress: {
            address: requestingUser,
          },
        },
      ],
      ccRecipients: [
        ...notifyUsers.map((email) => ({
          emailAddress: {
            address: email,
          },
        })),
      ],
      /*replyTo: [
        {
          emailAddress: {
            address: SHARED_MAILBOX,
          },
        },
      ],*/
    } as Message,
    saveToSentItems: 'true',
  };

  try {
    console.log(`Attempting to send email to ${SHARED_MAILBOX}...`);

    // Send email
    await graphClient.api(`/users/${SHARED_MAILBOX}/sendMail`).post(mailPayload);

    console.log('Email sent successfully!');
  } catch (error: unknown) {
    const err = error as GraphError;

    console.error('Failed to send email:', err.body?.error?.message || err.message || 'Unknown Error');
  }
}

function getSubjectKeyword(status: TStatusKey, action: TEmailAction): string {
  // 1. Highest priority: Deletion drops all status checks
  if (action === 'DELETE') {
    return 'Removed';
  }

  // 2. Absolute Statuses: Rejected and Information look the same whether Created, Updated, or Patched
  if (status === 'REJECTED') {
    return 'Rejected'; // Changed from 'Denied' to match your exact prompt requirement
  }
  if (status === 'INFORMATION') {
    return 'Requires More Information';
  }

  // 3. CREATE Action Conditions
  if (action === 'CREATE') {
    if (status === 'PENDING') return 'Requested';
    if (status === 'APPROVED') return 'Approved';
  }

  // 4. UPDATE Action Conditions (Normal detail updates)
  if (action === 'UPDATE') {
    if (status === 'PENDING') return 'Requested - Details Updated';
    if (status === 'APPROVED') return 'Approved - Details Updated';
  }

  // 5. PATCH / STATUS_CHANGE Action Conditions
  // (When changing status to Approved/Pending without wanting "Details Updated")
  if (action === 'STATUS_CHANGE') {
    if (status === 'PENDING') return 'Requested';
    if (status === 'APPROVED') return 'Approved';
  }

  // Fallback case just in case
  return '';
}

interface ISendEventEmailOptions {
  userId: number | undefined;
  eventRecipients: number[];
  eventRooms: number[];
  statusId: number;
  startDate: Date;
  endDate: Date;
  title: string;
  action: TEmailAction;
}

export async function sendEventNotificationEmail(options: ISendEventEmailOptions) {
  const { userId, eventRecipients, eventRooms, statusId, startDate, endDate, title, action } = options;

  try {
    const [user, recipients, rooms, status] = await Promise.all([
      findFirstUser({ id: userId }),
      findManyUsers({ id: { in: eventRecipients || [] } }),
      findManyRooms({ roomId: { in: eventRooms || [] } }),
      findFirstStatus({ statusId: statusId }),
    ]);

    if (!user) {
      throw new Error(`Send Event Email Failed: Requesting user with ID ${userId} not found.`);
    }

    if (!user.email) {
      throw new Error(`Send Event Email Failed: Requesting user with ID ${userId} missing email.`);
    }

    if (!user.emailEnabled) {
      return;
    }

    if (!status || !status.key) {
      throw new Error(`Send Event Email Failed: Valid status key not found for statusId ${statusId}.`);
    }

    const timezone = user.timezone || process.env.DEFAULT_TIMEZONE;

    if (!timezone) {
      throw new Error('Send Event Email Failed: User timezone and DEFAULT_TIMEZONE environment variable are both missing.');
    }

    const roles = await getRolesByUserId(user.userId);

    const permissionCache = buildPermissionCache(roles);

    const { byGroup } = await isGroupRequirementMet(permissionCache, {
      canViewBookings: GuardRequest.any(
        { type: 'permission', action: 'View Agenda', resource: 'My Bookings' },
        { type: 'permission', action: 'View Day', resource: 'My Bookings' },
        { type: 'permission', action: 'View Week', resource: 'My Bookings' },
        { type: 'permission', action: 'View Month', resource: 'My Bookings' },
        { type: 'permission', action: 'View Year', resource: 'My Bookings' },
      ),
    });

    const bookingURL = byGroup
      ? APP_FULL_URL + '/bookings/user-view?view=day&selectedDate=' + format(startDate, 'yyyy-MM-dd')
      : '/availability?view=public&selectedDate=' + format(startDate, 'yyyy-MM-dd');

    const formattedDate = format(new TZDate(startDate, timezone), 'yyyy-MM-dd hh:mm a');

    await sendEmail(
      user.email,
      recipients.map((r) => r.email || ''),
      {
        date: formattedDate,
        duration: getDurationText(startDate, endDate),
        employeeName: user.name,
        notifiedNames: recipients.map((r) => r.name).join(', '),
        room: rooms.map((r) => r.name).join(', '),
        action: action,
        status: status.key as TStatusKey,
        title: title,
        bookingURL: bookingURL,
      },
    );
  } catch (error) {
    console.error('Failed to orchestrate event email notification:', error);
  }
}
