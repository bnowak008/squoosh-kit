#!/usr/bin/env bun

/**
 * Production build script for @squoosh-kit/core
 *
 * This script handles:
 * - Codec copying
 * - TypeScript compilation
 * - Bundle optimization
 * - Asset optimization
 * - Build validation
 */

import { join, relative } from 'path';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

const PACKAGE_ROOT = join(import.meta.dir, '..');
const DIST_DIR = join(PACKAGE_ROOT, 'dist');

interface BuildStep {
  name: string;
  command: string;
  description: string;
}

const buildSteps: BuildStep[] = [
  {
    name: 'clean',
    command: 'rm -rf dist && mkdir -p dist',
    description: 'Clean build directory',
  },
  {
    name: 'copy-codecs',
    command: 'bun run scripts/copy-codecs.ts',
    description: 'Copy WebAssembly codecs',
  },
  {
    name: 'type-check',
    command: 'bun run check-types',
    description: 'TypeScript type checking',
  },
  {
    name: 'build-declarations',
    command: 'bun run build:declarations',
    description: 'Generate TypeScript declarations',
  },
  {
    name: 'build-code',
    command: 'bun run build:code',
    description: 'Build JavaScript bundles',
  },
  {
    name: 'validate-build',
    command: 'bun run validate-build',
    description: 'Validate build artifacts',
  },
];

async function runStep(step: BuildStep): Promise<void> {
  console.log(`\n🔨 ${step.description}...`);

  try {
    if (step.name === 'clean') {
      if (existsSync(DIST_DIR)) {
        rmSync(DIST_DIR, { recursive: true, force: true });
      }
      mkdirSync(DIST_DIR, { recursive: true });
    } else {
      execSync(step.command, {
        cwd: PACKAGE_ROOT,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' },
      });
    }

    console.log(`✅ ${step.description} completed`);
  } catch (error) {
    console.error(`❌ ${step.description} failed:`, error);
    process.exit(1);
  }
}

async function validateBuild(): Promise<void> {
  console.log('\n🔍 Validating build artifacts...');

  const requiredFiles = [
    'dist/index.js',
    'dist/index.d.ts',
    'dist/features/webp/index.js',
    'dist/features/webp/index.d.ts',
    'dist/features/resize/index.js',
    'dist/features/resize/index.d.ts',
    'dist/wasm/webp/webp_enc.wasm',
    'dist/wasm/resize/squoosh_resize_bg.wasm',
  ];

  const missingFiles = requiredFiles.filter(
    (file) => !existsSync(join(PACKAGE_ROOT, file))
  );

  if (missingFiles.length > 0) {
    console.error('❌ Missing required build artifacts:');
    missingFiles.forEach((file) => console.error(`  - ${file}`));
    process.exit(1);
  }

  console.log('✅ All required build artifacts present');
}

async function main(): Promise<void> {
  console.log('🚀 Starting production build for @squoosh-kit/core');
  console.log(`📦 Package root: ${relative(process.cwd(), PACKAGE_ROOT)}`);

  const startTime = Date.now();

  try {
    // Run all build steps
    for (const step of buildSteps) {
      await runStep(step);
    }

    // Validate build
    await validateBuild();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Production build completed successfully in ${duration}s`);
    console.log(`📦 Build artifacts: ${relative(process.cwd(), DIST_DIR)}`);
  } catch (error) {
    console.error('\n💥 Production build failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Build script error:', error);
  process.exit(1);
});
