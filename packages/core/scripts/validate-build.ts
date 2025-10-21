#!/usr/bin/env bun

/**
 * Build validation script
 *
 * Validates that all required build artifacts are present and correctly formatted
 */

import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

const PACKAGE_ROOT = join(import.meta.dir, '..');
const DIST_DIR = join(PACKAGE_ROOT, 'dist');

interface ValidationRule {
  name: string;
  check: () => boolean;
  error: string;
}

const validationRules: ValidationRule[] = [
  {
    name: 'dist-directory-exists',
    check: () => existsSync(DIST_DIR),
    error: 'Dist directory does not exist',
  },
  {
    name: 'main-entry-point',
    check: () =>
      existsSync(join(DIST_DIR, 'index.js')) &&
      existsSync(join(DIST_DIR, 'index.d.ts')),
    error: 'Main entry point files missing',
  },
  {
    name: 'webp-module',
    check: () =>
      existsSync(join(DIST_DIR, 'features', 'webp', 'index.js')) &&
      existsSync(join(DIST_DIR, 'features', 'webp', 'index.d.ts')),
    error: 'WebP module files missing',
  },
  {
    name: 'resize-module',
    check: () =>
      existsSync(join(DIST_DIR, 'features', 'resize', 'index.js')) &&
      existsSync(join(DIST_DIR, 'features', 'resize', 'index.d.ts')),
    error: 'Resize module files missing',
  },
  {
    name: 'webp-wasm',
    check: () => existsSync(join(DIST_DIR, 'wasm', 'webp', 'webp_enc.wasm')),
    error: 'WebP WASM file missing',
  },
  {
    name: 'resize-wasm',
    check: () =>
      existsSync(join(DIST_DIR, 'wasm', 'resize', 'squoosh_resize_bg.wasm')),
    error: 'Resize WASM file missing',
  },
  {
    name: 'package-json-exports',
    check: () => {
      try {
        const packageJson = JSON.parse(
          readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')
        );
        return (
          packageJson.exports &&
          packageJson.exports['.'] &&
          packageJson.exports['./webp'] &&
          packageJson.exports['./resize']
        );
      } catch {
        return false;
      }
    },
    error: 'Package.json exports configuration missing or invalid',
  },
];

async function main(): Promise<void> {
  console.log('🔍 Validating build artifacts...');

  let passed = 0;
  let failed = 0;

  for (const rule of validationRules) {
    try {
      if (rule.check()) {
        console.log(`✅ ${rule.name}`);
        passed++;
      } else {
        console.error(`❌ ${rule.name}: ${rule.error}`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${rule.name}: ${error}`);
      failed++;
    }
  }

  console.log(`\n📊 Validation results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error('\n💥 Build validation failed');
    process.exit(1);
  }

  console.log('\n🎉 Build validation passed');
}

main().catch((error) => {
  console.error('Validation error:', error);
  process.exit(1);
});
