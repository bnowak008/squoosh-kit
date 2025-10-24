# @squoosh-kit/core

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fcore.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fcore)

**The complete Squoosh Kit experience in a single package**

`@squoosh-kit/core` brings together all the image processing power of Squoosh Kit in one convenient package. Perfect for when you want everything at your fingertips without worrying about which specific package to install.

This meta-package re-exports all functionality from the individual Squoosh Kit packages, so you get WebP encoding, high-quality resizing, and all the underlying runtime utilities in one place.

## Installation

```bash
bun add @squoosh-kit/core
# or
npm install @squoosh-kit/core
```

## Quick Start

Everything you need, right at your fingertips:

```typescript
import {
  encode,
  resize,
  createWebpEncoder,
  createResizer,
} from '@squoosh-kit/core';

// Quick one-off operations
const webpData = await encode(imageData, {
  quality: 85,
});

const resizedImage = await resize(imageData, {
  width: 800,
  height: 600,
});

// Or create reusable processors for batch operations
const encoder = createWebpEncoder('worker');
const resizer = createResizer('worker');
```

## What's Included

This package bundles together:

- **WebP Encoding** - Convert images to the modern WebP format with fine-tuned quality control
- **Image Resizing** - High-quality resizing with multiple algorithms (triangular, catrom, mitchell, lanczos3)
- **Worker Management** - Automatic Web Worker integration to keep your app responsive
- **TypeScript Support** - Full type definitions for a great development experience
- **WebAssembly Codecs** - Pre-built WASM modules for fast processing (automatically resolved at runtime)

## When to Use Core vs Individual Packages

**Use `@squoosh-kit/core` when:**

- You're just getting started and want everything available
- Your project needs both WebP encoding and resizing
- You prefer a single dependency for simplicity
- You're building a prototype or proof of concept
- You're using the package in a browser or Node.js/Bun environment

**Consider individual packages when:**

- You only need one specific feature (like just WebP encoding)
- Bundle size is critical and you want to minimize dependencies (install `@squoosh-kit/resize` or `@squoosh-kit/webp` directly)
- You need fine-grained control over versions

## How It Works

`@squoosh-kit/core` automatically:

1. **Resolves worker files** from installed `@squoosh-kit/resize` and `@squoosh-kit/webp` packages
2. **Loads WASM codecs** from the package's `dist/wasm/` directory
3. **Manages workers** across browser and Node.js/Bun environments

### Browser Support

In browser environments, `@squoosh-kit/core` uses:

- **Web Workers** to keep the main thread responsive
- **Module workers** for ES module support
- **Automatic path resolution** to find worker and WASM files in node_modules

The package automatically detects:

- Monorepo development structures
- Npm-installed flat node_modules
- Flat vs nested node_modules hierarchies

## Performance Characteristics

- **Worker mode** (default): Non-blocking, keeps UI responsive
- **Client mode**: Direct execution on main thread, slightly faster but blocks UI
- **WASM**: Near-native performance for image processing

## API Reference

All functions follow the same patterns as the individual packages. For detailed documentation, see:

- [WebP Encoding API](../webp) - Advanced encoding options and examples
- [Resize API](../resize) - Resizing algorithms and configuration details

## License

MIT - part of the Squoosh Kit family
