#!/usr/bin/env bun

/**
 * Copies Resize codec artifacts from the central .squoosh-temp directory
 * into this package's dist/wasm directory.
 *
 * This script assumes `bun run sync-codecs` has already been run at the root.
 */

import { join } from 'path';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';

const PACKAGE_ROOT = join(import.meta.dir, '..');
const SQUOOSH_ROOT = join(PACKAGE_ROOT, '..', '..', '.squoosh-temp');
const DEST_DIR = join(PACKAGE_ROOT, 'dist', 'wasm');

async function main() {
  const resizeSrc = join(SQUOOSH_ROOT, 'codecs', 'resize', 'pkg');

  if (!existsSync(resizeSrc)) {
    console.error(`Squoosh Resize source directory not found at: ${resizeSrc}`);
    console.error(
      'Please run `bun run sync-codecs` at the project root first.'
    );
    process.exit(1);
  }

  // Clean and recreate wasm directory
  if (existsSync(DEST_DIR)) {
    rmSync(DEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(DEST_DIR, { recursive: true });

  console.log('Copying Resize codec artifacts...');

  const filesToCopy = [
    'squoosh_resize_bg.wasm',
    'squoosh_resize.js',
    'squoosh_resize.d.ts',
    'squoosh_resize_bg.wasm.d.ts',
  ];

  let copiedCount = 0;
  for (const file of filesToCopy) {
    const srcFile = join(resizeSrc, file);
    const destFile = join(DEST_DIR, file);
    if (existsSync(srcFile)) {
      cpSync(srcFile, destFile);
      console.log(`  ✓ Copied ${file}`);
      copiedCount++;
    }
  }

  if (copiedCount === 0) {
    console.warn('Warning: No Resize codec files were copied.');
  } else {
    console.log(`\nCopied ${copiedCount} Resize codec files successfully.`);
  }
}

main().catch((error) => {
  console.error('Error copying Resize assets:', error);
  process.exit(1);
});
