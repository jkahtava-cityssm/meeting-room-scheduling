import 'server-only';

import { ClientSecretCredential } from '@azure/identity';
import { Client, GraphError } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import {
  CALENDAR_METHOD,
  CALENDAR_STATUS,
  EMAIL_ACTIONS,
  ICalendarMethod,
  ICalendarStatus,
  NOTIFICATION_MATRIX,
  STATUS_KEYS,
  TEmailAction,
  TStatusKey,
} from './types';

import { Message } from '@microsoft/microsoft-graph-types';
import { getMeetingResponseEmailTemplate } from './emails/html-templates/meeting-response';
import { findFirstUser, findManyUsers } from './data/users';

import { findFirstStatus } from './data/status';
import { format } from 'date-fns';
import { tz, TZDate } from '@date-fns/tz';
import { utc } from '@date-fns/utc';
import { getDurationText } from './helpers';
import { getRolesByUserId } from './data/permissions';
import { buildPermissionCache, GuardRequest, isGroupRequirementMet } from './auth-permission-checks';
import { APP_FULL_URL } from './api-helpers';
import { getStaffNotificationEmailTemplate } from './emails/html-templates/staff-notification';

import { IFlattenedEvent } from './data/events';

import z from 'zod/v4';

const SEmailAttendeeSchema = z.object({
  name: z.string(),
  email: z.string(),
});

export const SEmailContextSchema = z.object({
  requestingUserEmail: z.string(),
  recipientEmails: z.array(z.string()),
  attendees: z.array(SEmailAttendeeSchema),
  statusKey: z.enum(STATUS_KEYS),
  emailAction: z.enum(EMAIL_ACTIONS),
  iCalStatus: z.enum(CALENDAR_STATUS),
  iCalMethod: z.enum(CALENDAR_METHOD),
  timezone: z.string(),

  header: z.string(),
  subject: z.string(),
  title: z.string(),
  description: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  rrule: z.string(),
  uid: z.string(),
  sequence: z.string(),
  wasApproved: z.boolean(),
  duration: z.string(),
  employeeName: z.string(),

  formattedDate: z.string(),
  formattedDateTime: z.string(),
  roomList: z.string(),
  recipientsList: z.string(),
  itemsList: z.string(),
  bookingURL: z.string(),
  supportURL: z.string(),
  systemBookingURL: z.string(),

  notifySharedMailbox: z.boolean(),
});

export type TEmailAttendee = z.infer<typeof SEmailAttendeeSchema>;
export type TEmailContext = z.infer<typeof SEmailContextSchema>;

const SHARED_MAILBOX = process.env.SHARED_MAILBOX;

