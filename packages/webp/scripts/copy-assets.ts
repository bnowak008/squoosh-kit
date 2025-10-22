#!/usr/bin/env bun

/**
 * Copies WebP codec artifacts from the central .squoosh-temp directory
 * into this package's dist/wasm directory.
 *
 * This script assumes `bun run sync-codecs` has already been run at the root.
 */

import { join } from 'path';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';

const PACKAGE_ROOT = join(import.meta.dir, '..');
const SQUOOSH_ROOT = join(PACKAGE_ROOT, '..', '..', '.squoosh-temp');
const DEST_DIR = join(PACKAGE_ROOT, 'dist', 'wasm');

export default async function copyAssets() {
  const webpEncSrc = join(SQUOOSH_ROOT, 'codecs', 'webp', 'enc');
  const webpDecSrc = join(SQUOOSH_ROOT, 'codecs', 'webp', 'dec');

  if (!existsSync(webpEncSrc)) {
    console.error(
      `Squoosh WebP encoder source directory not found at: ${webpEncSrc}`
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

  console.log('Copying WebP codec artifacts...');

  const filesToCopy = {
    [webpEncSrc]: ['webp_enc.wasm', 'webp_enc.js', 'webp_enc.d.ts'],
    [webpDecSrc]: ['webp_dec.wasm', 'webp_dec.js', 'webp_dec.d.ts'],
  };

  let copiedCount = 0;
  for (const [srcDir, files] of Object.entries(filesToCopy)) {
    if (!existsSync(srcDir)) continue;
    const dest =
      srcDir === webpEncSrc
        ? join(DEST_DIR, 'webp')
        : join(DEST_DIR, 'webp-dec');
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
    console.warn('Warning: No WebP codec files were copied.');
  } else {
    console.log(`\nCopied ${copiedCount} WebP codec files successfully.`);
  }
}
