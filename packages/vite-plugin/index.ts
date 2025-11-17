import { existsSync, mkdirSync, cpSync, readdirSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import type { Plugin } from 'vite';

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
      file.endsWith('.d.ts.map'),
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

export default function copySquooshAssets(): Plugin {
  return {
    name: 'copy-squoosh-assets',
    buildStart() {
      console.log('Copying Squoosh browser assets...');

      const VITE_ROOT = process.cwd();
      const PROJECT_ROOT = resolve(VITE_ROOT, '..', '..');
      const PUBLIC_DIR = join(VITE_ROOT, 'public', 'squoosh-kit');
      const WEBP_DIST = join(PROJECT_ROOT, 'packages', 'webp', 'dist');
      const RESIZE_DIST = join(PROJECT_ROOT, 'packages', 'resize', 'dist');

      if (existsSync(PUBLIC_DIR)) {
        rmSync(PUBLIC_DIR, { recursive: true, force: true });
      }

      copyBrowserFiles(WEBP_DIST, join(PUBLIC_DIR, 'webp'));
      copyBrowserFiles(RESIZE_DIST, join(PUBLIC_DIR, 'resize'));

      console.log('Squoosh assets copied successfully!');
    },
  };
}