export async function buildEmailContext(flattenedEvent: IFlattenedEvent, action: TEmailAction): Promise<TEmailContext | undefined> {
  if (!SHARED_MAILBOX) {
    console.log('SHARED_MAILBOX Environment Variable Not Configured');
    return undefined;
  }

  if (!flattenedEvent) throw new Error(`Send Event Email Failed: Event was null or undefined.`);

  const userId = flattenedEvent.userId ? Number(flattenedEvent.userId) : undefined;
  const eventRecipients = flattenedEvent.eventRecipients ? flattenedEvent.eventRecipients.map((r) => r.userId) : [];
  const statusId = flattenedEvent.statusId;

  const [user, recipients, status] = await Promise.all([
    findFirstUser({ id: userId, emailEnabled: true }),
    findManyUsers({
      id: { in: eventRecipients },
      emailEnabled: true,
      email: { not: null, notIn: [''] },
    }),
    findFirstStatus({ statusId: statusId }),
  ]);

  if (!user?.email) throw new Error(`Send Event Email Failed: Requesting user with ID ${userId} missing or not found.`);
  if (!status?.key) throw new Error(`Send Event Email Failed: Valid status key not found for statusId ${statusId}.`);

  const statusKey = status.key as TStatusKey;
  const timezone = user.timezone || process.env.DEFAULT_TIMEZONE;
  if (!timezone) throw new Error('Send Event Email Failed: Timezone configuration missing.');

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

  // Date Formats
  const startTZDate = new TZDate(flattenedEvent.startDate as string, timezone);
  const formattedDate = format(startTZDate, 'yyyy-MM-dd');
  const formattedDateTime = format(startTZDate, 'yyyy-MM-dd hh:mm a');

  // Create string lists
  const roomList = flattenedEvent.eventRooms?.map((room) => room.name).join(', ') ?? '';
  const recipientsList = recipients?.map((r) => r.name).join(', ') ?? '';
  const itemsList = flattenedEvent.eventItems?.map((item) => item.name).join(', ') ?? '';

  // Format URL'S
  const bookingURL = byGroup
    ? `${APP_FULL_URL}/bookings/user-view?view=day&selectedDate=${formattedDate}&eventId=${flattenedEvent.eventId}`
    : `${APP_FULL_URL}/availability?view=public&selectedDate=${formattedDate}`;

  const supportSubject = encodeURIComponent(`Help with Booking Request: [${formattedDateTime}] @ ${roomList}`);
  const supportBody = `Booking Link:%0A${encodeURIComponent(bookingURL)}`;
  const supportURL = `mailto:${SHARED_MAILBOX}?body=${supportBody}&subject=${supportSubject}`;

  const systemBookingURL = `${APP_FULL_URL}/bookings/user-requests?view=year&selectedDate=${formattedDate}&eventId=${flattenedEvent.eventId}`;

  // Create Attendee List for ICAL Content
  const attendees: TEmailAttendee[] = [{ name: user.name, email: user.email }, ...recipients.map((r) => ({ name: r.name, email: r.email! }))];

  return {
    requestingUserEmail: user.email,
    recipientEmails: recipients.map((r) => r.email || ''),
    attendees,
    statusKey: action === 'DELETE' ? 'REJECTED' : statusKey,
    emailAction: action,
    iCalStatus: NOTIFICATION_MATRIX[action][statusKey].iCalStatus,
    iCalMethod: NOTIFICATION_MATRIX[action][statusKey].iCalStatus === 'CANCELLED' ? 'CANCEL' : 'REQUEST',
    timezone,
    startDate: flattenedEvent.startDate as string,
    endDate: flattenedEvent.endDate as string,
    formattedDate,
    formattedDateTime,
    title: flattenedEvent.title,
    description: flattenedEvent.description || 'No description provided.',
    itemsList,
    recipientsList,
    roomList,
    rrule: flattenedEvent.recurrence?.rule ?? '',
    uid: flattenedEvent.uid,
    sequence: String(flattenedEvent.sequence),

    wasApproved: flattenedEvent.wasApproved,
    header: NOTIFICATION_MATRIX[action][statusKey].emailHeader,
    subject: `Booking ${NOTIFICATION_MATRIX[action][statusKey].subjectKeyword} [${formattedDate}]`,
    duration: getDurationText(flattenedEvent.startDate as string, flattenedEvent.endDate as string),
    employeeName: user.name,
    bookingURL,
    supportURL,
    systemBookingURL,
    notifySharedMailbox: statusKey === 'PENDING' && action === 'CREATE',
  };
}

