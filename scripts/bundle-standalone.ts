import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const STANDALONE_PATH = path.join(ROOT, '.next/standalone');
const DIST_PATH = path.join(ROOT, 'dist');

const bundle = () => {
  try {
    console.log('--- Starting Bundle Process ---');

    // 1. Clean/Create dist folder
    if (fs.existsSync(DIST_PATH)) fs.rmSync(DIST_PATH, { recursive: true });
    fs.mkdirSync(DIST_PATH);

    // 2. Copy Standalone Core
    // This includes the server.js and the minimal node_modules
    if (!fs.existsSync(STANDALONE_PATH)) {
      throw new Error('Standalone folder not found. Did you set "output: standalone" in next.config.js?');
    }
    console.log('Copying standalone server and modules...');
    fs.cpSync(STANDALONE_PATH, DIST_PATH, { recursive: true });

    // 3. Copy Static Assets (The "Critical Fix")
    // Standalone mode doesn't include 'public' or '.next/static' by default
    console.log('Copying static assets and public files...');

    const distNextPath = path.join(DIST_PATH, '.next/static');
    const distPublicPath = path.join(DIST_PATH, 'public');

    fs.cpSync(path.join(ROOT, '.next/static'), distNextPath, { recursive: true });
    fs.cpSync(path.join(ROOT, 'public'), distPublicPath, { recursive: true });

    // 4. Copy Prisma Engine (If using Prisma)
    // Sometimes the standalone logic misses the specific binary needed for the target OS
    console.log('Finalizing bundle...');

    console.log(`
Successfully bundled to: ${DIST_PATH}
    
To run on the target machine:
  1. Transfer the contents of /dist
  2. Run: node server.js
    `);
  } catch (error) {
    console.error('Bundle failed:', error);
    process.exit(1);
  }
};

bundle();
