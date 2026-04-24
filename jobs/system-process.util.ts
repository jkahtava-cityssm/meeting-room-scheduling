'use server';

import { execSync, spawn } from 'node:child_process';
import path from 'path';

import { platform } from 'node:os';
import { getSystemProcess, resetSystemProcess, saveSystemProcess } from './system-process.data';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Find a given Process by PID and determine if it contains our tag.
 * Returns the pid and tag, otherwise null
 */
export function findProcessById(storedPID: number, processTag: string) {
  const isWindows = platform() === 'win32';

  try {
    if (isWindows) {
      // Windows: use tasklist to get running processes

      const psScript = `
                  Get-CimInstance Win32_Process -Filter "ProcessId = ${storedPID}" |
                  ForEach-Object {
                      $cmdLine = $_.CommandLine;
                      $match = [regex]::Match($cmdLine, '--tag\\s+([^\\s]+)');
                      
                      [PSCustomObject]@{
                          pid    = $_.ProcessId;
                          marker = if ($match.Success) { $match.Groups[1].Value } else { "Unknown" };
                      }
                  } | ConvertTo-Json -Compress
              `
        .trim()
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/"/g, '\\"');

      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`;
      const stdout = execSync(cmd, { encoding: 'utf-8' }).trim();

      if (!stdout) return null;

      const data = JSON.parse(stdout);
      // Ensure it contains our marker or db name to be considered "found"
      if (data.marker && data.marker.toLowerCase() === processTag.toLowerCase()) {
        return { pid: data.pid, marker: data.marker };
      }
      return null;
    } else {
      const cmd = `ps -p ${storedPID} -o command=`;
      const stdout = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();

      if (!stdout) return null;
      const match = stdout.match(/--tag\s+([^\s]+)/);
      const extractedMarker = match ? match[1] : 'Unknown';

      if (extractedMarker && extractedMarker.toLowerCase() === processTag.toLowerCase()) {
        return {
          pid: storedPID,
          marker: extractedMarker,
        };
      }

      return null;
    }
  } catch (err) {
    return null;
  }
}

/**
 * Find all orphaned processes based on the given tag, not matching the active PID.
 * Returns a list of process IDs
 */

interface ProcessInfo {
  pid: number;
  marker: string;
}

export function findProcessByTag(processTag: string, activeProcessID: number): number[] {
  const isWindows = platform() === 'win32';

  const orphans: number[] = [];

  try {
    if (isWindows) {
      try {
        const psScript = `
                  Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%--tag ${processTag}%' AND NOT CommandLine LIKE '%Get-CimInstance%'" | 
                  ForEach-Object {
                      $cmdLine = $_.CommandLine;
                      $match = [regex]::Match($cmdLine, '--tag\\s+([^\\s]+)');
                      
                      [PSCustomObject]@{
                          pid    = $_.ProcessId;
                          parent  = $_.ParentProcessId;
                          marker = if ($match.Success) { $match.Groups[1].Value } else { "Unknown" };
                          command = $cmdLine;
                      }
                  } | ConvertTo-Json -Compress
              `
          .trim()
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/"/g, '\\"');

        const formattedCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`;
        const stdout = execSync(formattedCmd, { encoding: 'utf-8' }).trim();

        if (!stdout || stdout.trim() === '') return [];

        const rawData = JSON.parse(stdout);
        const processObject: ProcessInfo[] = Array.isArray(rawData) ? rawData : [rawData];

        for (const process of processObject) {
          if (process.marker && process.pid !== activeProcessID) {
            orphans.push(process.pid);
          }
        }
      } catch (e) {
        console.warn('[ProcessManager] No matching processes found or error occurred:', e);
        return [];
      }
      return orphans;
    } else {
      try {
        // -e: all processes
        // -o pid,args: only output the PID and the full command line
        const output = execSync('ps -e -o pid,args', {
          encoding: 'utf-8',
          timeout: 5000,
        });

        const lines = output.trim().split('\n');

        for (const line of lines) {
          // Split by first whitespace to get PID and everything else as the command
          const match = line.trim().match(/^(\d+)\s+(.+)$/);
          if (!match) continue;

          const pid = parseInt(match[1], 10);
          const fullCommand = match[2];

          //check if the tag is found, and that its not the active process or the Node process
          if (fullCommand.includes('--tag') && fullCommand.includes(processTag) && process.pid !== activeProcessID && pid !== process.pid) {
            orphans.push(pid);
          }
        }
      } catch (e) {
        // ps failed or no processes found
        console.warn('[ProcessManager] Linux process lookup failed:', e);
      }
      return orphans;
    }
  } catch (err) {
    console.error('[ProcessManager] Error finding orphaned processes:', err);
  }

  return orphans;
}

/**
 * Stop orphaned schedulers for this database
 * Gracefully terminates with SIGTERM, then SIGKILL if needed
 */
