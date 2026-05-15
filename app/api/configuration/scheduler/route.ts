import { NextRequest, NextResponse } from 'next/server';

import { validateCronExpression } from '@/jobs/cron-util';
import { guardRoute } from '@/lib/api-guard';

import {
  pollEntraSyncScheduler,
  startEntraSyncScheduler,
  stopEntraSyncScheduler,
  updateEntraSyncSchedule,
} from '@/jobs/entra-sync/entra-sync-server-utils';

/**
 * GET /api/configuration/scheduler
 * Fetch current Entra ID Sync Service status
 */
export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { EditConfiguration: { type: 'permission', resource: 'Settings', action: 'Edit Configuration' } },
    async ({ sessionUserId }) => {
      try {
        const results = await pollEntraSyncScheduler();

        if (!results) {
          return NextResponse.json({ success: false, error: 'Failed to fetch scheduler configuration' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          ...results,
        });
      } catch (err) {
        console.error('[API] Scheduler GET error:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch scheduler configuration' }, { status: 500 });
      }
    },
  );
}

/**
 * PATCH /api/configuration/scheduler
 * Update Entra ID Sync Service cron schedule
 *
 * Request body: { schedule: "0 3 * * *" }
 */
export async function PATCH(request: NextRequest) {
  return guardRoute(
    request,
    { EditConfiguration: { type: 'permission', resource: 'Settings', action: 'Edit Configuration' } },
    async ({ sessionUserId }) => {
      try {
        // Parse request body
        let body;
        try {
          body = await request.json();
        } catch {
          return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
        }

        const { schedule: newSchedule } = body;

        if (!newSchedule || typeof newSchedule !== 'string') {
          return NextResponse.json({ success: false, error: 'schedule field is required and must be a string' }, { status: 400 });
        }

        // Validate cron expression
        if (!validateCronExpression(newSchedule)) {
          return NextResponse.json({ success: false, error: `Invalid cron expression: ${newSchedule}` }, { status: 400 });
        }

        console.log(`[API] Updating scheduler schedule to: ${newSchedule}`);

        // Update schedule in database
        await updateEntraSyncSchedule(newSchedule, sessionUserId);

        return NextResponse.json({
          success: true,
          message: 'Scheduler schedule updated and process restarted',
          schedule: newSchedule,
          pid: null,
          marker: null,
          status: 'updatedStatus',
        });
      } catch (err) {
        console.error('[API] Scheduler PATCH error:', err);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to update scheduler: ${err instanceof Error ? err.message : 'Unknown error'}`,
          },
          { status: 500 },
        );
      }
    },
  );
}

/**
 * POST /api/configuration/scheduler
 * Start the Entra ID Sync Service

 */
export async function POST(request: NextRequest) {
  return guardRoute(
    request,
    { EditConfiguration: { type: 'permission', resource: 'Settings', action: 'Edit Configuration' } },
    async ({ sessionUserId }) => {
      try {
        const result = await startEntraSyncScheduler();

        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
      } catch (err) {
        return NextResponse.json(
          {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          },
          { status: 500 },
        );
      }
    },
  );
}

/**
 * DELETE /api/configuration/scheduler
 * Stop the Entra ID Sync Service
 */

export async function DELETE(request: NextRequest) {
  return guardRoute(
    request,
    { EditConfiguration: { type: 'permission', resource: 'Settings', action: 'Edit Configuration' } },
    async ({ sessionUserId }) => {
      try {
        const result = await stopEntraSyncScheduler();

        if (!result.success) {
          return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
      } catch (err) {
        return NextResponse.json(
          {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          },
          { status: 500 },
        );
      }
    },
  );
}
