#!/usr/bin/env bun

/**
 * Copies QOI codec artifacts from the central .squoosh-temp directory
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
  const qoiEncSrc = join(SQUOOSH_ROOT, 'codecs', 'qoi', 'enc');
  const qoiDecSrc = join(SQUOOSH_ROOT, 'codecs', 'qoi', 'dec');

  if (!existsSync(qoiEncSrc)) {
    console.error(
      `Squoosh QOI encoder source directory not found at: ${qoiEncSrc}`
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

  console.log('Copying QOI codec artifacts...');

  const filesToCopy: Record<string, string[]> = {
    [qoiEncSrc]: ['qoi_enc.js', 'qoi_enc.wasm', 'qoi_enc.d.ts'],
    [qoiDecSrc]: ['qoi_dec.js', 'qoi_dec.wasm', 'qoi_dec.d.ts'],
  };

  let copiedCount = 0;
  for (const [srcDir, files] of Object.entries(filesToCopy)) {
    if (!existsSync(srcDir)) {
      console.warn(`Source directory not found: ${srcDir}`);
      continue;
    }

    const destSubDir =
      srcDir === qoiEncSrc
        ? join(DEST_DIR, 'qoi-enc')
        : join(DEST_DIR, 'qoi-dec');
    mkdirSync(destSubDir, { recursive: true });

    for (const file of files) {
      const srcFile = join(srcDir, file);
      const destFile = join(destSubDir, file);
      if (existsSync(srcFile)) {
        cpSync(srcFile, destFile);
        console.log(`  ✓ Copied ${file}`);
        copiedCount++;
      } else {
        console.warn(`  ⚠ File not found: ${file}`);
      }
    }
  }

  if (copiedCount === 0) {
    console.warn('Warning: No QOI codec files were copied.');
  } else {
    console.log(`\nCopied ${copiedCount} QOI codec files successfully.`);
  }
}

main().catch((error) => {
  console.error('Error copying QOI assets:', error);
  process.exit(1);
});
