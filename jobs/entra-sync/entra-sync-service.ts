import { loadEnvConfig } from '@next/env';
import { parseArgs } from 'node:util';
import path from 'path';

import { EntraSyncSchema } from '../schema';
import { getSystemProcess, saveSystemProcess, updateSystemProcess, resetSystemProcess } from '../system-process.data';
import { SYSTEM_PROCESS_MANIFEST } from '@/lib/types';

const SYSTEM_PROCESS_KEY = SYSTEM_PROCESS_MANIFEST['ENTRA_SYNC_SCHEDULER'].key;
const SYSTEM_PROCESS_DEFAULT_PARAMETER = SYSTEM_PROCESS_MANIFEST['ENTRA_SYNC_SCHEDULER'].defaultParameter;

interface EntraSyncProcessConfig {
  pid: number;
  tag: string;
  updatedAt: Date;
  parameter: {
    schedule: string;
  };
}

async function bootstrap() {
  const rootPath = path.join(__dirname, '..', '..');
  loadEnvConfig(rootPath);

  const { values } = parseArgs({
    options: {
      marker: { type: 'string' },
      schedule: { type: 'string' },
    },
  });

  const marker = values.marker ?? `SERVICE_${process.pid}`;
  let schedule = values.schedule ?? process.env.ENTRA_SYNC_SCHEDULE;

  const currentConfig = (await getSystemProcess(SYSTEM_PROCESS_KEY, EntraSyncSchema)) as EntraSyncProcessConfig | null;

  if (!currentConfig) {
    const defaultParams = JSON.parse(SYSTEM_PROCESS_DEFAULT_PARAMETER) as { schedule?: string };
    schedule ||= defaultParams.schedule;

    if (!schedule) {
      throw new Error('No schedule found for Entra sync service.');
    }

    await saveSystemProcess({
      processKey: SYSTEM_PROCESS_KEY,
      pid: process.pid,
      processTag: marker,
      parameter: JSON.stringify({ schedule }),
      userId: 0,
    });
  } else {
    schedule ||= currentConfig.parameter.schedule;

    if (!schedule) {
      throw new Error('No schedule found for Entra sync service.');
    }

    await updateSystemProcess({
      processKey: SYSTEM_PROCESS_KEY,
      pid: process.pid,
      processTag: marker,
      parameter: JSON.stringify({ schedule }),
      userId: 0,
    });
  }

  process.env.ENTRA_SYNC_SCHEDULE = schedule;

  console.log(`[Service] Registered with PID=${process.pid} marker=${marker} schedule=${schedule}`);

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
  process.on('uncaughtException', (error) => {
    console.error('[Service] Uncaught exception:', error);
    handleShutdown().then(() => process.exit(1));
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[Service] Unhandled rejection:', reason);
    handleShutdown().then(() => process.exit(1));
  });

  await import('./entra-sync-process');
}

async function handleShutdown() {
  try {
    await resetSystemProcess(SYSTEM_PROCESS_KEY);
    console.log('[Service] Scheduler metadata reset');
  } catch (error) {
    console.error('[Service] Failed to reset scheduler metadata:', error);
  }
}

bootstrap().catch((error) => {
  console.error('[Service] Bootstrap failed:', error);
  process.exit(1);
});
