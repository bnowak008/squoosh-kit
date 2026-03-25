#!/usr/bin/env bun

/**
 * Copies MozJPEG codec artifacts from the central .squoosh-temp directory
 * into this package's wasm directory.
 *
 * This script assumes `bun run sync-codecs` has already been run at the root.
 */

import { join } from 'path';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';

const PACKAGE_ROOT = join(import.meta.dir, '..');
const SQUOOSH_ROOT = join(PACKAGE_ROOT, '..', '..', '.squoosh-temp');
const DEST_DIR = join(PACKAGE_ROOT, 'wasm');

async function main() {
  const mozjpegEncSrc = join(SQUOOSH_ROOT, 'codecs', 'mozjpeg', 'enc');
  const mozjpegDecSrc = join(SQUOOSH_ROOT, 'codecs', 'mozjpeg', 'dec');

  if (!existsSync(mozjpegEncSrc)) {
    console.error(
      `Squoosh MozJPEG encoder source directory not found at: ${mozjpegEncSrc}`
    );
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

  console.log('Copying MozJPEG codec artifacts...');

  const encDest = join(DEST_DIR, 'mozjpeg-enc');
  const decDest = join(DEST_DIR, 'mozjpeg-dec');

  mkdirSync(encDest, { recursive: true });
  mkdirSync(decDest, { recursive: true });

  const encFiles = [
    'mozjpeg_enc.js',
    'mozjpeg_enc.wasm',
    'mozjpeg_enc.d.ts',
    'mozjpeg_node_enc.js',
    'mozjpeg_node_enc.wasm',
  ];

  const decFiles = ['mozjpeg_node_dec.js', 'mozjpeg_node_dec.wasm'];

  let copiedCount = 0;

  for (const file of encFiles) {
    const srcFile = join(mozjpegEncSrc, file);
    const destFile = join(encDest, file);
    if (existsSync(srcFile)) {
      cpSync(srcFile, destFile);
      console.log(`  Copied ${file}`);
      copiedCount++;
    } else {
      console.warn(`  Warning: ${file} not found at ${srcFile}`);
    }
  }

  if (existsSync(mozjpegDecSrc)) {
    for (const file of decFiles) {
      const srcFile = join(mozjpegDecSrc, file);
      const destFile = join(decDest, file);
      if (existsSync(srcFile)) {
        cpSync(srcFile, destFile);
        console.log(`  Copied ${file}`);
        copiedCount++;
      } else {
        console.warn(`  Warning: ${file} not found at ${srcFile}`);
      }
    }
  } else {
    console.warn(
      `Warning: MozJPEG decoder source not found at: ${mozjpegDecSrc}`
    );
  }

  if (copiedCount === 0) {
    console.warn('Warning: No MozJPEG codec files were copied.');
  } else {
    console.log(`\nCopied ${copiedCount} MozJPEG codec files successfully.`);
  }
}

main().catch((error) => {
  console.error('Error copying MozJPEG assets:', error);
  process.exit(1);
});
