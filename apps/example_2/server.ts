#!/usr/bin/env bun

/**
 * Simple development server for @squoosh-kit/core browser demo
 * Properly handles MIME types for JavaScript and WebAssembly files
 */

import path from 'path';

const __dirname = import.meta.dir;
const projectRoot = path.resolve(__dirname, '../../');

// Define a mapping from URL prefixes to package directories
const packageMappings = {
  '/dist/': path.join(projectRoot, 'packages/core/dist'),
  '/webp/': path.join(projectRoot, 'packages/webp'),
  '/resize/': path.join(projectRoot, 'packages/resize'),
};

const server = Bun.serve({
  port: 8000,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname;
    let fileFound = false;

    // Default to browser demo for root path
    if (filePath === '/') {
      filePath = path.join(__dirname, 'index.html');
      fileFound = true;
    } else {
      for (const prefix in packageMappings) {
        if (filePath.startsWith(prefix)) {
          const packagePath =
            packageMappings[prefix as keyof typeof packageMappings];
          const filename = filePath.substring(prefix.length);
          const potentialFilePath = path.join(packagePath, filename);

          // Check if the file exists at the constructed path
          if (await Bun.file(potentialFilePath).exists()) {
            filePath = potentialFilePath;
            fileFound = true;
            break;
          }

          // Fallback for wasm files in dist/wasm subdirectory
          const wasmFilePath = path.join(packagePath, 'dist/wasm', filename);
          if (
            filename.endsWith('.wasm') &&
            (await Bun.file(wasmFilePath).exists())
          ) {
            filePath = wasmFilePath;
            fileFound = true;
            break;
          }
        }
      }
    }

    if (!fileFound) {
      // Handle files in the app's root directory
      const localPath = path.join(__dirname, filePath);
      if (await Bun.file(localPath).exists()) {
        filePath = localPath;
      }
    }

    // Return a simple 204 No Content for favicon to avoid 404 spam
    if (url.pathname.endsWith('.ico')) {
      return new Response(null, { status: 204 });
    }

    try {
      console.log(`Serving: ${filePath}`);
      // Read the file
      const file = Bun.file(filePath);
      const buffer = await file.arrayBuffer();

      // Determine MIME type based on file extension
      const ext = filePath.split('.').pop()?.toLowerCase();
      let mimeType = 'application/octet-stream'; // Default binary

      console.log(`Serving: ${filePath} (ext: ${ext})`);

      switch (ext) {
        case 'html':
          mimeType = 'text/html; charset=utf-8';
          break;
        case 'js':
        case 'mjs':
          mimeType = 'application/javascript; charset=utf-8';
          break;
        case 'css':
          mimeType = 'text/css; charset=utf-8';
          break;
        case 'wasm':
          mimeType = 'application/wasm';
          break;
        case 'json':
          mimeType = 'application/json; charset=utf-8';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
        case 'svg':
          mimeType = 'image/svg+xml';
          break;
      }

      console.log(`Serving: ${filePath} (${mimeType})`);

      return new Response(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      });
    } catch (error) {
      console.error(`Failed to serve ${filePath}:`, error);
      return new Response('Not Found', { status: 404 });
    }
  },
});

console.log(
  `🚀 @squoosh-kit/core demo server running at http://localhost:${server.port}`
);
console.log('📖 Open http://localhost:8000 to view the demo');
