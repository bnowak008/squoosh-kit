import {
  existsSync,
  mkdirSync,
  cpSync,
  readdirSync,
  rmSync,
  readFileSync,
} from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import type { PluginOption, ViteDevServer } from 'vite';

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
export default function squooshVitePlugin(squooshKitRoot: string) {
  const viteRoot = process.cwd();
  const publicDir = join(viteRoot, 'public', 'squoosh-kit');
  const webpDist = join(squooshKitRoot, 'webp', 'dist');
  const resizeDist = join(squooshKitRoot, 'resize', 'dist');

  return {
    name: 'squoosh-vite-plugin',
    buildStart() {
      if (existsSync(publicDir)) {
        rmSync(publicDir, { recursive: true, force: true });
      }
      if (existsSync(webpDist)) {
        copyBrowserFiles(webpDist, join(publicDir, 'webp'));
      }
      if (existsSync(resizeDist)) {
        copyBrowserFiles(resizeDist, join(publicDir, 'resize'));
      }

      console.log('Squoosh assets copied successfully!');
    },
    config: () => ({
      server: {
        fs: {
          allow: [viteRoot, squooshKitRoot],
        },
        headers: {
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Access-Control-Allow-Origin': '*',
        },
      },
      optimizeDeps: {
        exclude: ['@squoosh-kit/webp', '@squoosh-kit/resize'],
      },
      assetsInclude: ['**/*.wasm'],
    }),
  } satisfies PluginOption;
}
