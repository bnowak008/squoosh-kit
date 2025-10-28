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
const DEST_DIR = join(PACKAGE_ROOT, 'wasm');

async function main() {
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
    [webpEncSrc]: [
      // Standard encoder
      'webp_enc.wasm',
      'webp_enc.js',
      'webp_enc.d.ts',
      // SIMD-optimized encoder
      'webp_enc_simd.wasm',
      'webp_enc_simd.js',
      'webp_enc_simd.d.ts',
      // Node.js-specific encoder
      'webp_node_enc.wasm',
      'webp_node_enc.js',
    ],
    [webpDecSrc]: [
      // Standard decoder
      'webp_dec.wasm',
      'webp_dec.js',
      'webp_dec.d.ts',
      // SIMD-optimized decoder
      'webp_dec_simd.wasm',
      'webp_dec_simd.js',
      'webp_dec_simd.d.ts',
      // Node.js-specific decoder
      'webp_node_dec.wasm',
      'webp_node_dec.js',
    ],
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

main().catch((error) => {
  console.error('Error copying WebP assets:', error);
  process.exit(1);
});
