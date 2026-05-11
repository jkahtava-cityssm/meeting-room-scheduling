import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import { EntraSyncSchema } from './schema';
import z from 'zod/v4';
import { SYSTEM_PROCESS_MANIFEST, TSystemProcess } from '@/lib/types';
import { getSystemProcess, updateSystemProcess } from './system-process.data';
import { stopOrphanedProcesses } from './system-process.util';

// Internal Imports

/**
 * TYPE DEFINITIONS
 */
interface ProcessDef {
  name: string;
  scriptPath: string;
  env?: Record<string, string>;
  isCritical?: boolean;
  dbTracking?: {
    key: TSystemProcess;
    schema: z.ZodObject;
  };
}

/**
 * PROCESS REGISTRY
 * Add new background tasks or servers here.
 */
const PROCESS_CONFIGS: Record<string, ProcessDef> = {
  NEXT_SERVER: {
    name: 'NextServer',
    scriptPath: './server.js',
    isCritical: true,
    env: { PORT: `${process.env.PORT}` },
  },
  ENTRA_SYNC: {
    name: 'EntraSync',
    scriptPath: './jobs/entra-sync/entra-sync-process.js',
    isCritical: false,
    dbTracking: {
      key: SYSTEM_PROCESS_MANIFEST['ENTRA_SYNC_SCHEDULER'].key,
      schema: EntraSyncSchema,
    },
  },
  // Example of how easy it is to add a new one:
  // CLEANER: { name: 'LogCleaner', scriptPath: './jobs/cleanup.js' }
};

/**
 * STATE MANAGEMENT
 */
const children: ChildProcess[] = [];

/**
 * CORE FUNCTIONS
 */

function spawnChild(name: string, args: string[], env: Record<string, string> = {}, isCritical: boolean = false): ChildProcess {
  console.log(`[Orchestrator] Launching ${name}...`);

  const child = spawn('node', args, {
    shell: false,
    stdio: 'inherit',
    env: { ...process.env, ...env, ORCHESTRATED_BY: 'main' },
  });

  child.on('error', (err) => console.error(`[Orchestrator] ${name} CRITICAL ERROR:`, err));

  child.on('exit', (code, signal) => {
    console.log(`[Orchestrator] ${name} terminated (Code: ${code}, Signal: ${signal})`);
    // If a core process dies, we shut down the orchestrator
    if (isCritical && code !== 0 && signal !== 'SIGTERM') {
      console.error(`[Orchestrator] Critical process ${name} crashed. Shutting down.`);
      process.exit(code || 1);
    }
  });

  children.push(child);
  return child;
}

async function startManagedProcess(config: ProcessDef) {
  const fullPath = path.resolve(__dirname, config.scriptPath);

  if (!existsSync(fullPath)) {
    throw new Error(`Script not found for ${config.name} at: ${fullPath}`);
  }

  const finalArgs = [fullPath];
  let processTag = config.name.toUpperCase();

  // 1. Handle DB Configuration & Orphan Cleanup
  if (config.dbTracking) {
    const { key, schema } = config.dbTracking;
    const processEntry = await getSystemProcess(key, schema);

    if (!processEntry || !('parameter' in processEntry)) {
      throw new Error(`Database config missing for ${key}`);
    }

    const dbName = process.env.DATABASE_NAME || 'unknown';
    processTag = `${key}_${dbName}`.toUpperCase();

    // Kill any previous instances using this tag
    await stopOrphanedProcesses(processTag, process.pid);

    // Map DB parameters to CLI flags
    for (const [paramKey, paramVal] of Object.entries(processEntry.parameter)) {
      finalArgs.push(`--${paramKey}`, String(paramVal));
    }
    finalArgs.push('--marker', processTag);
  }

  // 2. Spawn
  const child = spawnChild(config.name, finalArgs, config.env, config.isCritical);

  // 3. Update DB with new PID
  if (config.dbTracking && child.pid) {
    await updateSystemProcess({
      processKey: config.dbTracking.key,
      pid: child.pid,
      processTag,
    });
    console.log(`[Orchestrator] ${config.name} tracked in DB (PID: ${child.pid})`);
  }
}

async function bootstrap() {
  console.log('[Orchestrator] Initializing system processes...');

  try {
    // We iterate through the record.
    // Using a for...of loop ensures they start in order.
    for (const key of Object.keys(PROCESS_CONFIGS)) {
      await startManagedProcess(PROCESS_CONFIGS[key]);
    }

    console.log('[Orchestrator] All systems operational.');
  } catch (err) {
    console.error('[Orchestrator] Bootstrap failed:', err);
    process.exit(1);
  }
}

/**
 * SIGNAL HANDLING
 */
const handleCleanup = (signal: NodeJS.Signals) => {
  console.log(`[Orchestrator] ${signal} received. Cleaning up children...`);
  children.forEach((child) => {
    if (child.pid) child.kill(signal);
  });
};

process.on('SIGTERM', () => handleCleanup('SIGTERM'));
process.on('SIGINT', () => handleCleanup('SIGINT'));

// Execute
bootstrap();
