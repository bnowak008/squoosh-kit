#!/usr/bin/env bun

/**
 * Copies OxiPNG codec artifacts from the central .squoosh-temp directory
 * into this package's wasm directory.
 *
 * This script assumes `bun run sync-codecs` has already been run at the root.
 */

import { join } from 'path';
import { existsSync, mkdirSync, cpSync, rmSync, readdirSync } from 'fs';

const PACKAGE_ROOT = join(import.meta.dir, '..');
const SQUOOSH_ROOT = join(PACKAGE_ROOT, '..', '..', '.squoosh-temp');
const DEST_DIR = join(PACKAGE_ROOT, 'wasm');

async function copyDir(srcDir: string, destDir: string): Promise<number> {
  if (!existsSync(srcDir)) {
    console.warn(`Source directory not found: ${srcDir}`);
    return 0;
  }

  mkdirSync(destDir, { recursive: true });

  const entries = readdirSync(srcDir, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);

    if (entry.isDirectory()) {
      count += await copyDir(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath);
      console.log(`  Copied ${entry.name}`);
      count++;
    }
  }

  return count;
}

async function main() {
  const oxipngPkgSrc = join(SQUOOSH_ROOT, 'codecs', 'oxipng', 'pkg');
  const oxipngPkgParallelSrc = join(
    SQUOOSH_ROOT,
    'codecs',
    'oxipng',
    'pkg-parallel'
  );

  if (!existsSync(oxipngPkgSrc)) {
    console.error(`OxiPNG source directory not found at: ${oxipngPkgSrc}`);
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

  console.log('Copying OxiPNG codec artifacts...');

  let totalCopied = 0;

  // Copy pkg/ -> wasm/oxipng/
  const oxipngDestDir = join(DEST_DIR, 'oxipng');
  console.log('\nCopying pkg/ -> wasm/oxipng/');
  totalCopied += await copyDir(oxipngPkgSrc, oxipngDestDir);

  // Copy pkg-parallel/ -> wasm/oxipng-parallel/ (if it exists)
  if (existsSync(oxipngPkgParallelSrc)) {
    const oxipngParallelDestDir = join(DEST_DIR, 'oxipng-parallel');
    console.log('\nCopying pkg-parallel/ -> wasm/oxipng-parallel/');
    totalCopied += await copyDir(oxipngPkgParallelSrc, oxipngParallelDestDir);
  } else {
    console.warn(
      `Warning: pkg-parallel directory not found at: ${oxipngPkgParallelSrc}`
    );
  }

  if (totalCopied === 0) {
    console.warn('Warning: No OxiPNG codec files were copied.');
  } else {
    console.log(`\nCopied ${totalCopied} OxiPNG codec files successfully.`);
  }
}

main().catch((error) => {
  console.error('Error copying OxiPNG assets:', error);
  process.exit(1);
});
