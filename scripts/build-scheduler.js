import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const projectRoot = process.cwd();
const sourceDir = join(projectRoot, 'jobs');
const targetDir = join(projectRoot, '.next', 'standalone', 'jobs');

// Files to compile
const filesToCompile = ['entra-sync-process.ts'];

console.log('[Build] Compiling scheduler files...');
console.log(`[Build] Source: ${sourceDir}`);
console.log(`[Build] Target: ${targetDir}`);

try {
  // Ensure target directory exists
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
    console.log(`[Build] Created directory: ${targetDir}`);
  }

  // Compile each file using tsc
  for (const file of filesToCompile) {
    const sourceFile = join(sourceDir, file);
    const targetFile = join(targetDir, file.replace('.ts', '.js'));

    if (!existsSync(sourceFile)) {
      console.warn(`[Build] Warning: Source file not found: ${sourceFile}`);
      continue;
    }

    console.log(`[Build] Compiling ${file}...`);

    // Use npx tsc to compile the single file
    const command = `npx tsc "${sourceFile}" --outDir "${targetDir}" --module commonjs --target es2020 --strict false --esModuleInterop true --skipLibCheck true --forceConsistentCasingInFileNames true`;

    try {
      execSync(command, { stdio: 'inherit' });
      console.log(`[Build] Compiled: ${file}`);
    } catch (err) {
      console.error(`[Build] Failed to compile ${file}:`, err.message);
      process.exit(1);
    }
  }

  console.log('[Build] Scheduler compilation complete');
  console.log(`[Build] Compiled files available at: ${targetDir}`);
  process.exit(0);
} catch (err) {
  console.error('[Build] Build failed:', err.message);
  process.exit(1);
}
