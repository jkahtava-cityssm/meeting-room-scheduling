import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email';
import { guardRoute } from '@/lib/api-guard';

export async function POST(request: NextRequest) {
  return guardRoute(request, { LoggedIn: { type: 'role', role: 'Private' } }, async ({ sessionUserEmail }) => {
    try {
      const body = await request.json();
      const { recipientEmail } = body;

      if (!recipientEmail || !sessionUserEmail) {
        return NextResponse.json({ error: 'Missing emails' }, { status: 400 });
      }

      await sendTestEmail(recipientEmail, sessionUserEmail);

      return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
    } catch (error) {
      console.error('API Route Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
