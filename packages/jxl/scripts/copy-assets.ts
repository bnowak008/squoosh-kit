#!/usr/bin/env bun

/**
 * Copies JXL codec artifacts from the central .squoosh-temp directory
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
  const jxlEncSrc = join(SQUOOSH_ROOT, 'codecs', 'jxl', 'enc');
  const jxlDecSrc = join(SQUOOSH_ROOT, 'codecs', 'jxl', 'dec');

  if (!existsSync(jxlEncSrc)) {
    console.error(
      `Squoosh JXL encoder source directory not found at: ${jxlEncSrc}`
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

  console.log('Copying JXL codec artifacts...');

  const filesToCopy: Record<string, string[]> = {
    [jxlEncSrc]: [
      'jxl_enc.js',
      'jxl_enc.wasm',
      'jxl_enc.d.ts',
      'jxl_enc_mt.js',
      'jxl_enc_mt.wasm',
      'jxl_enc_mt.d.ts',
      'jxl_enc_mt.worker.js',
      'jxl_enc_mt_simd.js',
      'jxl_enc_mt_simd.wasm',
      'jxl_enc_mt_simd.d.ts',
      'jxl_enc_mt_simd.worker.js',
      'jxl_node_enc.js',
      'jxl_node_enc.wasm',
    ],
    [jxlDecSrc]: [
      'jxl_dec.js',
      'jxl_dec.wasm',
      'jxl_dec.d.ts',
      'jxl_node_dec.js',
      'jxl_node_dec.wasm',
    ],
  };

  let copiedCount = 0;
  for (const [srcDir, files] of Object.entries(filesToCopy)) {
    if (!existsSync(srcDir)) continue;
    const dest =
      srcDir === jxlEncSrc
        ? join(DEST_DIR, 'jxl-enc')
        : join(DEST_DIR, 'jxl-dec');
    mkdirSync(dest, { recursive: true });

    for (const file of files) {
      const srcFile = join(srcDir, file);
      const destFile = join(dest, file);
      if (existsSync(srcFile)) {
        cpSync(srcFile, destFile);
        console.log(`  Copied ${file}`);
        copiedCount++;
      }
    }
  }

  if (copiedCount === 0) {
    console.warn('Warning: No JXL codec files were copied.');
  } else {
    console.log(`\nCopied ${copiedCount} JXL codec files successfully.`);
  }
}

main().catch((error) => {
  console.error('Error copying JXL assets:', error);
  process.exit(1);
});
