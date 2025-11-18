# @squoosh-kit/vite-plugin

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fvite-plugin.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fvite-plugin)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/license-Apache%202-blue)](https://opensource.org/license/apache-2-0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A Vite plugin for Squoosh Kit that handles asset copying and WebAssembly configuration.

## Overview

The `@squoosh-kit/vite-plugin` simplifies integrating Squoosh Kit codecs into Vite projects by:

- **Automatically copying browser-compatible assets** from `@squoosh-kit/webp` and `@squoosh-kit/resize` packages
- **Configuring WASM module handling** with proper MIME types and CORS headers
- **Setting up optimized dependency exclusions** to prevent bundling of heavy WASM modules
- **Providing WASM file serving** with correct headers in development mode

## Installation

```bash
bun add -D @squoosh-kit/vite-plugin
# or
npm install --save-dev @squoosh-kit/vite-plugin
```

## Quick Start

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import squooshVitePlugin from '@squoosh-kit/vite-plugin';

export default defineConfig({
  plugins: [react(), squooshVitePlugin()],
});
```

That's it! The plugin will:

1. Copy Squoosh Kit browser assets to your `public/squoosh-kit` directory
2. Configure Vite to properly handle WASM files
3. Set necessary CORS headers for cross-origin embedder policy
4. Exclude heavy dependencies from optimization

## What the Plugin Does

### Asset Copying

The plugin automatically copies:

- **Browser builds** (`.browser.mjs`, `.browser.mjs.map`)
- **TypeScript definitions** (`.d.ts`, `.d.ts.map`)
- **WASM modules** (`.wasm` files and supporting JavaScript)

From both `@squoosh-kit/webp` and `@squoosh-kit/resize` to `public/squoosh-kit/`.

### WASM Configuration

The plugin:

- Sets correct MIME type (`application/wasm`) for `.wasm` files
- Configures CORS headers:
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Opener-Policy: same-origin`
- Ensures WASM files are treated as assets
- Handles WASM file paths correctly in both development and production

### Development Server

In development mode, the plugin:

- Serves WASM files with proper headers
- Handles multiple path variants (e.g., `./wasm/` vs `../wasm/`)
- Correctly resolves `@squoosh-kit/wasm/` imports

## Usage Example

After setting up the plugin, you can use Squoosh Kit as normal:

```typescript
import { createWebpEncoder, createResizer } from '@squoosh-kit/core';

// Create encoder and resizer with worker mode
const encoder = createWebpEncoder('worker', {
  assetPath: '/squoosh-kit/',
});

const resizer = createResizer('worker', {
  assetPath: '/squoosh-kit/',
});

// Use them
const webpData = await encoder(imageData, { quality: 80 });
const resizedImage = await resizer(imageData, { width: 800 });
```

## API Reference

### `squooshVitePlugin()`

Returns a Vite plugin that configures Squoosh Kit integration.

**Parameters:** None

**Returns:** Vite Plugin

**Example:**

```typescript
import squooshVitePlugin from '@squoosh-kit/vite-plugin';

export default defineConfig({
  plugins: [squooshVitePlugin()],
});
```

## How It Works

### Build Process

1. **buildStart** hook: Copies assets from package distributions to `public/squoosh-kit/`
2. **config** hook: Injects Vite configuration for WASM handling and optimization
3. **configureServer** hook: Sets up development middleware for WASM file serving

### Asset Paths

Assets are copied to predictable locations:

```
public/
└── squoosh-kit/
    ├── webp/
    │   ├── index.browser.mjs
    │   ├── index.d.ts
    │   └── wasm/
    │       ├── webp_enc.js
    │       ├── webp_enc.wasm
    │       └── ... (other WASM files)
    └── resize/
        ├── index.browser.mjs
        ├── index.d.ts
        └── wasm/
            ├── squoosh_resize.js
            ├── squoosh_resize.wasm
            └── ... (other WASM files)
```

In development, these are served from `http://localhost:5173/squoosh-kit/`.
In production, they're available at `/squoosh-kit/`.

## Configuration

The plugin requires no configuration, but it assumes:

- Your project uses the standard Vite `public/` directory
- You're using `@squoosh-kit/webp` and/or `@squoosh-kit/resize` packages
- You want WASM assets at `/squoosh-kit/` path

## Troubleshooting

### "Cannot find module @squoosh-kit/webp"

Ensure the packages are installed:

```bash
bun add @squoosh-kit/webp @squoosh-kit/resize
```

### WASM files not loading

Check that:

1. The plugin is configured before other plugins
2. You're importing from the correct path: `/squoosh-kit/`
3. Your server headers allow CORS (plugin should set these automatically)

### Build fails with "dist not found"

Ensure you've built the Squoosh Kit packages first:

```bash
bun run build
```

## Performance Tips

- The plugin runs once during Vite startup
- Asset copying adds < 100ms to build time
- WASM files are excluded from Vite's optimization pipeline
- Consider using worker mode for long-running image processing

## Architecture

The plugin follows Squoosh Kit principles:

- **Minimal and focused**: Handles only WASM and asset configuration
- **Framework agnostic**: Works with any Vite-based framework
- **Well-typed**: Full TypeScript support
- **Performance conscious**: Lazy loading of WASM modules

## License

MIT - part of the Squoosh Kit family
