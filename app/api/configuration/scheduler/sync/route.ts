import { syncEntraUsers } from '@/jobs/EntraSync/syncEntraUsers';
import { guardRoute } from '@/lib/api-guard';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return guardRoute(
    request,
    { EditConfiguration: { type: 'permission', resource: 'Settings', action: 'Edit Configuration' } },
    async ({ sessionUserId }) => {
      try {
        console.log(`[${new Date().toLocaleTimeString()}] Manual Sync via API Requested`);
        await syncEntraUsers();
        return NextResponse.json({ success: true, message: 'Manual sync completed successfully.' });
      } catch (err) {
        return NextResponse.json({ success: false, error: 'Manual sync failed.' }, { status: 500 });
      }
    },
  );
}
