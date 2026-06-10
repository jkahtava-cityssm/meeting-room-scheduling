'use server';

import { ClientSecretCredential } from '@azure/identity';
import { Client, GraphError } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ICalendarStatus, NOTIFICATION_MATRIX, NotificationConfig, TEmailAction, TStatusKey } from './types';

import { FileAttachment, Message } from '@microsoft/microsoft-graph-types';
import { getMeetingResponseEmailTemplate, IEmailTemplate } from './emails/html-templates/meeting-response';
import { findFirstUser, findManyUsers } from './data/users';
import { findManyRooms } from './data/rooms';
import { findFirstStatus } from './data/status';
import { format } from 'date-fns';
import { tz, TZDate } from '@date-fns/tz';
import { utc } from '@date-fns/utc';
import { getDurationText } from './helpers';
import { getRolesByUserId } from './data/permissions';
import { buildPermissionCache, GuardRequest, isGroupRequirementMet } from './auth-permission-checks';
import { APP_FULL_URL } from './api-helpers';
import { getStaffNotificationEmailTemplate } from './emails/html-templates/staff-notification';
import { findManyItems } from './data/items';
import { findFirstEvent, findManyEvents, IFlattenedEvent } from './data/events';
import crypto from 'crypto';

const SHARED_MAILBOX = process.env.SHARED_MAILBOX;

