#!/usr/bin/env bun

/**
 * Sync prebuilt codec artifacts from the Squoosh repository (dev branch)
 * into a central .squoosh-temp directory at the project root.
 *
 * This script is the only part of the build system that performs network
 * operations to fetch third-party code.
 *
 * Usage:
 *   bun run scripts/sync-squoosh-codecs.ts
 *
 * Environment:
 *   SQUOOSH_DIR - optional path to a local squoosh fork (must be on 'dev' branch)
 */

import { join } from 'path';
import { existsSync, rmSync } from 'fs';
import { execSync } from 'child_process';

const SQUOOSH_REPO = 'https://github.com/GoogleChromeLabs/squoosh';
const SQUOOSH_BRANCH = 'dev';
const ROOT_DIR = join(import.meta.dir, '..');
const TEMP_DIR = join(ROOT_DIR, '.squoosh-temp');

async function main() {
  const squooshDir = process.env.SQUOOSH_DIR;

  if (squooshDir && existsSync(squooshDir)) {
    console.log(`Using local Squoosh directory: ${squooshDir}`);
    console.log('Symlinking local Squoosh directory to .squoosh-temp...');
    if (existsSync(TEMP_DIR)) {
      rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    execSync(`ln -s ${squooshDir} ${TEMP_DIR}`, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    console.log('Done.');
    return;
  }

  if (existsSync(TEMP_DIR)) {
    console.log(
      'Squoosh temp directory already exists. Pulling latest changes...'
    );
    try {
      execSync('git pull', { cwd: TEMP_DIR, stdio: 'inherit' });
    } catch (error) {
      console.error(
        'Failed to pull latest changes. Please check the directory or remove it and run this script again.',
        error
      );
      process.exit(1);
    }
  } else {
    console.log(
      `Cloning Squoosh from ${SQUOOSH_REPO} (branch: ${SQUOOSH_BRANCH})...`
    );
    try {
      execSync(
        `git clone --branch ${SQUOOSH_BRANCH} --depth 1 ${SQUOOSH_REPO} ${TEMP_DIR}`,
        { stdio: 'inherit' }
      );
    } catch (error) {
      console.error('Failed to clone Squoosh repository:', error);
      process.exit(1);
    }
  }

  console.log(`\n✅ Squoosh codecs synced successfully to ${TEMP_DIR}`);
  console.log('Done!');
}

main().catch((error) => {
  console.error('Error syncing Squoosh codecs:', error);
  process.exit(1);
});
