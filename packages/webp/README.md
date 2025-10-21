# @squoosh-kit/webp

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fwebp.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fwebp)

WebP encoder functionality from Google's Squoosh, packaged for modern JavaScript environments.

This package provides high-performance WebP encoding using WebAssembly, offloading the work to a Web Worker to avoid blocking the main thread.

## Installation

```bash
bun add @squoosh-kit/webp
# or
npm install @squoosh-kit/webp
```

## Quick Start

```typescript
import { encode, createWebpEncoder } from '@squoosh-kit/webp';
import type { ImageInput, WebpOptions } from '@squoosh-kit/runtime';

// Assume `imageData` is an object like { data: Uint8Array, width: number, height: number }
const imageData: ImageInput = /* ... */;

// Simple, one-off encoding
const webpData = await encode(
  new AbortController().signal,
  null,
  imageData,
  { quality: 75 }
);

// For multiple operations, create a persistent encoder
const encoder = createWebpEncoder('worker'); // 'client' also available
const result = await encoder(
  new AbortController().signal,
  imageData,
  { quality: 90 }
);
```

## API

### `encode(signal, workerBridge, imageData, options)`

- `signal`: `AbortSignal` to cancel the operation.
- `workerBridge`: (Optional) A `WorkerBridge` instance.
- `imageData`: `ImageInput` to encode.
- `options`: `WebpOptions` for encoding.
- **Returns**: `Promise<Uint8Array>`

### `createWebpEncoder(mode)`

- `mode`: `'worker'` or `'client'`.
- **Returns**: A reusable encoding function.

### `WebpOptions`

```typescript
interface WebpOptions {
  quality?: number; // 0-100, default: 82
  lossless?: boolean; // default: false
  nearLossless?: boolean; // default: false
}
```

## License

MIT
