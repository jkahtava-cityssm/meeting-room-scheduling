import { NextRequest, NextResponse } from 'next/server';

import { validateCronExpression } from '@/jobs/cron-util';
import { guardRoute } from '@/lib/api-guard';

import {
  pollEmailQueueWorker,
  startEmailQueueWorker,
  stopEmailQueueWorker,
  updateEmailQueueWorker,
} from '@/jobs/email-queue/email-queue-server-utils';

/**
 * GET /api/configuration/email-queue
 * Fetch current Email Queue Service status
 */
export async function GET(request: NextRequest) {
  return guardRoute(request, { EditConfiguration: { type: 'permission', resource: 'Settings', action: 'Edit Configuration' } }, async () => {
    try {
      const results = await pollEmailQueueWorker();

      if (!results) {
        return NextResponse.json({ success: false, error: 'Failed to fetch email queue configuration' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        ...results,
      });
    } catch (err) {
      console.error('[API] Email Queue GET error:', err);
      return NextResponse.json({ success: false, error: 'Failed to fetch email queue configuration' }, { status: 500 });
    }
  });
}

/**
 * PATCH /api/configuration/email-queue
 * Update Email Queue Service cron schedule
 *
 * Request body: { schedule: "*\/30 * * * * *" }
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

        console.log(`[API] Updating email queue schedule to: ${newSchedule}`);

        // Update schedule in database
        await updateEmailQueueWorker(newSchedule, sessionUserId);

        return NextResponse.json({
          success: true,
          message: 'Email queue schedule updated and process restarted',
          schedule: newSchedule,
          pid: null,
          marker: null,
          status: 'updatedStatus',
        });
      } catch (err) {
        console.error('[API] Email Queue PATCH error:', err);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to update email queue: ${err instanceof Error ? err.message : 'Unknown error'}`,
          },
          { status: 500 },
        );
      }
    },
  );
}

/**
 * POST /api/configuration/email-queue
 * Start the Email Queue Service

 */
export async function POST(request: NextRequest) {
  return guardRoute(
    request,
    { EditConfiguration: { type: 'permission', resource: 'Settings', action: 'Edit Configuration' } },
    async ({ sessionUserId }) => {
      try {
        const result = await startEmailQueueWorker();

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
 * DELETE /api/configuration/email-queue
 * Stop the Email Queue Service
 */

export async function DELETE(request: NextRequest) {
  return guardRoute(
    request,
    { EditConfiguration: { type: 'permission', resource: 'Settings', action: 'Edit Configuration' } },
    async ({ sessionUserId }) => {
      try {
        const result = await stopEmailQueueWorker();

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
