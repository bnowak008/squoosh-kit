#!/usr/bin/env bun

/**
 * Simple development server for @squoosh-kit/core browser demo
 * Properly handles MIME types for JavaScript and WebAssembly files
 */

import path from 'path';

const __dirname = import.meta.dir;
const projectRoot = path.resolve(__dirname, '../../');

const server = Bun.serve({
  port: 8000,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve static files from dist/ directory as root
    let filePath = url.pathname;

    // Default to browser demo for root path
    if (filePath === '/') {
      filePath = 'index.html';
    }

    // Map paths to serve from the correct package directories
    if (filePath.startsWith('/dist/features/webp/')) {
      console.log(`/dist/features/webp/: ${filePath}`);
      const filename = filePath.replace('/dist/features/webp/', '');
      filePath = path.join(projectRoot, 'packages/webp/dist', filename);
    } else if (filePath.startsWith('/dist/features/resize/')) {
      console.log(`/dist/features/resize/: ${filePath}`);
      const filename = filePath.replace('/dist/features/resize/', '');
      filePath = path.join(projectRoot, 'packages/resize/dist', filename);
    } else if (filePath.startsWith('/webp/dist/')) {
      console.log(`/webp/dist/: ${filePath}`);
      const filename = filePath.replace('/webp/dist/', '');
      filePath = path.join(projectRoot, 'packages/webp/dist', filename);
    } else if (filePath.startsWith('/resize/dist/')) {
      console.log(`/resize/dist/: ${filePath}`);
      const filename = filePath.replace('/resize/dist/', '');
      filePath = path.join(projectRoot, 'packages/resize/dist', filename);
    } else if (filePath.startsWith('/dist/features/wasm/')) {
      console.log(`/dist/features/wasm/: ${filePath}`);
      const filename = filePath.replace('/dist/features/wasm/', '');
      // Route to the correct package based on filename
      // Handle subdirectories like webp/webp_enc.wasm or webp-dec/webp_dec.wasm
      if (filename.includes('resize')) {
        filePath = path.join(
          projectRoot,
          'packages/resize/dist/wasm',
          filename
        );
      } else if (
        filename.startsWith('webp/') ||
        filename.startsWith('webp-dec/')
      ) {
        filePath = path.join(projectRoot, 'packages/webp/dist/wasm', filename);
      } else if (
        filename.includes('webp') ||
        filename.includes('enc') ||
        filename.includes('dec')
      ) {
        filePath = path.join(projectRoot, 'packages/webp/dist/wasm', filename);
      } else {
        // Default to resize if unclear
        filePath = path.join(
          projectRoot,
          'packages/resize/dist/wasm',
          filename
        );
      }
    } else if (filePath.startsWith('/dist/')) {
      console.log(`/dist/: ${filePath}`);
      const filename = filePath.replace('/dist/', '');
      // Map index.js to index.browser.mjs for browser environments
      const resolvedFilename =
        filename === 'index.js' ? 'index.browser.mjs' : filename;
      filePath = path.join(projectRoot, 'packages/core/dist', resolvedFilename);
    } else if (filePath.startsWith('/wasm/')) {
      const filename = filePath;
      filePath = path.join(projectRoot, 'packages/core/dist', filename);
    } else if (filePath.startsWith('/features/')) {
      const filename = filePath;
      filePath = path.join(projectRoot, 'packages/core/dist', filename);
    } else if (filePath.startsWith('/examples/')) {
      // Keep examples as-is for the HTML demo
      filePath = path.join(__dirname, filePath);
    } else if (filePath !== 'index.html' && !filePath.endsWith('.ico')) {
      // For any other paths, assume they're in core package dist/
      const filename = filePath;
      filePath = path.join(projectRoot, 'packages/core/dist', filename);
    } else if (filePath.endsWith('.ico')) {
      // Return a simple 204 No Content for favicon to avoid 404 spam
      return new Response(null, { status: 204 });
    } else {
      // Handle index.html and other files in app root
      filePath = path.join(__dirname, filePath);
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
