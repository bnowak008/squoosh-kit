import { existsSync, mkdirSync, cpSync, readdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Plugin, ViteDevServer } from 'vite';
import { searchForWorkspaceRoot } from 'vite';

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

export default function squooshVitePlugin(): Plugin {
  return {
    name: 'squoosh-vite-plugin',
    buildStart() {
      console.log('Copying Squoosh browser assets...');

      const viteRoot = process.cwd();
      const projectRoot = searchForWorkspaceRoot(viteRoot);
      const publicDir = join(viteRoot, 'public', 'squoosh-kit');
      const webpDist = join(projectRoot, 'packages', 'webp', 'dist');
      const resizeDist = join(projectRoot, 'packages', 'resize', 'dist');

      if (existsSync(publicDir)) {
        rmSync(publicDir, { recursive: true, force: true });
      }

      copyBrowserFiles(webpDist, join(publicDir, 'webp'));
      copyBrowserFiles(resizeDist, join(publicDir, 'resize'));

      console.log('Squoosh assets copied successfully!');
    },
    config: () => ({
      server: {
        fs: {
          allow: [searchForWorkspaceRoot(process.cwd())],
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
      build: {
        rollupOptions: {
          output: {
            assetFileNames: (assetInfo: { name?: string }) => {
              if (assetInfo.name?.endsWith('.wasm')) {
                return 'assets/[name].[ext]';
              }
              return 'assets/[name]-[hash].[ext]';
            },
          },
        },
      },
    }),
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const url = req.url;
          if (!url?.includes('.wasm')) {
            next();
            return;
          }

          try {
            const workspaceRoot = searchForWorkspaceRoot(process.cwd());
            const cleanUrl = url.split('?')[0];
            const urlPath = cleanUrl?.startsWith('/')
              ? cleanUrl.slice(1)
              : cleanUrl;

            const pathsToTry = [
              join(workspaceRoot, urlPath ?? ''),
              urlPath?.includes('@squoosh-kit/wasm/')
                ? join(
                    workspaceRoot,
                    urlPath.replace(
                      /node_modules\/@squoosh-kit\/wasm\//,
                      'node_modules/@squoosh-kit/webp/dist/wasm/',
                    ),
                  )
                : null,
            ].filter((p): p is string => p !== null);

            for (const filePath of pathsToTry) {
              try {
                const wasmData = readFileSync(filePath);
                res.setHeader('Content-Type', 'application/wasm');
                res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
                res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                res.setHeader('Content-Length', wasmData.length.toString());
                res.end(wasmData);
                return;
              } catch {
                // Try next path
              }
            }

            next();
          } catch {
            next();
          }
        },
      );
    },
  };
}
