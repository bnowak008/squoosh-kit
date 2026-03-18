#!/usr/bin/env bun

/**
 * Copies VisDif codec artifacts from the central .squoosh-temp directory
 * into this package's wasm/visdif directory.
 *
 * This script assumes `bun run sync-codecs` has already been run at the root.
 */

import { join } from 'path';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';

const PACKAGE_ROOT = join(import.meta.dir, '..');
const SQUOOSH_ROOT = join(PACKAGE_ROOT, '..', '..', '.squoosh-temp');
const DEST_DIR = join(PACKAGE_ROOT, 'wasm', 'visdif');
const SRC_DIR = join(SQUOOSH_ROOT, 'codecs', 'visdif');

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`Squoosh VisDif source directory not found at: ${SRC_DIR}`);
    console.error(
      'Please run `bun run sync-codecs` at the project root first.'
    );
    process.exit(1);
  }

  // Clean and recreate destination directory
  if (existsSync(DEST_DIR)) {
    rmSync(DEST_DIR, { recursive: true, force: true });
  }
  mkdirSync(DEST_DIR, { recursive: true });

  console.log('Copying VisDif codec artifacts...');

  const filesToCopy = ['visdif.js', 'visdif.wasm'];

  let copiedCount = 0;
  for (const file of filesToCopy) {
    const srcFile = join(SRC_DIR, file);
    const destFile = join(DEST_DIR, file);
    if (existsSync(srcFile)) {
      cpSync(srcFile, destFile);
      console.log(`  Copied ${file}`);
      copiedCount++;
    } else {
      console.warn(`  Warning: ${file} not found at ${srcFile}`);
    }
  }

  if (copiedCount === 0) {
    console.warn('Warning: No VisDif codec files were copied.');
  } else {
    console.log(`\nCopied ${copiedCount} VisDif codec files successfully.`);
  }
}

main().catch((error) => {
  console.error('Error copying VisDif assets:', error);
  process.exit(1);
});
