'use server';

import { syncEntraUsers } from './syncEntraUsers';

export async function runImmediateSync() {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] Manual Sync Requested`);

    // We await the actual sync logic
    await syncEntraUsers();

    return { success: true, message: 'Manual sync completed successfully.' };
  } catch (err) {
    console.error('Manual Sync Error:', err);
    return { success: false, error: 'Manual sync failed. Check server logs.' };
  }
}
