import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const projectRoot = process.cwd();
const sourceDir = join(projectRoot, 'jobs');
const targetDir = join(projectRoot, '.next', 'standalone', 'jobs');

// Files to compile
const filesToCompile = ['entra-sync/entra-sync-process.ts'];

console.log('[Build] Compiling files...');
console.log(`[Build] Source: ${sourceDir}`);
console.log(`[Build] Target: ${targetDir}`);

try {
  // Compile each file using tsc
  for (const file of filesToCompile) {
    const sourceFile = join(sourceDir, file);

    const fileSubdir = dirname(file);
    const specificTargetDir = join(targetDir, fileSubdir);

    if (!existsSync(sourceFile)) {
      console.warn(`[Build] Warning: Source file not found: ${sourceFile}`);
      continue;
    }

    if (!existsSync(specificTargetDir)) {
      mkdirSync(specificTargetDir, { recursive: true });
    }
    console.log(`[Build] Compiling ${file}...`);

    // Use npx tsc to compile the single file
    const command = `npx tsc "${sourceFile}" --outDir "${targetDir}" --module commonjs --target es2020 --strict false --esModuleInterop true --skipLibCheck true --forceConsistentCasingInFileNames true`;

    try {
      execSync(command, { stdio: 'inherit' });
      console.log(`[Build] Compiled: ${file}`);
    } catch (err) {
      if (err instanceof Error) {
        console.error(`[Build] Failed to compile ${file}:`, err.message);
      } else {
        console.error(`[Build] Failed to compile ${file}:`, err);
      }
      process.exit(1);
    }
  }

  console.log('[Build] Compilation complete');
  process.exit(0);
} catch (err) {
  if (err instanceof Error) {
    console.error('[Build] Build failed:', err.message);
  } else {
    console.error('[Build] Build failed:', err);
  }
  process.exit(1);
}
