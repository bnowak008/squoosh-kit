import { defineConfig, searchForWorkspaceRoot, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'wasm-mime-type',
      apply: 'serve',
      configureServer(server: ViteDevServer) {
        // Intercept WASM file requests and serve them with correct MIME type
        // This only runs in dev mode
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
              const urlPath = cleanUrl.startsWith('/')
                ? cleanUrl.slice(1)
                : cleanUrl;

              // Try different path variants
              const pathsToTry = [
                join(workspaceRoot, urlPath),
                // Handle @squoosh-kit/wasm paths by redirecting to @squoosh-kit/webp/dist/wasm
                urlPath.includes('@squoosh-kit/wasm/')
                  ? join(
                      workspaceRoot,
                      urlPath.replace(
                        /node_modules\/@squoosh-kit\/wasm\//,
                        'node_modules/@squoosh-kit/webp/dist/wasm/'
                      )
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
          }
        );
      },
    },
  ],
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
        // Ensure WASM files are accessible in the output
        assetFileNames: (assetInfo: { name?: string }) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'assets/[name].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
});
