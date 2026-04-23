/**
 * App Initialization Handler
 * Called on app startup to validate scheduler state and clean up orphans
 *
 * POST /api/init - Trigger scheduler initialization
 */

import { NextResponse } from 'next/server';
import { initializeSchedulerOnAppStart } from '@/lib/scheduler/manager';

export async function POST() {
  try {
    console.log('[API] App initialization triggered');
    await initializeSchedulerOnAppStart();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] Initialization error:', err);
    return NextResponse.json({ success: false, error: 'Initialization failed' }, { status: 500 });
  }
}
