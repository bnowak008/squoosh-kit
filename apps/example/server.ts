#!/usr/bin/env bun

/**
 * Simple development server for the example app.
 * Serves static files from the 'public' directory.
 */

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let filePath = url.pathname;

    if (filePath === '/') {
      filePath = '/index.html';
    }

    const fullPath = `./public${filePath}`;

    try {
      const file = Bun.file(fullPath);
      
      if (!(await file.exists())) {
        // Fallback to index.html for SPA routing
        const indexFile = Bun.file('./public/index.html');
        return new Response(indexFile, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
          },
        });
      }

      // Determine MIME type based on file extension
      const ext = filePath.split('.').pop()?.toLowerCase();
      let mimeType = 'application/octet-stream';

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
      
      return new Response(file, {
        headers: {
          'Content-Type': mimeType,
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      });
    } catch (error) {
      console.error(`Failed to serve ${fullPath}:`, error);
      return new Response('Not Found', { status: 404 });
    }
  },
});

console.log(
  `🚀 Squoosh Lite Example server running at http://localhost:${server.port}`
);
