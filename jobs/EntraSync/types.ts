/**
 * Scheduler metadata and configuration types
 */

export interface SchedulerMetadata {
  /** Process ID of the running scheduler */
  pid: number;

  /** Database name for multi-project safety */
  databaseName: string;

  /** Unix timestamp when scheduler started */
  startTime: number;

  /** Hash of the current cron schedule (detect changes) */
  scheduleHash: string;

  /** Unique process marker: SCHEDULER_DB_<DATABASE_NAME>_<UUID> */
  processMarker: string;

  /** Current cron schedule string */
  schedule: string;
}

export interface SchedulerStatus {
  /** Whether a scheduler is currently running */
  isRunning: boolean;

  /** Current process ID (if running) */
  pid?: number;

  /** Current cron schedule (if running) */
  schedule?: string;

  /** Process marker (if running) */
  processMarker?: string;

  /** When scheduler last started */
  startTime?: number;
}

export interface UpdateScheduleResponse {
  success: boolean;
  message: string;
  newPid?: number;
  newSchedule?: string;
  processMarker?: string;
  error?: string;
}