export async function stopOrphanedProcesses(processKey: string, activeProcessID: number): Promise<void> {
  const orphans = findProcessByTag(processKey, activeProcessID);
  const dbName = process.env.DATABASE_NAME || 'unknown';

  if (orphans.length === 0) {
    console.log('[ProcessManager] No orphaned processes found');
    return;
  }

  console.log(`[ProcessManager] Found ${orphans.length} orphaned processes for database: ${dbName}`);

  for (const pid of orphans) {
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`[ProcessManager] Killed orphaned process (SIGTERM): PID ${pid}`);

      await wait(2000);

      try {
        process.kill(pid, 0);
        // If the line above doesn't throw, the process is STILL ALIVE
        process.kill(pid, 'SIGKILL');
        console.log(`[ProcessManager] Process ${pid} didn't exit in time. Sent SIGKILL.`);
      } catch (e) {
        // If process.kill(pid, 0) throws, the process is already gone.
        console.log(`[ProcessManager] Process ${pid} exited gracefully.`);
      }
    } catch (err) {
      console.warn(`[ProcessManager] Failed to kill orphaned process ${pid}:`, err);
    }
  }
}

export async function stopBackgroundProcess(systemProcessKey: string) {
  try {
    const processEntry = await getSystemProcess(systemProcessKey);

    const activeProcess = findProcessById(processEntry?.pid || 0, processEntry?.tag || '');

    if (!processEntry || !activeProcess) {
      if (processEntry) {
        await resetSystemProcess(systemProcessKey);
      }

      return { success: true, message: `Process '${systemProcessKey}' is not currently running.` };
    }

    const activePID = activeProcess.pid;

    // Now kill the validated process
    try {
      process.kill(activePID, 'SIGTERM');
      console.log(`[ProcessManager] Sent SIGTERM to PID ${activePID}`);

      // Wait a moment, then force kill if still running
      await wait(2000);

      try {
        process.kill(activePID, 0); // Is it still alive?
        process.kill(activePID, 'SIGKILL');
        console.log(`[ProcessManager] PID ${activePID} did not exit in time. Sent SIGKILL.`);
      } catch {
        console.log(`[ProcessManager] PID ${activePID} exited gracefully.`);
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ESRCH') {
        // ESRCH means process not found, which is okay
        console.error('[ProcessManager] Error killing process:', err);
      }
    }

    // Clean up metadata file
    await resetSystemProcess(systemProcessKey);

    return {
      success: true,
      message: `Process '${systemProcessKey}' stopped successfully (PID: ${activePID}).`,
    };
  } catch (err) {
    console.error(`[ProcessManager] Error stopping ${systemProcessKey}:`, err);
    return {
      success: false,
      error: `Failed to stop the process: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

interface SpawnOptions {
  systemProcessKey: string;
  scriptPath: string[];
  args?: string[];
  defaultParameter?: string;
  validate?: (param: string) => boolean;
}

export async function startBackgroundProcess({ systemProcessKey, scriptPath, args = [], defaultParameter = '', validate }: SpawnOptions) {
  try {
    // 1. Create a unique identifier tag
    const dbName = process.env.DATABASE_NAME || 'unknown';
    const processTag = `${systemProcessKey}_${process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'unknown'}`.toUpperCase();

    // 2. Check for existing process
    const processEntry = await getSystemProcess(systemProcessKey);
    const activeProcess = findProcessById(processEntry?.pid || 0, processEntry?.tag || '');

    if (activeProcess && processEntry) {
      return {
        success: false,
        message: `Process '${systemProcessKey}' is already running.`,
        pid: activeProcess.pid,
        parameter: processEntry.parameter,
      };
    }

    // 3. Cleanup & Parameter Resolution
    await stopOrphanedProcesses(processTag, processEntry?.pid || 0);
    const finalParam = processEntry?.parameter || defaultParameter;

    if (validate && !validate(finalParam)) {
      return { success: false, error: `Validation failed for parameter: ${finalParam}` };
    }

    // 4. Resolve Absolute Script Path
    const absolutePath = path.join(process.cwd(), ...scriptPath);

    // 5. Spawn Process
    const child = spawn('node', [absolutePath, ...args, '--tag', processTag], {
      detached: true,
      stdio: 'ignore',
      shell: false,
      windowsHide: true,
    });

    const pid = child.pid;
    if (!pid) throw new Error('No PID returned from spawn');

    child.unref();

    // 6. Persistence
    await saveSystemProcess(pid, finalParam, processTag, systemProcessKey);

    return {
      success: true,
      message: `Process '${systemProcessKey}' started successfully.`,
      pid,
      tag: processTag,
      parameter: finalParam,
    };
  } catch (err) {
    console.error(`[ProcessManager] Error starting ${systemProcessKey}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
