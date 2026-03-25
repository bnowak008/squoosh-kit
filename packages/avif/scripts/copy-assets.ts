#!/usr/bin/env bun

/**
 * Copies AVIF codec artifacts from the central .squoosh-temp directory
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
  const avifEncSrc = join(SQUOOSH_ROOT, 'codecs', 'avif', 'enc');
  const avifDecSrc = join(SQUOOSH_ROOT, 'codecs', 'avif', 'dec');

  if (!existsSync(avifEncSrc)) {
    console.error(
      `Squoosh AVIF encoder source directory not found at: ${avifEncSrc}`
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

  console.log('Copying AVIF codec artifacts...');

  const encDest = join(DEST_DIR, 'avif-enc');
  const decDest = join(DEST_DIR, 'avif-dec');
  mkdirSync(encDest, { recursive: true });
  mkdirSync(decDest, { recursive: true });

  const encFiles = [
    'avif_enc.js',
    'avif_enc.wasm',
    'avif_enc.d.ts',
    'avif_enc_mt.js',
    'avif_enc_mt.wasm',
    'avif_enc_mt.d.ts',
    'avif_enc_mt.worker.js',
    'avif_node_enc.js',
    'avif_node_enc.wasm',
    'avif_node_enc_mt.js',
    'avif_node_enc_mt.wasm',
    'avif_node_enc_mt.worker.js',
  ];

  const decFiles = [
    'avif_dec.js',
    'avif_dec.wasm',
    'avif_dec.d.ts',
    'avif_node_dec.js',
    'avif_node_dec.wasm',
  ];

  let copiedCount = 0;

  for (const file of encFiles) {
    const srcFile = join(avifEncSrc, file);
    const destFile = join(encDest, file);
    if (existsSync(srcFile)) {
      cpSync(srcFile, destFile);
      console.log(`  Copied ${file}`);
      copiedCount++;
    }
  }

  for (const file of decFiles) {
    const srcFile = join(avifDecSrc, file);
    const destFile = join(decDest, file);
    if (existsSync(srcFile)) {
      cpSync(srcFile, destFile);
      console.log(`  Copied ${file}`);
      copiedCount++;
    }
  }

  if (copiedCount === 0) {
    console.warn('Warning: No AVIF codec files were copied.');
  } else {
    console.log(`\nCopied ${copiedCount} AVIF codec files successfully.`);
  }
}

main().catch((error) => {
  console.error('Error copying AVIF assets:', error);
  process.exit(1);
});
