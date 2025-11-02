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

  const filesToCopy = {
    [mozjpegEncSrc]: [
      // Standard encoder
      'mozjpeg_enc.wasm',
      'mozjpeg_enc.js',
      'mozjpeg_enc.d.ts',
      // Node.js-specific encoder
      'mozjpeg_node_enc.wasm',
      'mozjpeg_node_enc.js',
    ],
    [mozjpegDecSrc]: [
      // Node.js-specific decoder
      'mozjpeg_node_dec.wasm',
      'mozjpeg_node_dec.js',
    ],
  };

  let copiedCount = 0;
  for (const [srcDir, files] of Object.entries(filesToCopy)) {
    if (!existsSync(srcDir)) continue;
    const dest =
      srcDir === mozjpegEncSrc
        ? join(DEST_DIR, 'mozjpeg')
        : join(DEST_DIR, 'mozjpeg-dec');
    mkdirSync(dest, { recursive: true });

    for (const file of files) {
      const srcFile = join(srcDir, file);
      const destFile = join(dest, file);
      if (existsSync(srcFile)) {
        cpSync(srcFile, destFile);
        console.log(`  ✓ Copied ${file}`);
        copiedCount++;
      }
    }
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
