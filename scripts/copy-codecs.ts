#!/usr/bin/env bun

/**
 * Copy prebuilt codec artifacts from the Squoosh fork (branch: dev)
 * into ./wasm directory.
 * 
 * Usage:
 *   bun run scripts/copy-codecs.ts
 * 
 * Environment:
 *   SQUOOSH_DIR - optional path to local squoosh fork (must be on 'dev' branch)
 */

import { join, relative } from 'path';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';
import { execSync } from 'child_process';

const SQUOOSH_REPO = 'https://github.com/bnowak008/squoosh';
const SQUOOSH_BRANCH = 'dev';
const TEMP_DIR = join(import.meta.dir, '..', '.squoosh-temp');
const WASM_DIR = join(import.meta.dir, '..', 'wasm');

// Codec files to copy (patterns)
const CODEC_PATTERNS = [
  '*.wasm',
  'encoder.js',
  'encoder.mjs',
  'encoder.ts',
  'decoder.js',
  'decoder.mjs',
  'decoder.ts',
  'resize.js',
  'resize.mjs',
  'resize.ts',
];

async function main() {
  const squooshDir = process.env.SQUOOSH_DIR;

  let sourceDir: string;

  if (squooshDir && existsSync(squooshDir)) {
    console.log(`Using local Squoosh directory: ${squooshDir}`);
    sourceDir = squooshDir;

    // Update to dev branch
    try {
      console.log('Checking out dev branch...');
      execSync('git checkout dev', { cwd: sourceDir, stdio: 'inherit' });
      console.log('Pulling latest changes...');
      execSync('git pull', { cwd: sourceDir, stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to update local Squoosh directory:', error);
      process.exit(1);
    }
  } else {
    console.log(`Cloning Squoosh fork from ${SQUOOSH_REPO} (branch: ${SQUOOSH_BRANCH})...`);

    // Clean up temp directory if it exists
    if (existsSync(TEMP_DIR)) {
      rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    // Clone the repository
    try {
      execSync(
        `git clone --branch ${SQUOOSH_BRANCH} --depth 1 ${SQUOOSH_REPO} ${TEMP_DIR}`,
        { stdio: 'inherit' }
      );
    } catch (error) {
      console.error('Failed to clone Squoosh repository:', error);
      process.exit(1);
    }

    sourceDir = TEMP_DIR;
  }

  const codecsSourceDir = join(sourceDir, 'codecs');

  if (!existsSync(codecsSourceDir)) {
    console.error(`Codecs directory not found at: ${codecsSourceDir}`);
    process.exit(1);
  }

  // Clean and recreate wasm directory
  if (existsSync(WASM_DIR)) {
    rmSync(WASM_DIR, { recursive: true, force: true });
  }
  mkdirSync(WASM_DIR, { recursive: true });

  console.log('Copying codec artifacts...');

  // Read codecs directory
  const codecs = Bun.file(codecsSourceDir).exists()
    ? await Array.fromAsync(
        new Bun.Glob('*').scan({ cwd: codecsSourceDir, onlyFiles: false })
      )
    : [];

  let copiedCount = 0;

  for (const codec of codecs) {
    const codecSourcePath = join(codecsSourceDir, codec);
    const codecDestPath = join(WASM_DIR, codec);

    // Check if it's a directory
    const stat = await Bun.file(codecSourcePath).stat();
    if (!stat.isDirectory()) continue;

    // Create destination directory
    mkdirSync(codecDestPath, { recursive: true });

    // Copy matching files
    for (const pattern of CODEC_PATTERNS) {
      const glob = new Bun.Glob(pattern);
      const matches = await Array.fromAsync(glob.scan({ cwd: codecSourcePath }));

      for (const file of matches) {
        const srcFile = join(codecSourcePath, file);
        const destFile = join(codecDestPath, file);

        try {
          cpSync(srcFile, destFile);
          const relPath = relative(join(import.meta.dir, '..'), destFile);
          console.log(`  ✓ ${relPath}`);
          copiedCount++;
        } catch (error) {
          console.warn(`  ✗ Failed to copy ${file}:`, error);
        }
      }
    }
  }

  console.log(`\nCopied ${copiedCount} codec files successfully.`);

  // Clean up temp directory if we created it
  if (!squooshDir && existsSync(TEMP_DIR)) {
    console.log('Cleaning up temporary directory...');
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log('Done!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
