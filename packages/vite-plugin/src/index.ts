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

export default function squooshVitePlugin(squooshKitRoot: string): PluginOption {
  const viteRoot = process.cwd();
  const publicDir = join(viteRoot, 'public', 'squoosh-kit');
  const webpDist = join(squooshKitRoot, 'webp', 'dist');
  const resizeDist = join(squooshKitRoot, 'resize', 'dist');
  const avifDist = join(squooshKitRoot, 'avif', 'dist');
  const mozjpegDist = join(squooshKitRoot, 'mozjpeg', 'dist');
  const jxlDist = join(squooshKitRoot, 'jxl', 'dist');
  const oxipngDist = join(squooshKitRoot, 'oxipng', 'dist');
  const imagequantDist = join(squooshKitRoot, 'imagequant', 'dist');
  const pngDist = join(squooshKitRoot, 'png', 'dist');
  const qoiDist = join(squooshKitRoot, 'qoi', 'dist');
  const wp2Dist = join(squooshKitRoot, 'wp2', 'dist');
  const hqxDist = join(squooshKitRoot, 'hqx', 'dist');
  const rotateDist = join(squooshKitRoot, 'rotate', 'dist');
  const visdifDist = join(squooshKitRoot, 'visdif', 'dist');

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
      if (existsSync(avifDist)) {
        copyBrowserFiles(avifDist, join(publicDir, 'avif'));
      }
      if (existsSync(mozjpegDist)) {
        copyBrowserFiles(mozjpegDist, join(publicDir, 'mozjpeg'));
      }
      if (existsSync(jxlDist)) {
        copyBrowserFiles(jxlDist, join(publicDir, 'jxl'));
      }
      if (existsSync(oxipngDist)) {
        copyBrowserFiles(oxipngDist, join(publicDir, 'oxipng'));
      }
      if (existsSync(imagequantDist)) {
        copyBrowserFiles(imagequantDist, join(publicDir, 'imagequant'));
      }
      if (existsSync(pngDist)) {
        copyBrowserFiles(pngDist, join(publicDir, 'png'));
      }
      if (existsSync(qoiDist)) {
        copyBrowserFiles(qoiDist, join(publicDir, 'qoi'));
      }
      if (existsSync(wp2Dist)) {
        copyBrowserFiles(wp2Dist, join(publicDir, 'wp2'));
      }
      if (existsSync(hqxDist)) {
        copyBrowserFiles(hqxDist, join(publicDir, 'hqx'));
      }
      if (existsSync(rotateDist)) {
        copyBrowserFiles(rotateDist, join(publicDir, 'rotate'));
      }
      if (existsSync(visdifDist)) {
        copyBrowserFiles(visdifDist, join(publicDir, 'visdif'));
      }

      console.log('Squoosh assets copied successfully!');
    },
    config: () => ({
      server: {
        headers: {
          'Cross-Origin-Embedder-Policy': 'credentialless',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Access-Control-Allow-Origin': '*',
        },
      },
      optimizeDeps: {
        exclude: [
          '@squoosh-kit/webp',
          '@squoosh-kit/resize',
          '@squoosh-kit/avif',
          '@squoosh-kit/mozjpeg',
          '@squoosh-kit/jxl',
          '@squoosh-kit/oxipng',
          '@squoosh-kit/imagequant',
          '@squoosh-kit/png',
          '@squoosh-kit/qoi',
          '@squoosh-kit/wp2',
          '@squoosh-kit/hqx',
          '@squoosh-kit/rotate',
          '@squoosh-kit/visdif',
        ],
      },
      assetsInclude: ['**/*.wasm'],
    }),
    configureServer(server: ViteDevServer) {
      // Serve files from /squoosh-kit path
      server.middlewares.use(
        '/squoosh-kit',
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          try {
            const filePath = join(publicDir, req.url ?? '/');

            if (existsSync(filePath)) {
              const fileData = readFileSync(filePath);

              if (filePath.endsWith('.wasm')) {
                res.setHeader('Content-Type', 'application/wasm');
              } else if (
                filePath.endsWith('.js') ||
                filePath.endsWith('.mjs')
              ) {
                res.setHeader('Content-Type', 'application/javascript');
              }

              res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
              res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
              res.setHeader('Content-Length', fileData.length.toString());
              res.end(fileData);
              return;
            }

            next();
          } catch {
            next();
          }
        }
      );
    },
  };
}
