import { existsSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dir, '..');

type PackageSpec = {
  name: string;
  dir: string;
  files: string[];
  dirs?: string[];
};

const PACKAGES: PackageSpec[] = [
  {
    name: '@squoosh-kit/runtime',
    dir: 'packages/runtime/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
    ],
  },
  {
    name: '@squoosh-kit/webp',
    dir: 'packages/webp/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'webp.worker.bun.js',
      'webp.worker.node.mjs',
      'webp.worker.node.cjs',
      'webp.worker.browser.mjs',
      'webp.worker.d.ts',
    ],
    dirs: ['wasm/webp', 'wasm/webp-dec'],
  },
  {
    name: '@squoosh-kit/resize',
    dir: 'packages/resize/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'resize.worker.bun.js',
      'resize.worker.node.mjs',
      'resize.worker.node.cjs',
      'resize.worker.browser.mjs',
      'resize.worker.d.ts',
    ],
    dirs: ['wasm'],
  },
  {
    name: '@squoosh-kit/core',
    dir: 'packages/core/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
    ],
  },
  {
    name: '@squoosh-kit/vite-plugin',
    dir: 'packages/vite-plugin/dist',
    files: ['index.js', 'index.cjs', 'index.d.ts'],
  },
];

let errors = 0;
let checks = 0;

function check(label: string, path: string, type: 'file' | 'dir'): void {
  checks++;
  if (!existsSync(path)) {
    console.error(`  ✗ MISSING ${type}: ${label}`);
    errors++;
    return;
  }
  const stat = statSync(path);
  const isExpectedType = type === 'dir' ? stat.isDirectory() : stat.isFile();
  if (!isExpectedType) {
    console.error(`  ✗ WRONG TYPE (expected ${type}): ${label}`);
    errors++;
    return;
  }
  if (type === 'file' && stat.size === 0) {
    console.error(`  ✗ EMPTY FILE: ${label}`);
    errors++;
    return;
  }
  console.log(`  ✓ ${label}`);
}

for (const pkg of PACKAGES) {
  console.log(`\nValidating ${pkg.name}...`);
  const base = join(ROOT, pkg.dir);

  if (!existsSync(base)) {
    console.error(`  ✗ MISSING dist directory: ${pkg.dir}`);
    errors++;
    continue;
  }

  for (const file of pkg.files) {
    check(file, join(base, file), 'file');
  }

  for (const dir of pkg.dirs ?? []) {
    check(`${dir}/`, join(base, dir), 'dir');
  }
}

console.log(`\n${checks - errors}/${checks} checks passed`);

if (errors > 0) {
  console.error(`\n✗ Artifact validation FAILED: ${errors} issue(s) found`);
  process.exit(1);
}

console.log('\n✓ All artifacts valid.');
