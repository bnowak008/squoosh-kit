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
    console.log(
      `Cloning Squoosh fork from ${SQUOOSH_REPO} (branch: ${SQUOOSH_BRANCH})...`
    );

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

  let copiedCount = 0;

  // Helper function to copy files from a source directory to destination
  async function copyCodecFiles(
    srcDir: string,
    destDir: string,
    patterns: string[]
  ): Promise<number> {
    let count = 0;
    mkdirSync(destDir, { recursive: true });

    for (const pattern of patterns) {
      const glob = new Bun.Glob(pattern);
      const matches = await Array.fromAsync(glob.scan({ cwd: srcDir }));

      for (const file of matches) {
        const srcFile = join(srcDir, file);
        const destFile = join(destDir, file);

        try {
          cpSync(srcFile, destFile);
          const relPath = relative(join(import.meta.dir, '..'), destFile);
          console.log(`  ✓ ${relPath}`);
          count++;
        } catch (error) {
          console.warn(`  ✗ Failed to copy ${file}:`, error);
        }
      }
    }
    return count;
  }

  // WebP encoder: codecs/webp/enc/* → wasm/webp/*
  const webpEncSrc = join(codecsSourceDir, 'webp', 'enc');
  if (existsSync(webpEncSrc)) {
    console.log('Copying WebP encoder...');
    copiedCount += await copyCodecFiles(webpEncSrc, join(WASM_DIR, 'webp'), [
      'webp_enc.wasm',
      'webp_enc.js',
      'webp_enc.d.ts',
    ]);
  }

  // WebP decoder: codecs/webp/dec/* → wasm/webp-dec/*
  const webpDecSrc = join(codecsSourceDir, 'webp', 'dec');
  if (existsSync(webpDecSrc)) {
    console.log('Copying WebP decoder...');
    copiedCount += await copyCodecFiles(
      webpDecSrc,
      join(WASM_DIR, 'webp-dec'),
      ['webp_dec.wasm', 'webp_dec.js', 'webp_dec.d.ts']
    );
  }

  // Resize: codecs/resize/pkg/* → wasm/resize/*
  const resizeSrc = join(codecsSourceDir, 'resize', 'pkg');
  if (existsSync(resizeSrc)) {
    console.log('Copying resize codec...');
    copiedCount += await copyCodecFiles(resizeSrc, join(WASM_DIR, 'resize'), [
      'squoosh_resize_bg.wasm',
      'squoosh_resize.js',
      'squoosh_resize.d.ts',
      'squoosh_resize_bg.wasm.d.ts',
    ]);
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
