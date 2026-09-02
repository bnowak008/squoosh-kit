# @squoosh-kit/runtime

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fruntime.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fruntime)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package facilitates the creation of the worker in the correct runtime.

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
- **Auto bridge mode** — worker in the browser main thread, client in Bun/Node/scripts
- Platform-specific optimizations and polyfills
- Consistent behavior across Bun, Node.js, and browsers

**Communication Layer**

- Type-safe request/response messaging
- Built-in error handling and recovery
- Support for operation cancellation and progress tracking

## For Developers

This package is primarily consumed by the other Squoosh-Kit packages (`webp`, `resize`, `core`), but if you're building custom image processing functionality or contributing to Squoosh-Kit itself, you'll find:

- **Clean abstractions** - Simple APIs that hide WebAssembly complexity
- **Type safety** - Full TypeScript support throughout
- **Cross-platform compatibility** - Works everywhere JavaScript runs
- **Performance optimizations** - Tuned for both speed and responsiveness

## API Overview

The main types and functions you'll encounter:

```typescript
// Core types for image data
type ImageInput = ImageData | { data: Uint8Array; width: number; height: number };

// Bridge mode (used by codec packages)
type BridgeMode = 'auto' | 'worker' | 'client';

function resolveBridgeMode(mode?: BridgeMode): 'worker' | 'client';
// 'auto' (default): worker in the browser main thread, client in Bun/Node

// Worker communication
interface WorkerRequest<T = unknown> {
  id: string;
  type: string;
  payload: T;
}

interface WorkerResponse<T = unknown> {
  id: string;
  ok: boolean;
  data?: T;
  error?: string;
}

// Bridge creation (codec packages)
createBridge(mode?: BridgeMode): ImageProcessorBridge;
```

## Environment Support

- **Bun** - Native performance optimizations
- **Node.js** - Server-grade reliability and speed
- **Browsers** - Full Web Worker integration for responsive UIs
- **WebAssembly** - Hardware-accelerated image processing

## Contributing

If you're working on Squoosh-Kit itself, this package is where the magic happens. The bridge implementations, worker management, and cross-platform compatibility logic all live here.

For detailed API documentation, check the TypeScript definitions and source code comments - everything is thoroughly documented for maintainers.

<!-- BEGIN:SQUOOSH-KIT-RELATED-PACKAGES -->
## Related Packages

Part of [Squoosh-Kit](https://github.com/bnowak008/squoosh-kit). Install only what you need:

| Package                                                                              | Purpose                                      |
| ------------------------------------------------------------------------------------ | -------------------------------------------- |
| [`@squoosh-kit/core`](https://www.npmjs.com/package/@squoosh-kit/core)               | All codecs bundled together                  |
| [`@squoosh-kit/webp`](https://www.npmjs.com/package/@squoosh-kit/webp)               | WebP encoding/decoding                       |
| [`@squoosh-kit/avif`](https://www.npmjs.com/package/@squoosh-kit/avif)               | AVIF encoding/decoding                       |
| [`@squoosh-kit/mozjpeg`](https://www.npmjs.com/package/@squoosh-kit/mozjpeg)         | Optimized JPEG encoding/decoding             |
| [`@squoosh-kit/jxl`](https://www.npmjs.com/package/@squoosh-kit/jxl)                 | JPEG XL encoding/decoding                    |
| [`@squoosh-kit/wp2`](https://www.npmjs.com/package/@squoosh-kit/wp2)                 | WP2 encoding/decoding (experimental)         |
| [`@squoosh-kit/png`](https://www.npmjs.com/package/@squoosh-kit/png)                 | Lossless PNG encoding/decoding               |
| [`@squoosh-kit/qoi`](https://www.npmjs.com/package/@squoosh-kit/qoi)                 | QOI lossless encoding/decoding               |
| [`@squoosh-kit/resize`](https://www.npmjs.com/package/@squoosh-kit/resize)           | High-quality image resizing                  |
| [`@squoosh-kit/rotate`](https://www.npmjs.com/package/@squoosh-kit/rotate)           | 90°/180°/270° rotation                       |
| [`@squoosh-kit/oxipng`](https://www.npmjs.com/package/@squoosh-kit/oxipng)           | Lossless PNG optimization                    |
| [`@squoosh-kit/imagequant`](https://www.npmjs.com/package/@squoosh-kit/imagequant)   | Palette quantization (PNG-8)                 |
| [`@squoosh-kit/hqx`](https://www.npmjs.com/package/@squoosh-kit/hqx)                 | Pixel-art upscaling (2x/3x/4x)               |
| [`@squoosh-kit/visdif`](https://www.npmjs.com/package/@squoosh-kit/visdif)           | Butteraugli perceptual comparison            |
| [`@squoosh-kit/runtime`](https://www.npmjs.com/package/@squoosh-kit/runtime)         | Internal runtime utilities                   |
| [`@squoosh-kit/vite-plugin`](https://www.npmjs.com/package/@squoosh-kit/vite-plugin) | Vite plugin for WASM assets and CORS headers |
<!-- END:SQUOOSH-KIT-RELATED-PACKAGES -->

<!-- BEGIN:SQUOOSH-KIT-LICENSE -->
## License

The `@squoosh-kit/runtime` source code is licensed under the **MIT License** — see [LICENSE](https://github.com/bnowak008/squoosh-kit/blob/main/LICENSE).
<!-- END:SQUOOSH-KIT-LICENSE -->