export async function sendEmail(
  requestingUser: string,
  notifyUsers: string[],
  subject: string,
  htmlContent: string,
  base64CalendarAttachment?: string,
) {
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
      subject: subject,
      body: {
        contentType: 'html',
        content: htmlContent,
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
      attachments: [
        base64CalendarAttachment &&
          ({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: 'invite.ics', // The filename staff will see in Outlook
            contentType: 'text/calendar; charset=utf-8; method=REQUEST', // Explicit calendar mime type
            contentBytes: base64CalendarAttachment, // Your base64 data stream string
          } as FileAttachment),
      ],
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

export async function sendEventNotificationEmail(flattenedEvent: IFlattenedEvent, action: TEmailAction) {
  try {
    if (!SHARED_MAILBOX) {
      console.log('SHARED_MAILBOX Environment Variable Not Configured');
      return;
    }

    if (!flattenedEvent) throw new Error(`Send Event Email Failed: Event was null or undefined.`);

    const variables = {
      userId: flattenedEvent.userId ? Number(flattenedEvent.userId) : undefined,
      eventRecipients: flattenedEvent.eventRecipients ? flattenedEvent.eventRecipients.map((recipients) => recipients.userId) : [],
      eventRooms: flattenedEvent.eventRooms ? flattenedEvent.eventRooms : [],
      statusId: flattenedEvent.statusId,
      startDate: flattenedEvent.startDate as string,
      endDate: flattenedEvent.endDate as string,
      title: flattenedEvent.title,
      description: flattenedEvent.description,
      requestedItems: flattenedEvent.eventItems ? flattenedEvent.eventItems : [],
      rrule: flattenedEvent.recurrence?.rule,
      uid: flattenedEvent.uid,
      sequence: String(flattenedEvent.sequence),
    };

    const [user, recipients, status] = await Promise.all([
      findFirstUser({ id: variables.userId, emailEnabled: true }),
      findManyUsers({
        id: { in: variables.eventRecipients },
        emailEnabled: true,
        email: {
          not: null,
          notIn: [''],
        },
      }),
      findFirstStatus({ statusId: variables.statusId }),
    ]);

    if (!user) throw new Error(`Send Event Email Failed: Requesting user with ID ${variables.userId} not found.`);
    if (!user.email) throw new Error(`Send Event Email Failed: Requesting user with ID ${variables.userId} missing email.`);
    if (!status || !status.key) throw new Error(`Send Event Email Failed: Valid status key not found for statusId ${variables.statusId}.`);

    const statusKey = status.key as TStatusKey;

    const timezone = user.timezone || process.env.DEFAULT_TIMEZONE;
    if (!timezone) throw new Error('Send Event Email Failed: User timezone and DEFAULT_TIMEZONE environment variable are both missing.');

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

    const formattedStartDate = format(new TZDate(variables.startDate, timezone), 'yyyy-MM-dd');

    const bookingURL = byGroup
      ? APP_FULL_URL + '/bookings/user-view?view=day&selectedDate=' + formattedStartDate + '&eventId=' + flattenedEvent.eventId
      : APP_FULL_URL + '/availability?view=public&selectedDate=' + formattedStartDate;

    const roomsListString = variables.eventRooms.map((room) => room.name).join(', ');
    const recipientsListString = recipients.map((r) => r.name).join(', ');
    const itemsListString = variables.requestedItems.map((item) => item.name).join(', ');
    const formattedDate = format(new TZDate(variables.startDate, timezone), 'yyyy-MM-dd hh:mm a');

    const iCalTextContent = generateCalendarAttachment({
      timezone: timezone,
      startDateTime: variables.startDate,
      endDateTime: variables.endDate,
      rrule: variables.rrule,
      rruleCancellations: undefined,
      rruleExceptions: undefined,
      title: variables.title,
      bookingURL: bookingURL,
      uid: variables.uid,
      sequence: variables.sequence,
      description: variables.description,
      rooms: roomsListString,
      status: NOTIFICATION_MATRIX[action][statusKey].iCalStatus,
      owner: {
        name: 'MEETING_ROOM_BOOKING',
        email: SHARED_MAILBOX,
      },
      attendees: [
        { name: user.name, email: user.email },
        ...recipients.map((recipient) => {
          return { name: recipient.name, email: recipient.email! };
        }),
      ],
    });
    const base64CalendarAttachment = Buffer.from(iCalTextContent, 'utf-8').toString('base64');

    await sendEmail(
      user.email,
      recipients.map((r) => r.email || ''),
      `Booking ${NOTIFICATION_MATRIX[action][statusKey].subjectKeyword} [${formattedDate}]`,
      getMeetingResponseEmailTemplate({
        header: NOTIFICATION_MATRIX[action][statusKey].emailHeader,
        date: formattedDate,
        duration: getDurationText(variables.startDate, variables.endDate),
        description: variables.description,
        employeeName: user.name,
        notifiedNames: recipientsListString,
        room: roomsListString,
        status: statusKey,
        title: variables.title,
        bookingURL: bookingURL,
      }),
      base64CalendarAttachment,
    );

    if (status.key === 'PENDING' && action === 'CREATE') {
      await sendEmail(
        SHARED_MAILBOX,
        [],
        `Booking ${NOTIFICATION_MATRIX[action][statusKey].subjectKeyword} [${formattedDate}]`,
        getStaffNotificationEmailTemplate({
          date: formattedDate,
          duration: getDurationText(variables.startDate, variables.endDate),
          description: variables.description,
          requestedItems: itemsListString,
          employeeName: user.name,
          notifiedNames: recipientsListString,
          room: roomsListString,
          title: variables.title,
          bookingURL: APP_FULL_URL + '/bookings/user-requests?view=year&selectedDate=' + formattedStartDate + '&eventId=' + flattenedEvent.eventId,
        }),
        base64CalendarAttachment,
      );
    }
  } catch (error) {
    console.error('Failed to orchestrate event email notification:', error);
  }
}

function generateCalendarAttachment(content: {
  timezone: string;
  startDateTime: string;
  endDateTime: string;
  rrule?: string;
  rruleCancellations?: string[];
  rruleExceptions?: string[];
  title: string;
  bookingURL: string;
  uid: string;
  sequence: string;
  description: string;
  rooms: string;
  status: ICalendarStatus;
  owner: { name: string; email: string };
  attendees?: { name: string; email: string }[];
}) {
  const wallStartDateTime = format(content.startDateTime, "yyyyMMdd'T'HHmmss", {
    in: tz(content.timezone),
  });
  const wallEndDateTime = format(content.endDateTime, "yyyyMMdd'T'HHmmss", {
    in: tz(content.timezone),
  });
  const programId = process.env.DATABASE_NAME || 'Unknown';
  const timestamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'", { in: utc });

  const organizerLine = `ORGANIZER;CN=${escapeICalText(content.owner.name)}:mailto:${content.owner.email}`;
  const attendeeLine =
    content.attendees && content.attendees.length > 0
      ? content.attendees
          .map(
            (attendee) => `ATTENDEE;RSVP=FALSE;ROLE=REQ-PARTICIPANT;CUTYPE=INDIVIDUAL;CN=${escapeICalText(attendee.name)}:mailto:${attendee.email}`,
          )
          .join('\n')
      : null;

  const rruleLine = content.rrule ? `RRULE:${content.rrule}` : null;

  const rdateLine =
    content.rruleExceptions && content.rruleExceptions.length > 0 ? `RDATE;TZID=${content.timezone}:${content.rruleExceptions.join(',')}` : null;

  const exdateLine =
    content.rruleCancellations && content.rruleCancellations.length > 0
      ? `EXDATE;TZID=${content.timezone}:${content.rruleCancellations.join(',')}`
      : null;

  const email = SHARED_MAILBOX || 'Unknown';

  const escapedTitle = escapeICalText(content.title);
  const escapedDescription = escapeICalText(content.description);
  const escapedRoom = escapeICalText(content.rooms);

  const iCalText = [
    'BEGIN:VCALENDAR',
    `VERSION:2.0`,
    `PRODID:-//City of Sault Ste. Marie//${programId}//EN`,
    `CALSCALE:GREGORIAN`,
    `METHOD:REQUEST`,
    `BEGIN:VEVENT`,
    `UID:${content.uid}`,
    `DTSTAMP:${timestamp}`,
    `SEQUENCE:${content.sequence}`,
    `URL:${content.bookingURL}`,
    `DTSTART;TZID=${content.timezone}:${wallStartDateTime}`,
    `DTEND;TZID=${content.timezone}:${wallEndDateTime}`,
    `TRANSP:OPAQUE`,
    foldICalLine(`SUMMARY:${escapedTitle}`),
    foldICalLine(`DESCRIPTION:${escapedDescription}`),
    foldICalLine(`LOCATION:${escapedRoom}`),
    `CATEGORIES:Meeting Room Booking`,
    `STATUS:${content.status}`,
    organizerLine,
    attendeeLine,
    `CONTACT:${email} / Meeting Room Bookings`,
    rruleLine,
    rdateLine,
    exdateLine,
    `BEGIN:VALARM`,
    `ACTION:DISPLAY`,
    `TRIGGER:-PT15M`,
    foldICalLine(`DESCRIPTION:Reminder: ${escapedTitle} begins in 15 minutes.`),
    `END:VALARM`,
    `END:VEVENT`,
    `END:VCALENDAR`,
  ]
    .filter(Boolean) //Filter out null values
    .join('\n');

  return iCalText;
}

function escapeICalText(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/\\/g, '\\\\') // 1. Escape literal backslashes first
    .replace(/,/g, '\\,') // 2. Escape commas
    .replace(/;/g, '\\;') // 3. Escape semicolons
    .replace(/\r?\n/g, '\\n'); // 4. Convert structural newlines to literal '\n'
}

function foldICalLine(line: string): string {
  if (line.length <= 75) return line;

  const chunks: string[] = [];
  let currentLine = line;

  // Grab the first 75 characters
  chunks.push(currentLine.substring(0, 75));
  currentLine = currentLine.substring(75);

  // All subsequent folded lines must begin with a single whitespace space character
  while (currentLine.length > 0) {
    chunks.push(' ' + currentLine.substring(0, 74));
    currentLine = currentLine.substring(74);
  }

  return chunks.join('\n');
}

/*
    await sendRawMimeEmail(
      user.email,
      recipients.map((r) => r.email || ''),
      `Booking ${getSubjectKeyword(status.key as TStatusKey, action)} [${formattedDate}]`,
      getMeetingResponseEmailTemplate({
        header: getHeader(status.key as TStatusKey, action),
        date: formattedDate,
        duration: getDurationText(variables.startDate, variables.endDate),
        description: variables.description,
        employeeName: user.name,
        notifiedNames: recipientsListString,
        room: roomsListString,
        status: status.key as TStatusKey,
        title: variables.title,
        bookingURL: bookingURL,
      }),
      iCalTextContent,
    );*/

export async function sendRawMimeEmail(requestingUser: string, notifyUsers: string[], subject: string, htmlContent: string, iCalTextContent: string) {
  const boundary = `----=_Part_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // Construct a compliant MIME string manually
  const mimeParts = [
    `From: ${SHARED_MAILBOX}`,
    `To: ${requestingUser}`,
    notifyUsers.length ? `Cc: ${notifyUsers.join(', ')}` : '',
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    '',
    htmlContent,
    '',
    `--${boundary}`,
    // CRITICAL: The method=REQUEST header turns the attachment into an inline meeting invite
    `Content-Type: text/calendar; charset="UTF-8"; method=REQUEST`,
    `Content-Transfer-Encoding: 7bit`,
    '',
    iCalTextContent,
    '',
    `--${boundary}--`,
  ];

  const rawMimeString = mimeParts.filter((line) => line !== null).join('\r\n');
  const base64Mime = Buffer.from(rawMimeString, 'utf-8').toString('base64');

  try {
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

    // Use the .content() modifier to send raw data
    await graphClient.api(`/users/${SHARED_MAILBOX}/sendMail`).headers({ 'Content-Type': 'text/plain' }).post(base64Mime);

    console.log('MIME meeting invite sent!');
  } catch (error) {
    console.error('Failed sending MIME mail:', error);
  }
}
