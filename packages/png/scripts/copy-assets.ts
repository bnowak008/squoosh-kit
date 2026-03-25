#!/usr/bin/env bun

/**
 * Copies PNG codec artifacts from the central .squoosh-temp directory
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
  const pngPkgSrc = join(SQUOOSH_ROOT, 'codecs', 'png', 'pkg');

  if (!existsSync(pngPkgSrc)) {
    console.error(`PNG source directory not found at: ${pngPkgSrc}`);
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

  console.log('Copying PNG codec artifacts...');

  // Copy pkg/ -> wasm/png/
  const pngDestDir = join(DEST_DIR, 'png');
  console.log('\nCopying pkg/ -> wasm/png/');
  const totalCopied = await copyDir(pngPkgSrc, pngDestDir);

  if (totalCopied === 0) {
    console.warn('Warning: No PNG codec files were copied.');
  } else {
    console.log(`\nCopied ${totalCopied} PNG codec files successfully.`);
  }
}

main().catch((error) => {
  console.error('Error copying PNG assets:', error);
  process.exit(1);
});
