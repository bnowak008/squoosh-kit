/**
 * Test setup for WebP package
 */

import { beforeAll } from 'bun:test';
import { execSync } from 'child_process';
import { join } from 'path';

beforeAll(async () => {
  console.log('Setting up WebP test environment...');

  // Ensure assets are available for testing
  try {
    execSync('bun run scripts/copy-assets.ts', {
      cwd: join(import.meta.dir, '..'),
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to copy WebP assets for testing.', error);
    process.exit(1);
  }
});
