# Squoosh Kit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)

**High-performance image processing for modern JavaScript applications**

Squoosh Kit brings Google's Squoosh image optimization technology directly to your JavaScript projects. Built from the ground up for Bun with full TypeScript support, it offers lightning-fast image encoding and resizing through WebAssembly, all while keeping your main thread responsive with intelligent worker management.

Whether you're building a web application, a Node.js service, or a desktop app with Bun, Squoosh Kit gives you the power of professional image processing without the complexity.

## What You Get

| Package                                      | What's Inside                       | Best For                                                                                 |
| -------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| [`@squoosh-kit/webp`](./packages/webp)       | WebP encoding with quality control  | Next-gen image formats, file size optimization                                           |
| [`@squoosh-kit/resize`](./packages/resize)   | Flexible resizing with 4 algorithms | Thumbnails, responsive images, batch processing (triangular, catrom, mitchell, lanczos3) |
| [`@squoosh-kit/core`](./packages/core)       | Everything bundled together         | Quick prototyping, simple projects                                                       |
| [`@squoosh-kit/runtime`](./packages/runtime) | Internal runtime utilities          | Advanced customization                                                                   |

## Quick Example

```typescript
import { encode } from '@squoosh-kit/webp';
import { resize } from '@squoosh-kit/resize';

// Resize first, then encode to WebP
const resized = await resize(new AbortController().signal, imageData, {
  width: 800,
  method: 'mitchell',
});

const webpBuffer = await encode(new AbortController().signal, resized, {
  quality: 85,
});
```

## Why Squoosh Kit?

- **Blazing Fast**: WebAssembly codecs from Google Squoosh
- **Non-blocking**: Web Workers keep your UI responsive
- **Type Safe**: Full TypeScript support with detailed APIs
- **Bun Native**: Optimized for Bun, works great in Node.js and browsers
- **Zero Config**: Works out of the box with sensible defaults

## Installation

Choose what you need, or install everything:

```bash
# Everything at once
bun add @squoosh-kit/core

# Or pick specific features
bun add @squoosh-kit/webp @squoosh-kit/resize

# npm works too
npm install @squoosh-kit/core
```

## Package Size & Download Reduction

Squoosh Kit includes WebAssembly binaries for WASM codecs (~30-50KB gzipped per package). These enable fast processing through Web Workers and are essential for optimal performance.

### Size Breakdown

- **JavaScript code**: ~10-15KB gzipped
- **TypeScript definitions**: ~5KB
- **WASM binaries**: ~30-50KB gzipped (only needed for worker mode)

### Client-Only Usage

If you're using Squoosh Kit in **client mode only** (direct encoding/resizing without workers) and want to reduce the download size, you can optionally remove the WASM files:

```bash
# After installation
rm -rf node_modules/@squoosh-kit/webp/dist/wasm/
rm -rf node_modules/@squoosh-kit/resize/dist/wasm/

# This reduces the package size by ~30-50KB gzipped
```

**Important**: Removing WASM files will cause worker mode to fail. Only do this if you're using client mode exclusively:

```typescript
// This will work (client mode)
const encoder = createWebpEncoder('client');

// This will fail (worker mode requires WASM)
const encoder = createWebpEncoder('worker'); // ❌ WASM files missing
```

### Future Plans

For v1.0+, we may offer separate packages:

- `@squoosh-kit/resize-core` (client mode only, ~10KB)
- `@squoosh-kit/resize` (with WASM, ~50KB)

This would give users the choice without manual file removal.

## Learn More

Each package has its own comprehensive documentation:

- [WebP Encoding](./packages/webp/README.md) - Advanced WebP options and examples
- [Image Resizing](./packages/resize/README.md) - Resize algorithms and configuration
- [Core Package](./packages/core/README.md) - Meta-package documentation

## Vite Configuration for Workers

If you're using Vite and encounter worker loading issues, add this to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Exclude squoosh worker files from pre-bundling
    // This allows them to be loaded as regular ES modules
    exclude: [
      '@squoosh-kit/resize/resize.worker.js',
      '@squoosh-kit/webp/webp.worker.js',
    ],
  },
});
```

This configuration tells Vite not to pre-bundle the worker files, allowing them to be loaded directly from `node_modules`.

### Without Vite (Other Bundlers)

For Webpack, Rollup, or other bundlers, ensure that:

1. ES module imports are supported
2. `import.meta.url` is preserved
3. The `node_modules` directory is accessible at runtime

## Production Readiness

✅ **All 13 critical production readiness issues have been resolved:**

- ✅ API Parameter Order Consistency - Stable API across all packages
- ✅ Worker Path Resolution - Reliable worker initialization
- ✅ AbortSignal Handling - Proper cancellation support
- ✅ ImageData Copy Performance - Zero-copy Uint8Array views
- ✅ Worker Memory Leaks - Proper cleanup and resource management
- ✅ Lanczos3 vs Triangular - Flexible resize algorithms with honest documentation
- ✅ WASM Module Loading - Robust codec loading with fallbacks
- ✅ Input Validation - Comprehensive validation with clear error messages
- ✅ Unsafe Type Casts - Eliminated `as ArrayBuffer` casts with proper type checking
- ✅ Parameter Order Between Functions - Consistent parameter ordering
- ✅ WASM Binary Bundling - Clear documentation and optimization paths
- ✅ Edge Cases in Resize Logic - Safe dimension calculations
- ✅ Internal Exports - Clean public API surface

See [Production Readiness Issues](/.cursor/todos/issues/README.md) for detailed information on each resolution.

## Development

This is a Bun-first monorepo. To get started:

```bash
bun install
bun run sync-codecs  # Download Squoosh codecs
bun run build        # Build all packages
bun test             # Run tests
```

## License

MIT - feel free to use in your projects!
