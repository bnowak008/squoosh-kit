/**
 * Test setup and utilities
 */

import { beforeAll, afterAll } from 'bun:test';
import { existsSync } from 'fs';
import { join } from 'path';

// Global test setup
beforeAll(async () => {
  console.log('Setting up test environment...');

  // Ensure WASM files are available for testing
  const wasmDir = join(import.meta.dir, '../dist', 'wasm');
  if (!existsSync(wasmDir)) {
    console.log('WASM files not found, running build...');
    const { execSync } = await import('child_process');
    execSync('bun run scripts/copy-codecs.ts', {
      cwd: join(import.meta.dir, '../dist'),
      stdio: 'inherit',
    });
  }
});

afterAll(() => {
  console.log('Cleaning up test environment...');
});
