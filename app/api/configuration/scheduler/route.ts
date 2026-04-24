/**
 * Scheduler Configuration API Endpoint
 *
 * GET  - Fetch current scheduler configuration and status
 * PATCH - Update schedule and trigger restart (admin-only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { findProcessById, getNextCronOccurrence, getSystemProcess, updateSystemProcess, validateCronExpression } from '@/lib/scheduler/manager';
import { startGlobalScheduler } from '@/jobs/startEntraSheduler';
import { stopGlobalScheduler } from '@/jobs/stopEntraScheduler';

const SYSTEM_PROCESS_KEY = 'ENTRA_SYNC_SCHEDULER';

/**
 * GET /api/configuration/scheduler
 * Fetch current scheduler configuration and status
 */
export async function GET() {
  try {
    // Fetch current schedule from DB
    const processEntry = await getSystemProcess(SYSTEM_PROCESS_KEY);

    const activeProcess = findProcessById(processEntry?.pid || 0, processEntry?.tag || '');

    return NextResponse.json({
      success: true,
      schedule: processEntry?.parameter,
      isRunning: activeProcess?.pid ? true : false,
      pid: processEntry?.pid || null,
      marker: processEntry?.tag || null,
      startTime: processEntry?.updatedAt || null,
      nextRuntime: processEntry?.parameter ? getNextCronOccurrence(processEntry.parameter) : null,
    });
  } catch (err) {
    console.error('[API] Scheduler GET error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch scheduler configuration' }, { status: 500 });
  }
}

/**
 * PATCH /api/configuration/scheduler
 * Update schedule and trigger restart
 *
 * Request body: { schedule: "0 3 * * *" }
 */
export async function PATCH(request: NextRequest) {
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
    updateSystemProcess('ENTRA_SYNC_SCHEDULE', undefined, newSchedule);

    // Stop the old scheduler
    const stopResult = await stopGlobalScheduler('ENTRA_SYNC_SCHEDULER');
    if (!stopResult.success) {
      console.warn('[API] Failed to stop old scheduler:', stopResult.error);
      // Continue anyway - we might have orphaned process
    }

    // Start new scheduler with updated schedule
    const startResult = await startGlobalScheduler('ENTRA_SYNC_SCHEDULER', newSchedule);
    if (!startResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to restart scheduler: ${startResult.error}`,
        },
        { status: 500 },
      );
    }

    // Fetch updated status
    //const updatedStatus = getSchedulerStatusFromManager();

    return NextResponse.json({
      success: true,
      message: 'Scheduler schedule updated and process restarted',
      schedule: newSchedule,
      pid: startResult.pid,
      marker: startResult.marker,
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
}

export async function POST() {
  try {
    const result = await startGlobalScheduler('ENTRA_SYNC_SCHEDULER');

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
}

export async function DELETE() {
  try {
    const result = await stopGlobalScheduler('ENTRA_SYNC_SCHEDULER');

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
}