export async function sendEventNotificationEmail(emailContext: TEmailContext) {
  try {
    if (!SHARED_MAILBOX) {
      console.log('SHARED_MAILBOX Environment Variable Not Configured');
      return;
    }

    const iCalTextBody = await generateICalendarText({
      timezone: emailContext.timezone,
      startDateTime: emailContext.startDate,
      endDateTime: emailContext.endDate,
      rrule: emailContext.rrule,
      rruleCancellations: undefined,
      rruleExceptions: undefined,
      title: emailContext.title,
      bookingURL: emailContext.bookingURL,
      uid: emailContext.uid,
      sequence: emailContext.sequence,
      description: emailContext.description,
      rooms: emailContext.roomList,
      status: emailContext.iCalStatus,
      method: emailContext.iCalMethod,
      owner: {
        name: 'MEETING_ROOM_BOOKING',
        email: SHARED_MAILBOX,
      },
      attendees: emailContext.attendees,
    });

    const htmlBody = getMeetingResponseEmailTemplate({
      header: emailContext.header,
      date: emailContext.formattedDate,
      duration: emailContext.duration,
      description: emailContext.description,
      employeeName: emailContext.employeeName,
      notifiedNames: emailContext.recipientsList,
      room: emailContext.roomList,
      status: emailContext.statusKey,
      title: emailContext.title,
      bookingURL: emailContext.bookingURL,
      supportURL: emailContext.supportURL,
    });

    const plainTextBody = await generatePlainTextTemplate(emailContext);

    const mimeBuffer = await generateMimePayload({
      sharedMailbox: SHARED_MAILBOX,
      requestingUser: emailContext.requestingUserEmail,
      recipientEmails: emailContext.recipientEmails,
      subject: emailContext.subject,
      textContent: plainTextBody,
      htmlContent: htmlBody,
      iCalContent: emailContext.wasApproved ? iCalTextBody : undefined,
      iCalMethod: emailContext.iCalMethod,
    });

    await sendEmailMIME(mimeBuffer);

    if (emailContext.notifySharedMailbox) {
      const staffHtmlBody = getStaffNotificationEmailTemplate({
        date: emailContext.formattedDate,
        duration: emailContext.duration,
        description: emailContext.description,
        requestedItems: emailContext.itemsList,
        employeeName: emailContext.employeeName,
        notifiedNames: emailContext.recipientsList,
        room: emailContext.roomList,
        title: emailContext.title,
        bookingURL: emailContext.systemBookingURL,
        supportURL: `mailto:${SHARED_MAILBOX}`,
      });

      await sendEmailJSON(SHARED_MAILBOX!, [], emailContext.subject, staffHtmlBody);
    }
  } catch (error) {
    console.error('Failed to orchestrate event email notification:', error);
  }
}

