'use client';

import { useState, useEffect, useCallback } from 'react';
import { startGlobalScheduler } from './startEntraSheduler';
import { stopGlobalScheduler } from './stopEntraScheduler';
import { getSchedulerStatus } from './checkEntraScheduler';
import { runImmediateSync } from './runSync';

interface SchedulerConfig {
  schedule: string;
  isRunning: boolean;
  pid: number | null;
  marker: string | null;
  startTime: number | null;
}

export function SchedulerControls() {
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState<boolean | null>(null);
  const [config, setConfig] = useState<SchedulerConfig>({
    schedule: '0 3 * * *',
    isRunning: false,
    pid: null,
    marker: null,
    startTime: null,
  });
  const [newSchedule, setNewSchedule] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [updatingSchedule, setUpdatingSchedule] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/configuration/scheduler');
      const data = await response.json();

      if (data.success) {
        setConfig({
          schedule: data.schedule,
          isRunning: data.status.isRunning,
          pid: data.pid,
          marker: data.marker,
          startTime: data.startTime,
        });
        setIsRunning(data.status.isRunning);
        setNewSchedule(data.schedule);
      }
    } catch (err) {
      console.error('[UI] Failed to refresh scheduler status:', err);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    // Refresh status every 5 seconds
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
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
    const res = await startGlobalScheduler(config.schedule);
    if (res.success) {
      await refreshStatus();
    }
    alert(res.message || res.error);
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    const res = await stopGlobalScheduler();
    if (res.success) {
      await refreshStatus();
    }
    alert(res.message || res.error);
    setLoading(false);
  };

  const validateCronExpression = (cron: string): boolean => {
    // Basic cron validation: 5 fields
    const cronRegex =
      /^(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*|\?)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)$/;
    return cronRegex.test(cron.trim());
  };

  const handleUpdateSchedule = async () => {
    if (!newSchedule.trim()) {
      setScheduleError('Schedule cannot be empty');
      return;
    }

    if (!validateCronExpression(newSchedule)) {
      setScheduleError('Invalid cron expression format');
      return;
    }

    setScheduleError('');
    setUpdatingSchedule(true);

    try {
      const response = await fetch('/api/configuration/scheduler', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: newSchedule }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Schedule updated and scheduler restarted!');
        await refreshStatus();
      } else {
        setScheduleError(data.error || 'Failed to update schedule');
      }
    } catch (err) {
      setScheduleError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex flex-col gap-6 p-6 border rounded-xl bg-white shadow-sm">
      {/* Status Section */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <div className="flex flex-col">
            <span className="font-bold text-gray-800">Scheduler: {isRunning === null ? 'Loading...' : isRunning ? 'Running' : 'Stopped'}</span>
            {config.pid && config.isRunning && (
              <span className="text-sm text-gray-600">
                PID: {config.pid} | Started: {formatTime(config.startTime)}
              </span>
            )}
            {config.marker && config.isRunning && (
              <span className="text-xs text-gray-500 font-mono truncate max-w-md" title={config.marker}>
                Marker: {config.marker}
              </span>
            )}
          </div>
        </div>
        <button onClick={refreshStatus} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
          Refresh Status
        </button>
      </div>

      {/* Current Schedule Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">Current Schedule</p>
        <p className="font-mono text-base text-gray-900 mb-1">{config.schedule}</p>
        <p className="text-xs text-gray-600">Next runs at the times specified by this cron expression (minute hour day month weekday)</p>
      </div>

      {/* Update Schedule Section */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Update Schedule</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSchedule}
            onChange={(e) => {
              setNewSchedule(e.target.value);
              setScheduleError('');
            }}
            placeholder="0 3 * * * (minute hour day month weekday)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            disabled={updatingSchedule || loading}
            onClick={handleUpdateSchedule}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:bg-gray-400"
          >
            {updatingSchedule ? 'Updating...' : 'Update'}
          </button>
        </div>
        {scheduleError && <p className="text-sm text-red-600 mt-2">{scheduleError}</p>}
        <p className="text-xs text-gray-500 mt-2">Format: minute (0-59) hour (0-23) day (1-31) month (1-12) weekday (0-6)</p>
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
          Start Scheduler
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
