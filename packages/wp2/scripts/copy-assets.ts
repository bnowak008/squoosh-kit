#!/usr/bin/env bun

/**
 * Copies WP2 codec artifacts from the central .squoosh-temp directory
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
  const wp2EncSrc = join(SQUOOSH_ROOT, 'codecs', 'wp2', 'enc');
  const wp2DecSrc = join(SQUOOSH_ROOT, 'codecs', 'wp2', 'dec');

  if (!existsSync(wp2EncSrc)) {
    console.error(
      `Squoosh WP2 encoder source directory not found at: ${wp2EncSrc}`
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

  console.log('Copying WP2 codec artifacts...');

  const filesToCopy = {
    [wp2EncSrc]: [
      // Standard encoder
      'wp2_enc.wasm',
      'wp2_enc.js',
      'wp2_enc.d.ts',
      // Multi-threaded encoder
      'wp2_enc_mt.wasm',
      'wp2_enc_mt.js',
      'wp2_enc_mt.d.ts',
      'wp2_enc_mt.worker.js',
      // Multi-threaded SIMD encoder
      'wp2_enc_mt_simd.wasm',
      'wp2_enc_mt_simd.js',
      'wp2_enc_mt_simd.d.ts',
      'wp2_enc_mt_simd.worker.js',
      // Node.js-specific encoder
      'wp2_node_enc.wasm',
      'wp2_node_enc.js',
    ],
    [wp2DecSrc]: [
      // Standard decoder
      'wp2_dec.wasm',
      'wp2_dec.js',
      'wp2_dec.d.ts',
      // Node.js-specific decoder
      'wp2_node_dec.wasm',
      'wp2_node_dec.js',
    ],
  };

  let copiedCount = 0;
  for (const [srcDir, files] of Object.entries(filesToCopy)) {
    if (!existsSync(srcDir)) continue;
    const dest =
      srcDir === wp2EncSrc
        ? join(DEST_DIR, 'wp2-enc')
        : join(DEST_DIR, 'wp2-dec');
    mkdirSync(dest, { recursive: true });

    for (const file of files) {
      const srcFile = join(srcDir, file);
      const destFile = join(dest, file);
      if (existsSync(srcFile)) {
        cpSync(srcFile, destFile);
        console.log(`  copied ${file}`);
        copiedCount++;
      }
    }
  }

  if (copiedCount === 0) {
    console.warn('Warning: No WP2 codec files were copied.');
  } else {
    console.log(`\nCopied ${copiedCount} WP2 codec files successfully.`);
  }
}

main().catch((error) => {
  console.error('Error copying WP2 assets:', error);
  process.exit(1);
});
