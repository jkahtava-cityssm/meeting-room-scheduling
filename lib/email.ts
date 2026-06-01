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
import { getStaffNotificationEmailTemplate } from './emails/html-templates/staff-notification';
import { findManyItems } from './data/items';

const SHARED_MAILBOX = process.env.SHARED_MAILBOX;

export async function sendEmail(requestingUser: string, notifyUsers: string[], subject: string, htmlContent: string) {
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

interface ISendEventEmailOptions {
  userId: number | undefined;
  eventRecipients: number[];
  eventRooms: number[];
  statusId: number;
  startDate: Date;
  endDate: Date;
  title: string;
  action: TEmailAction;
  eventId: number;
  description: string;
  requestedItems: number[];
}

export async function sendEventNotificationEmail(options: ISendEventEmailOptions) {
  const { userId, eventRecipients, eventRooms, statusId, startDate, endDate, title, action, eventId, description, requestedItems } = options;

  try {
    const [user, recipients, rooms, status, items] = await Promise.all([
      findFirstUser({ id: userId }),
      findManyUsers({ id: { in: eventRecipients || [] } }),
      findManyRooms({ roomId: { in: eventRooms || [] } }),
      findFirstStatus({ statusId: statusId }),
      findManyItems({ itemId: { in: requestedItems || [] } }),
    ]);

    if (!user) throw new Error(`Send Event Email Failed: Requesting user with ID ${userId} not found.`);
    if (!user.email) throw new Error(`Send Event Email Failed: Requesting user with ID ${userId} missing email.`);
    if (!user.emailEnabled) return;
    if (!status || !status.key) throw new Error(`Send Event Email Failed: Valid status key not found for statusId ${statusId}.`);

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

    const bookingURL = byGroup
      ? APP_FULL_URL + '/bookings/user-view?view=day&selectedDate=' + format(startDate, 'yyyy-MM-dd') + '&eventId=' + eventId
      : APP_FULL_URL + '/availability?view=public&selectedDate=' + format(startDate, 'yyyy-MM-dd');

    const formattedDate = format(new TZDate(startDate, timezone), 'yyyy-MM-dd hh:mm a');

    await sendEmail(
      user.email,
      recipients.map((r) => r.email || ''),
      `Booking ${getSubjectKeyword(status.key as TStatusKey, action)} [${formattedDate}]`,
      getMeetingResponseEmailTemplate({
        header: getHeader(status.key as TStatusKey, action),
        date: formattedDate,
        duration: getDurationText(startDate, endDate),
        description: description,
        employeeName: user.name,
        notifiedNames: recipients.map((r) => r.name).join(', '),
        room: rooms.map((r) => r.name).join(', '),
        status: status.key as TStatusKey,
        title: title,
        bookingURL: bookingURL,
      }),
    );

    if (status.key === 'PENDING' && action === 'CREATE') {
      if (!SHARED_MAILBOX) {
        console.log('SHARED_MAILBOX Environment Variable Not Configured');
        return;
      }

      await sendEmail(
        SHARED_MAILBOX,
        [],
        `Booking ${getSubjectKeyword(status.key as TStatusKey, action)} [${formattedDate}]`,
        getStaffNotificationEmailTemplate({
          date: formattedDate,
          duration: getDurationText(startDate, endDate),
          description: description,
          requestedItems: items.map((i) => i.name).join(', '),
          employeeName: user.name,
          notifiedNames: recipients.map((r) => r.name).join(', '),
          room: rooms.map((r) => r.name).join(', '),
          title: title,
          bookingURL: APP_FULL_URL + '/bookings/user-requests?view=year&selectedDate=' + format(startDate, 'yyyy-MM-dd') + '&eventId=' + eventId,
        }),
      );
    }
  } catch (error) {
    console.error('Failed to orchestrate event email notification:', error);
  }
}

function getHeader(status: TStatusKey, action: TEmailAction): string {
  if (action === 'DELETE') return 'REQUEST REMOVED';
  if (status === 'INFORMATION') return 'INFORMATION REQUESTED';
  if (status === 'REJECTED') return 'BOOKING UNAVAILABLE';
  return status;
}

function getSubjectKeyword(status: TStatusKey, action: TEmailAction): string {
  if (action === 'DELETE') return 'Removed';
  if (status === 'REJECTED') return 'Rejected';
  if (status === 'INFORMATION') return 'Requires More Information';
  if (action === 'CREATE' || action === 'STATUS_CHANGE') {
    return status === 'PENDING' ? 'Requested' : 'Approved';
  }
  if (action === 'UPDATE') {
    return status === 'PENDING' ? 'Requested - Details Updated' : 'Approved - Details Updated';
  }
  return '';
}

function generateCalendarAttachment() {
  const format = `BEGIN:VCALENDAR
                  VERSION:2.0
                  PRODID:-//Example Corp//Comprehensive Calendar File//EN
                  CALSCALE:GREGORIAN
                  METHOD:PUBLISH
                  X-WR-CALNAME:Ultimate Master Calendar
                  X-WR-TIMEZONE:America/New_York

                  BEGIN:VTIMEZONE
                  TZID:America/New_York
                  TZURL:https://tzurl.org
                  BEGIN:STANDARD
                  TZOFFSETFROM:-0400
                  TZOFFSETTO:-0500
                  TZNAME:EST
                  DTSTART:19701101T020000
                  RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
                  END:STANDARD
                  BEGIN:DAYLIGHT
                  TZOFFSETFROM:-0500
                  TZOFFSETTO:-0400
                  TZNAME:EDT
                  DTSTART:19700308T020000
                  RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
                  END:DAYLIGHT
                  END:VTIMEZONE

                  BEGIN:VEVENT
                  UID:evt-9876543210@example.com
                  DTSTAMP:20260601T141500Z
                  SEQUENCE:0
                  URL:https://example.com
                  DTSTART;TZID=America/New_York:20260615T090000
                  DTEND;TZID=America/New_York:20260615T100000
                  TRANSP:OPAQUE
                  SUMMARY:Project Kickoff Launch Event
                  DESCRIPTION:Comprehensive kickoff session.\nReview deliverables.
                  LOCATION:Conference Room B\, 123 Main Street
                  GEO:40.7128;-74.0060
                  CATEGORIES:WORK,PROJECTS
                  COMMENT:Please arrive 5 minutes early for AV setup.
                  STATUS:CONFIRMED
                  PRIORITY:1
                  ORGANIZER;CN=Jane Doe:mailto:jane.doe@example.com
                  ATTENDEE;RSVP=TRUE;ROLE=REQ-PARTICIPANT;CUTYPE=INDIVIDUAL:mailto:john.smith@example.com
                  CONTACT:Project Management Office (PMO) ext. 441
                  RRULE:FREQ=WEEKLY;COUNT=4;BYDAY=MO
                  RDATE;TZID=America/New_York:20260715T090000
                  EXDATE;TZID=America/New_York:20260622T090000
                  RESOURCES:PROJECTOR,WHITEBOARD
                  ATTACH:https://example.com
                  BEGIN:VALARM
                  ACTION:DISPLAY
                  TRIGGER:-PT15M
                  DESCRIPTION:Reminder: Project Kickoff Launch Event begins in 15 minutes.
                  END:VALARM
                  BEGIN:VALARM
                  ACTION:EMAIL
                  TRIGGER:-P1D
                  DESCRIPTION:Tomorrow is the Project Kickoff.
                  SUMMARY:Event Reminder: Project Kickoff
                  ATTENDEE:mailto:jane.doe@example.com
                  END:VALARM
                  END:VEVENT

                  BEGIN:VTODO
                  UID:task-1122334455@example.com
                  DTSTAMP:20260601T141500Z
                  SEQUENCE:1
                  URL:https://example.com
                  DTSTART;TZID=America/New_York:20260610T120000
                  DUE;TZID=America/New_York:20260614T170000
                  COMPLETED:20260614T163000Z
                  PERCENT-COMPLETE:100
                  SUMMARY:Sign vendor contract agreement
                  DESCRIPTION:Review final legal clauses and sign execution copy.
                  LOCATION:Legal Department Office
                  GEO:40.7128;-74.0060
                  CATEGORIES:LEGAL,ADMIN
                  COMMENT:Counter-signature from vendor is attached.
                  STATUS:COMPLETED
                  PRIORITY:3
                  ORGANIZER;CN=Legal Team:mailto:legal@example.com
                  ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:john.smith@example.com
                  CONTACT:Legal Support Desk ext. 900
                  ATTACH:https://example.com
                  BEGIN:VALARM
                  ACTION:AUDIO
                  TRIGGER;VALUE=DATE-TIME:20260614T120000Z
                  DURATION:PT5M
                  REPEAT:3
                  ATTACH;VALUE=URI:CID:AlarmSound
                  END:VALARM
                  END:VTODO

                  BEGIN:VJOURNAL
                  UID:jrnl-5566778899@example.com
                  DTSTAMP:20260601T141500Z
                  SEQUENCE:0
                  STATUS:FINAL
                  DTSTART;VALUE=DATE:20260615
                  SUMMARY:Post-Kickoff Meeting Notes
                  DESCRIPTION:The kickoff was successful. Team agreed on milestones.\nNext sync scheduled.
                  ORGANIZER;CN=Jane Doe:mailto:jane.doe@example.com
                  CATEGORIES:NOTES,PROJECTS
                  END:VJOURNAL

                  BEGIN:VFREEBUSY
                  UID:fb-0011223344@example.com
                  DTSTAMP:20260601T141500Z
                  ORGANIZER;CN=Jane Doe:mailto:jane.doe@example.com
                  URL:https://example.com
                  DTSTART:20260615T000000Z
                  DTEND:20260616T000000Z
                  FREEBUSY;FBTYPE=BUSY:20260615T090000Z/20260615T100000Z
                  FREEBUSY;FBTYPE=BUSY-TENTATIVE:20260615T130000Z/20260615T140000Z
                  COMMENT:Standard Monday operational availability profile.
                  END:VFREEBUSY

                  END:VCALENDAR
`;
}
