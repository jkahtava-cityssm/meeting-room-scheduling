import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

export interface SchedulerConfig {
  schedule: string;
  isRunning: boolean;
  pid: number | null;
  startTime: number | null;
  nextRuntime?: string | null;
}

export function useEntraSyncProcess() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<SchedulerConfig>({
    schedule: '0 3 * * *',
    isRunning: false,
    pid: null,
    startTime: null,
    nextRuntime: null,
  });

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuration/scheduler');
      const data = await response.json();
      if (data.success) {
        setConfig({
          schedule: data.schedule,
          isRunning: data.isRunning,
          pid: data.pid,
          startTime: data.startTime,
          nextRuntime: data.nextRuntime,
        });
      }
    } catch (err) {
      console.error('Failed to refresh scheduler:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 60000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const startScheduler = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/configuration/scheduler', { method: 'POST' });
      await refreshStatus();
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  const stopScheduler = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/configuration/scheduler', { method: 'DELETE' });
      await refreshStatus();
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (newCron: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/configuration/scheduler', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: newCron }),
      });
      await refreshStatus();
      return await res.json();
    } finally {
      setLoading(false);
    }
  };

  const validateCronExpression = (cron: string) => {
    // Basic regex: 5 fields separated by spaces
    const cronRegex =
      /^(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*|\?)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)$/;
    return cronRegex.test(cron.trim());
  };

  return { config, loading, refreshStatus, startScheduler, stopScheduler, updateSchedule, validateCronExpression };
}
