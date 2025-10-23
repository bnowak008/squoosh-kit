#!/usr/bin/env bun

/**
 * Simple development server for @squoosh-kit/core browser demo
 * Properly handles MIME types for JavaScript and WebAssembly files
 */

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

    // Map paths to serve from the core package dist directory
    if (filePath.startsWith('/dist/')) {
      console.log(`/dist/: ${filePath}`);
      filePath = filePath.replace('/dist/', '../../packages/core/dist/'); // Point to core package dist
    } else if (filePath.startsWith('/wasm/')) {
      console.log(`/wasm/: ${filePath}`);
      filePath = '../../packages/core/dist' + filePath; // Point to core package dist
    } else if (filePath.startsWith('/features/')) {
      console.log(`/features/: ${filePath}`);
      filePath = '../../packages/core/dist' + filePath; // Point to core package dist
    } else if (filePath.startsWith('/examples/')) {
      console.log(`/examples/: ${filePath}`);
      // Keep examples as-is for the HTML demo
    } else if (filePath !== 'index.html') {
      // For any other paths, assume they're in core package dist/
      filePath = '../../packages/core/dist' + filePath;
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