export async function generateICalendarText(content: {
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
  method: ICalendarMethod;
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
    `METHOD:${content.method}`,
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

export async function generatePlainTextTemplate(data: {
  header: string;
  title: string;
  roomList: string;
  formattedDateTime: string;
  duration: string;
  employeeName: string;
  recipientsList: string;
  description: string;
  bookingURL: string;
  supportURL: string;
}): Promise<string> {
  return [
    `======================================================================`,
    ` MEETING ROOM BOOKING: ${data.header}`,
    `======================================================================`,
    ``,
    `Hello,`,
    ``,
    `This is an automated notification regarding your room booking reservation.`,
    `The status of this request is currently tracked as: ${data.header}.`,
    ``,
    `----------------------------------------------------------------------`,
    ` BOOKING DETAILS`,
    `----------------------------------------------------------------------`,
    ` Title:        ${data.title}`,
    ` Room(s):      ${data.roomList}`,
    ` Date/Time:    ${data.formattedDateTime}`,
    ` Duration:     ${data.duration}`,
    ` Organized By: ${data.employeeName}`,
    ` Attendees:    ${data.recipientsList}`,
    ``,
    ` Description:`,
    ` ${data.description || 'No description provided.'}`,
    `----------------------------------------------------------------------`,
    ``,
    `ACTION REQUIRED:`,
    `Please use an interactive, HTML-compatible email client (like Outlook `,
    `or Gmail) to Accept, Decline, or Tentatively accept this invitation.`,
    ``,
    `Manage Booking Online:`,
    ` ${data.bookingURL}`,
    ``,
    `Need Support?`,
    ` ${data.supportURL}`,
    ``,
    `======================================================================`,
    ` Meeting Room Bookings`,
    `======================================================================`,
  ].join('\r\n');
}

function generateMimePayload(data: {
  sharedMailbox: string;
  requestingUser: string;
  recipientEmails: string[];
  subject: string;
  textContent: string;
  htmlContent: string;
  iCalContent?: string;
  iCalMethod?: ICalendarMethod;
}): Buffer {
  const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const boundaryMixed = `----=_Part_Mixed_${uniqueId}`;
  const boundaryAlternative = `----=_Part_Alt_${uniqueId}`;

  const rawMimeLines: string[] = [
    `From: ${data.sharedMailbox}`,
    `To: ${data.requestingUser}`,
    `Cc: ${data.recipientEmails.join(';')}`,
    `Subject: ${data.subject}`,
    'MIME-Version: 1.0',
  ];

  if (data.iCalContent) {
    const method = data.iCalMethod || 'REQUEST';
    rawMimeLines.push(
      `Content-Type: multipart/mixed; boundary="${boundaryMixed}"`,
      '',
      `--${boundaryMixed}`,
      `Content-Type: multipart/alternative; boundary="${boundaryAlternative}"`,
      '',
      `--${boundaryAlternative}`,
      'Content-Type: text/plain; charset="utf-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      data.textContent,
      '',
      `--${boundaryAlternative}`,
      'Content-Type: text/html; charset="utf-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      data.htmlContent,
      '',
      `--${boundaryAlternative}`,
      `Content-Type: text/calendar; charset="utf-8"; method=${method}`,
      'Content-Transfer-Encoding: 7bit',
      '',
      data.iCalContent,
      '',
      `--${boundaryAlternative}--`,
      '',
      `--${boundaryMixed}--`,
    );
  } else {
    rawMimeLines.push(
      `Content-Type: multipart/alternative; boundary="${boundaryAlternative}"`,
      '',
      `--${boundaryAlternative}`,
      'Content-Type: text/plain; charset="utf-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      data.textContent,
      '',
      `--${boundaryAlternative}`,
      'Content-Type: text/html; charset="utf-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      data.htmlContent,
      '',
      `--${boundaryAlternative}--`,
    );
  }

  const rawMimeString = rawMimeLines.join('\r\n');
  return Buffer.from(Buffer.from(rawMimeString, 'utf-8').toString('base64'), 'utf-8');
}

export async function sendEmailMIME(payloadBuffer: Buffer) {
  if (!SHARED_MAILBOX) {
    console.log('SHARED_MAILBOX Environment Variable Not Configured');
    return;
  }

  try {
    const credential = new ClientSecretCredential(
      process.env.AZURE_AD_TENANT_ID!,
      process.env.AZURE_AD_CLIENT_ID!,
      process.env.AZURE_AD_CLIENT_SECRET!,
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    const graphClient = Client.initWithMiddleware({ authProvider });

    await graphClient.api(`/users/${SHARED_MAILBOX}/sendMail?saveToSentItems=true`).headers({ 'Content-Type': 'text/plain' }).post(payloadBuffer);
  } catch (error) {
    console.error('Execution Failed!');
    console.error(error);
  }
}

export async function sendEmailJSON(requestingUser: string, notifyUsers: string[], subject: string, htmlContent: string) {
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

async function sendStaticMimeTestEmail() {
  // Hardcoded configuration for testing

  const RECIPIENT_EMAIL = 'j.kahtava@cityssm.on.ca';

  // Fixed boundary strings
  const boundaryMixed = '----=_Part_Mixed_StaticTest12345';
  const boundaryAlternative = '----=_Part_Alt_StaticTest12345';

  // 1. Static Professional HTML Body
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 5px;">
      <h2 style="color: #0056b3; margin-top: 0;">Meeting Room Booking Confirmation</h2>
      <p>Hello,</p>
      <p>Your booking for <strong>Project Sync & Strategy Session</strong> has been processed successfully.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0056b3; margin: 20px 0;">
        <strong>Location:</strong> Boardroom A (Main Floor)<br/>
        <strong>Time:</strong> 2:00 PM - 3:00 PM (EST)
      </div>
      <p>Please use the interactive buttons in your email client header to Accept or Decline this invitation.</p>
      <hr style="border: 0; border-top: 1px solid #ccc; margin-top: 30px;" />
      <p style="font-size: 12px; color: #666;">City of Sault Ste. Marie - Meeting Room Bookings</p>
    </div>
  `.trim();

  // 2. Static iCalendar Payload (Strictly using \r\n line endings)
  const iCalText = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//City of Sault Ste. Marie//PropertyBookingSystem//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    'UID:static-test-uid-99999-2026@saultstemarie.ca',
    'DTSTAMP:20260616T120000Z',
    'SEQUENCE:0',
    'URL:https://www.saultstemarie.ca/bookings',
    'DTSTART;TZID=America/Toronto:20260617T140000',
    'DTEND;TZID=America/Toronto:20260617T150000',
    'TRANSP:OPAQUE',
    'SUMMARY:Project Sync & Strategy Session',
    'DESCRIPTION:Static test meeting description generated for Graph API testing.',
    'LOCATION:Boardroom A (Main Floor)',
    'CATEGORIES:Meeting Room Booking',
    'STATUS:CONFIRMED',
    `ORGANIZER;CN="Meeting Rooms":MAILTO:${SHARED_MAILBOX}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN="Test User":MAILTO:${RECIPIENT_EMAIL}`,
    'CONTACT:bookings@saultstemarie.ca / Meeting Room Bookings',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-PT15M',
    'DESCRIPTION:Reminder: Project Sync & Strategy Session begins in 15 minutes.',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  // 3. Static Multipart MIME Tree Layout
  const rawMimeLines = [
    `From: ${SHARED_MAILBOX}`,
    `To: ${RECIPIENT_EMAIL}`,
    'Subject: Booking: Project Sync & Strategy Session',
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundaryMixed}"`,
    '',
    `--${boundaryMixed}`,
    `Content-Type: multipart/alternative; boundary="${boundaryAlternative}"`,
    '',
    `--${boundaryAlternative}`,
    'Content-Type: text/plain; charset="utf-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    'You have a meeting request for Project Sync & Strategy Session. Please use an HTML/Calendar compatible client.',
    '',
    `--${boundaryAlternative}`,
    'Content-Type: text/html; charset="utf-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundaryAlternative}`,
    'Content-Type: text/calendar; charset="utf-8"; method=REQUEST',
    'Content-Transfer-Encoding: 7bit',
    '',
    iCalText,
    '',
    `--${boundaryAlternative}--`,
    '',
    `--${boundaryMixed}--`,
  ];

  // Join the entire tree structural map with CRLF
  const rawMimeString = rawMimeLines.join('\r\n');

  // 4. Transform the final raw output into Base64 format
  const base64MimeString = Buffer.from(rawMimeString, 'utf-8').toString('base64');
  const payloadBuffer = Buffer.from(base64MimeString, 'utf-8');

  console.log('Compiling payload and executing request against Microsoft Graph...');

  try {
    /*const response = await axios.post(graphEndpoint, base64MimeBody, {
      headers: {
        'Authorization': `Bearer ${YOUR_GRAPH_ACCESS_TOKEN}`,
        'Content-Type': 'text/plain'
      }
    });*/

    const credential = new ClientSecretCredential(
      process.env.AZURE_AD_TENANT_ID!,
      process.env.AZURE_AD_CLIENT_ID!,
      process.env.AZURE_AD_CLIENT_SECRET!,
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    const graphClient = Client.initWithMiddleware({ authProvider });

    await graphClient.api(`/users/${SHARED_MAILBOX}/sendMail`).headers({ 'Content-Type': 'text/plain' }).post(payloadBuffer);

    //console.log('Success! HTTP Status:', response.status);
    console.log('The static calendar event has been delivered to your test inbox.');
  } catch (error) {
    console.error('Execution Failed!');
    console.error(error);
    //if (error.response) {
    //console.error(`Graph Error Status: ${error.response.status}`);
    //console.error('Graph Error Payload:', JSON.stringify(error.response.data, null, 2));
    //} else {
    //console.error('System Exception:', error.message);
    //}
  }
}
