# Squoosh Kit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)

**High-performance image processing for modern JavaScript applications**

Squoosh Kit brings Google's Squoosh image optimization technology directly to your JavaScript projects. Built from the ground up for Bun with full TypeScript support, it offers lightning-fast image encoding and resizing through WebAssembly, all while keeping your main thread responsive with intelligent worker management.

Whether you're building a web application, a Node.js service, or a desktop app with Bun, Squoosh Kit gives you the power of professional image processing without the complexity.

## What You Get

| Package | What's Inside | Best For |
|---------|---------------|----------|
| [`@squoosh-kit/webp`](./packages/webp) | WebP encoding with quality control | Next-gen image formats, file size optimization |
| [`@squoosh-kit/resize`](./packages/resize) | High-quality Lanczos3 resizing | Thumbnails, responsive images, batch processing |
| [`@squoosh-kit/core`](./packages/core) | Everything bundled together | Quick prototyping, simple projects |
| [`@squoosh-kit/runtime`](./packages/runtime) | Internal runtime utilities | Advanced customization |

## Quick Example

```typescript
import { encode } from '@squoosh-kit/webp';
import { resize } from '@squoosh-kit/resize';

// Resize first, then encode to WebP
const resized = await resize(
  new AbortController().signal,
  imageData,
  { width: 800 }
);

const webpBuffer = await encode(
  new AbortController().signal,
  resized,
  { quality: 85 }
);
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

## Learn More

Each package has its own comprehensive documentation:

- [WebP Encoding](./packages/webp/README.md) - Advanced WebP options and examples
- [Image Resizing](./packages/resize/README.md) - Resize algorithms and configuration
- [Core Package](./packages/core/README.md) - Meta-package documentation

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
