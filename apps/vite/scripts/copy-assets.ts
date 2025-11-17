#!/usr/bin/env bun

import { existsSync, mkdirSync, cpSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(SCRIPT_DIR, '..', 'public', 'squoosh-kit');
const WEBP_DIST = join(
  SCRIPT_DIR,
  '..',
  '..',
  '..',
  'packages',
  'webp',
  'dist'
);
const RESIZE_DIST = join(
  SCRIPT_DIR,
  '..',
  '..',
  '..',
  'packages',
  'resize',
  'dist'
);

function copyBrowserFiles(srcDir: string, destDir: string) {
  if (!existsSync(srcDir)) {
    console.warn(`Source directory does not exist: ${srcDir}`);
    return;
  }

  mkdirSync(destDir, { recursive: true });

  const files = readdirSync(srcDir);
  const browserFiles = files.filter(
    (file) =>
      file.endsWith('.browser.mjs') ||
      file.endsWith('.browser.mjs.map') ||
      file.endsWith('.d.ts') ||
      file.endsWith('.d.ts.map')
  );

  for (const file of browserFiles) {
    const srcPath = join(srcDir, file);
    const destPath = join(destDir, file);
    cpSync(srcPath, destPath);
  }

  const wasmDir = join(srcDir, 'wasm');
  if (existsSync(wasmDir)) {
    const destWasmDir = join(destDir, 'wasm');
    cpSync(wasmDir, destWasmDir, { recursive: true });
  }
}

console.log('Copying browser assets...');

if (existsSync(PUBLIC_DIR)) {
  rmSync(PUBLIC_DIR, { recursive: true, force: true });
}

copyBrowserFiles(WEBP_DIST, join(PUBLIC_DIR, 'webp'));
copyBrowserFiles(RESIZE_DIST, join(PUBLIC_DIR, 'resize'));

console.log('Assets copied successfully!');
