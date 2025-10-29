# @squoosh-kit/runtime

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fwebp.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fwebp)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/license-Apache%202-blue)](https://opensource.org/license/apache-2-0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh Kit

Squoosh Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package facilitates the creation of the worker in the correct runtime.

**Directly from the Source**
We don't modify the core WebP codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

## What's Inside

**Worker Bridge**

- Seamless communication between main thread and Web Workers
- Automatic worker lifecycle management
- Graceful fallback for environments without worker support

**Environment Detection**

- Smart detection of execution context (worker vs main thread)
- Platform-specific optimizations and polyfills
- Consistent behavior across Bun, Node.js, and browsers

**Communication Layer**

- Type-safe request/response messaging
- Built-in error handling and recovery
- Support for operation cancellation and progress tracking

## For Developers

This package is primarily consumed by the other Squoosh Kit packages (`webp`, `resize`, `core`), but if you're building custom image processing functionality or contributing to Squoosh Kit itself, you'll find:

- **Clean abstractions** - Simple APIs that hide WebAssembly complexity
- **Type safety** - Full TypeScript support throughout
- **Cross-platform compatibility** - Works everywhere JavaScript runs
- **Performance optimizations** - Tuned for both speed and responsiveness

## API Overview

The main types and functions you'll encounter:

```typescript
// Core types for image data
type ImageInput = ImageData | { data: Uint8Array; width: number; height: number };

// Worker communication
interface WorkerRequest<T = any> {
  id: string;
  type: string;
  payload: T;
}

interface WorkerResponse<T = any> {
  id: string;
  ok: boolean;
  data?: T;
  error?: string;
}

// Bridge creation
createBridge(mode: 'worker' | 'client'): ImageProcessorBridge;
```

## Environment Support

- **Bun** - Native performance optimizations
- **Node.js** - Server-grade reliability and speed
- **Browsers** - Full Web Worker integration for responsive UIs
- **WebAssembly** - Hardware-accelerated image processing

## Contributing

If you're working on Squoosh Kit itself, this package is where the magic happens. The bridge implementations, worker management, and cross-platform compatibility logic all live here.

For detailed API documentation, check the TypeScript definitions and source code comments - everything is thoroughly documented for maintainers.

## License

MIT - the foundation of Squoosh Kit
