/**
 * Hook to initialize scheduler on app load
 * Calls the initialization API once when the app starts
 */

'use client';

import { useEffect } from 'react';

export function useSchedulerInit() {
  useEffect(() => {
    const initScheduler = async () => {
      try {
        const response = await fetch('/api/init', { method: 'POST' });
        if (!response.ok) {
          console.error('[App] Scheduler initialization failed');
        }
      } catch (err) {
        console.error('[App] Scheduler initialization error:', err);
      }
    };

    initScheduler();
  }, []);
}
