'use client';

import { useState, useEffect, useCallback } from 'react';
import { startGlobalScheduler } from './startEntraSheduler';
import { stopGlobalScheduler } from './stopEntraScheduler';
import { getSchedulerStatus } from './checkEntraScheduler';
import { runImmediateSync } from './runSync';

export function SchedulerControls() {
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState<boolean | null>(null);

  const refreshStatus = useCallback(async () => {
    const { isRunning: status } = await getSchedulerStatus();
    setIsRunning(status);
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Handler for the immediate sync
  const handleSyncNow = async () => {
    setLoading(true);
    const res = await runImmediateSync();
    alert(res.message || res.error);
    setLoading(false);
  };

  const handleStart = async () => {
    setLoading(true);
    const res = await startGlobalScheduler('0 3 * * *');
    if (res.success) await refreshStatus();
    alert(res.message || res.error);
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    const res = await stopGlobalScheduler();
    if (res.success) await refreshStatus();
    alert(res.message || res.error);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6 border rounded-xl bg-white shadow-sm">
      {/* Status Section */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-bold text-gray-800">Scheduler: {isRunning === null ? 'Loading...' : isRunning ? 'Running' : 'Stopped'}</span>
        </div>
        <button onClick={refreshStatus} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
          Refresh Status
        </button>
      </div>

      {/* Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sync Now - Blue for immediate action */}
        <button
          disabled={loading}
          onClick={handleSyncNow}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Syncing...' : 'Sync Users Now'}
        </button>

        {/* Start - Green for persistent background task */}
        <button
          disabled={loading || isRunning === true}
          onClick={handleStart}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:bg-gray-400"
        >
          Start 3AM Scheduler
        </button>

        {/* Stop - Red for termination */}
        <button
          disabled={loading || isRunning === false}
          onClick={handleStop}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:bg-gray-400"
        >
          Stop Scheduler
        </button>
      </div>
    </div>
  );
}
