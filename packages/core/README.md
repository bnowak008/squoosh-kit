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
import { encode, resize, createWebpEncoder, createResizer } from '@squoosh-kit/core';

// Quick one-off operations
const webpData = await encode(
  new AbortController().signal,
  imageData,
  { quality: 85 }
);

const resizedImage = await resize(
  new AbortController().signal,
  imageData,
  { width: 800, height: 600 }
);

// Or create reusable processors for batch operations
const encoder = createWebpEncoder('worker');
const resizer = createResizer('worker');
```

## What's Included

This package bundles together:

- **WebP Encoding** - Convert images to the modern WebP format with fine-tuned quality control
- **Image Resizing** - High-quality Lanczos3 resizing for crisp, clear results
- **Worker Management** - Automatic Web Worker integration to keep your app responsive
- **TypeScript Support** - Full type definitions for a great development experience

## When to Use Core vs Individual Packages

**Use `@squoosh-kit/core` when:**
- You're just getting started and want everything available
- Your project needs both WebP encoding and resizing
- You prefer a single dependency for simplicity
- You're building a prototype or proof of concept

**Consider individual packages when:**
- You only need one specific feature (like just WebP encoding)
- Bundle size is critical and you want to minimize dependencies
- You need fine-grained control over versions

## API Reference

All functions follow the same patterns as the individual packages. For detailed documentation, see:

- [WebP Encoding API](./webp) - Advanced encoding options and examples
- [Resize API](./resize) - Resizing algorithms and configuration details

## License

MIT - part of the Squoosh Kit family
