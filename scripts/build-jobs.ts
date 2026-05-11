import { existsSync, mkdirSync } from 'fs';
import { dirname, join, parse } from 'path';
import { execSync } from 'child_process';
const projectRoot = process.cwd();
const standaloneRoot = join(projectRoot, '.next', 'standalone');

/**
 * CONFIGURATION REGISTRY
 * sourcePath: Relative to project root
 * targetDir: Relative to .next/standalone
 */
const buildRegistry = [
  {
    sourcePath: 'jobs/system-start.ts',
    targetDir: '.', // Root of standalone
    externalList: ['@prisma/client', '.prisma/client'],
  },
  {
    sourcePath: 'jobs/entra-sync/entra-sync-process.ts',
    targetDir: 'jobs/entra-sync',
    externalList: [],
  },
  {
    sourcePath: 'jobs/entra-sync/entra-sync-service.ts',
    targetDir: 'jobs/entra-sync',
    externalList: ['@prisma/client', '.prisma/client'],
  },
];

console.log('[Build] Starting esbuild compilation...');

console.log('[Build] Compiling files...');

try {
  // Compile each file using tsc
  for (const entry of buildRegistry) {
    const fullSourcePath = join(projectRoot, entry.sourcePath);
    const fullTargetDir = join(standaloneRoot, entry.targetDir);

    const fileName = parse(entry.sourcePath).name;
    const outputFile = join(fullTargetDir, `${fileName}.js`);

    console.log(`[Build] Source: ${fullSourcePath}`);
    console.log(`[Build] Target: ${fullTargetDir}`);

    if (!existsSync(fullSourcePath)) {
      console.warn(`[Build] Warning: Source file not found: ${fullSourcePath}`);
      continue;
    }

    if (!existsSync(fullTargetDir)) {
      mkdirSync(fullTargetDir, { recursive: true });
    }

    console.log(`[Build] Processing: ${entry.sourcePath} to ${outputFile}`);

    // Use npx tsc to compile the single file
    const build = `esbuild "${fullSourcePath}" --bundle --platform=node --format=cjs --minify --outfile=${outputFile} `;
    const externalFlags = entry.externalList.map((dep) => `--external:${dep}`).join(' ');
    const command = externalFlags ? `${build} ${externalFlags}` : build;
    //--bundle --platform=node --outfile=dist/entra-sync-process.js
    //--module commonjs --target es2020 --strict false --esModuleInterop true --skipLibCheck true --forceConsistentCasingInFileNames true
    try {
      execSync(command, { stdio: 'inherit' });
    } catch (err) {
      console.error(`[Build] Failed to compile ${entry.sourcePath}`);
      process.exit(1);
    }
  }

  console.log('[Build] All Entries Compiled Successfully.');
  process.exit(0);
} catch (err) {
  console.error('[Build] Unknown Error:', err);
  process.exit(1);
}
