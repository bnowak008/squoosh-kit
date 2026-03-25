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
  {
    name: '@squoosh-kit/avif',
    dir: 'packages/avif/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'avif.worker.bun.js',
      'avif.worker.node.mjs',
      'avif.worker.node.cjs',
      'avif.worker.browser.mjs',
      'avif.worker.d.ts',
    ],
    dirs: ['wasm'],
  },
  {
    name: '@squoosh-kit/jxl',
    dir: 'packages/jxl/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'jxl.worker.bun.js',
      'jxl.worker.node.mjs',
      'jxl.worker.node.cjs',
      'jxl.worker.browser.mjs',
      'jxl.worker.d.ts',
    ],
    dirs: ['wasm'],
  },
  {
    name: '@squoosh-kit/mozjpeg',
    dir: 'packages/mozjpeg/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'mozjpeg.worker.bun.js',
      'mozjpeg.worker.node.mjs',
      'mozjpeg.worker.node.cjs',
      'mozjpeg.worker.browser.mjs',
      'mozjpeg.worker.d.ts',
    ],
    dirs: ['wasm'],
  },
  {
    name: '@squoosh-kit/oxipng',
    dir: 'packages/oxipng/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'oxipng.worker.bun.js',
      'oxipng.worker.node.mjs',
      'oxipng.worker.node.cjs',
      'oxipng.worker.browser.mjs',
      'oxipng.worker.d.ts',
    ],
    dirs: ['wasm'],
  },
  {
    name: '@squoosh-kit/png',
    dir: 'packages/png/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'png.worker.bun.js',
      'png.worker.node.mjs',
      'png.worker.node.cjs',
      'png.worker.browser.mjs',
      'png.worker.d.ts',
    ],
    dirs: ['wasm'],
  },
  {
    name: '@squoosh-kit/wp2',
    dir: 'packages/wp2/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'wp2.worker.bun.js',
      'wp2.worker.node.mjs',
      'wp2.worker.node.cjs',
      'wp2.worker.browser.mjs',
      'wp2.worker.d.ts',
    ],
    dirs: ['wasm'],
  },
  {
    name: '@squoosh-kit/qoi',
    dir: 'packages/qoi/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'qoi.worker.bun.js',
      'qoi.worker.node.mjs',
      'qoi.worker.node.cjs',
      'qoi.worker.browser.mjs',
      'qoi.worker.d.ts',
    ],
    dirs: ['wasm'],
  },
  {
    name: '@squoosh-kit/imagequant',
    dir: 'packages/imagequant/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'imagequant.worker.bun.js',
      'imagequant.worker.node.mjs',
      'imagequant.worker.node.cjs',
      'imagequant.worker.browser.mjs',
      'imagequant.worker.d.ts',
    ],
    dirs: ['wasm'],
  },
  {
    name: '@squoosh-kit/hqx',
    dir: 'packages/hqx/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'hqx.worker.bun.js',
      'hqx.worker.node.mjs',
      'hqx.worker.node.cjs',
      'hqx.worker.browser.mjs',
      'hqx.worker.d.ts',
    ],
    dirs: ['wasm'],
  },
  {
    name: '@squoosh-kit/rotate',
    dir: 'packages/rotate/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'rotate.worker.bun.js',
      'rotate.worker.node.mjs',
      'rotate.worker.node.cjs',
      'rotate.worker.browser.mjs',
      'rotate.worker.d.ts',
    ],
    dirs: ['wasm'],
  },
  {
    name: '@squoosh-kit/visdif',
    dir: 'packages/visdif/dist',
    files: [
      'index.bun.js',
      'index.node.mjs',
      'index.node.cjs',
      'index.browser.mjs',
      'index.d.ts',
      'visdif.worker.bun.js',
      'visdif.worker.node.mjs',
      'visdif.worker.node.cjs',
      'visdif.worker.browser.mjs',
      'visdif.worker.d.ts',
    ],
    dirs: ['wasm'],
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
