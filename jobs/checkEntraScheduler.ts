'use server';

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { platform } from 'node:os';

const execPromise = promisify(exec);

export async function getSchedulerStatus() {
  const isWindows = platform() === 'win32';

  // Windows uses 'tasklist', Linux/Mac uses 'pgrep'
  const command = isWindows ? `tasklist /FI "windowtitle eq tsx jobs/scheduler.ts*" /v /fo csv` : `pgrep -f "tsx jobs/scheduler.ts"`;

  try {
    const { stdout } = await execPromise(command);

    if (isWindows) {
      // Windows check: Does the output contain our script name?
      return { isRunning: stdout.includes('jobs/scheduler.ts') };
    } else {
      // Linux/Mac check: Did pgrep return a Process ID?
      return { isRunning: stdout.trim().length > 0 };
    }
  } catch (err) {
    // pgrep exits with code 1 if no process is found, which throws an error
    return { isRunning: false };
  }
}
