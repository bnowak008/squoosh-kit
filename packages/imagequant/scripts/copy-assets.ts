#!/usr/bin/env bun

/**
 * Copies imagequant codec artifacts from the central .squoosh-temp directory
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
  const imagequantSrc = join(SQUOOSH_ROOT, 'codecs', 'imagequant');

  if (!existsSync(imagequantSrc)) {
    console.error(
      `Squoosh imagequant source directory not found at: ${imagequantSrc}`
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

  console.log('Copying imagequant codec artifacts...');

  const destDir = join(DEST_DIR, 'imagequant');
  mkdirSync(destDir, { recursive: true });

  const filesToCopy = [
    'imagequant.js',
    'imagequant.wasm',
    'imagequant.d.ts',
    'imagequant_node.js',
    'imagequant_node.wasm',
  ];

  let copiedCount = 0;
  for (const file of filesToCopy) {
    const srcFile = join(imagequantSrc, file);
    const destFile = join(destDir, file);
    if (existsSync(srcFile)) {
      cpSync(srcFile, destFile);
      console.log(`  ✓ Copied ${file}`);
      copiedCount++;
    } else {
      console.warn(`  ⚠ File not found: ${file}`);
    }
  }

  if (copiedCount === 0) {
    console.warn('Warning: No imagequant codec files were copied.');
  } else {
    console.log(`\nCopied ${copiedCount} imagequant codec files successfully.`);
  }
}

main().catch((error) => {
  console.error('Error copying imagequant assets:', error);
  process.exit(1);
});
