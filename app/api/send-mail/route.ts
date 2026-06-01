import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendEventNotificationEmail } from '@/lib/email';
import { guardRoute } from '@/lib/api-guard';
import { verifySecretHeader } from '@/lib/server/verifySecretHeader';
import { UnauthorizedMessage } from '@/lib/api-helpers';
import { getMeetingResponseEmailTemplate } from '@/lib/emails/html-templates/meeting-response';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  /*if (!verifySecretHeader(request)) {
    return UnauthorizedMessage();
  }*/

  return guardRoute(request, { LoggedIn: { type: 'role', role: 'Private' } }, async ({ sessionUserEmail }) => {
    try {
      const body = await request.json();
      const { recipientEmail } = body;

      if (!recipientEmail || !sessionUserEmail) {
        return NextResponse.json({ error: 'Missing emails' }, { status: 400 });
      }
      const today = new Date().toLocaleString();

      await sendEmail(
        recipientEmail,
        [sessionUserEmail],
        'Test Email',
        getMeetingResponseEmailTemplate({
          header: 'THIS IS THE HEADER',
          date: format(today, 'yyyy-MM-dd hh:mm a'),
          duration: '30 Minutes',
          description: 'DESCRIPTION OF THE EVENT',
          employeeName: 'John Doe',
          notifiedNames: 'USER 1, USER 2, USER 3',
          room: 'Biggings Room',
          status: 'APPROVED',
          title: 'Test Event',
          bookingURL: '/bookings/user-view?view=day&selectedDate=' + format(today, 'yyyy-MM-dd'),
        }),
      );

      return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
    } catch (error) {
      console.error('API Route Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
