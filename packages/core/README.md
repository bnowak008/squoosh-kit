# @squoosh-kit/core

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fcore.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fcore)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/license-Apache%202-blue)](https://opensource.org/license/apache-2-0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh Kit](../../squoosh-kit-banner.webp)

## Squoosh Kit

Squoosh Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project.

**Directly from the Source**
We don't modify the core codecs. The WebAssembly (`.wasm`) binaries for WebP encoding and image resizing are taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around these codecs. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
While this `core` package bundles everything for convenience, the Squoosh Kit philosophy is to provide small, focused packages (e.g., `@squoosh-kit/webp`, `@squoosh-kit/resize`) so you only install what you need.

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

## API Reference

All functions follow the same patterns as the individual packages. For detailed documentation, see:

- [WebP Encoding API](../webp) - Advanced encoding options and examples
- [Resize API](../resize) - Resizing algorithms and configuration details

## License

MIT - part of the Squoosh Kit family
