# @squoosh-kit/resize

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fresize.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fresize)

High-quality image resizing functionality from Google's Squoosh, packaged for modern JavaScript environments.

This package provides fast image resizing using WebAssembly (Lanczos3), offloading the work to a Web Worker to avoid blocking the main thread.

## Installation

```bash
bun add @squoosh-kit/resize
# or
npm install @squoosh-kit/resize
```

## Quick Start

```typescript
import { resize, createResizer } from '@squoosh-kit/resize';
import type { ImageInput, ResizeOptions } from '@squoosh-kit/runtime';

// Assume `imageData` is an object like { data: Uint8Array, width: number, height: number }
const imageData: ImageInput = /* ... */;

// Simple, one-off resizing
const resizedImage = await resize(
  new AbortController().signal,
  null,
  imageData,
  { width: 800 } // height will be calculated to maintain aspect ratio
);

// For multiple operations, create a persistent resizer
const resizer = createResizer('worker'); // 'client' also available
const result = await resizer(
  new AbortController().signal,
  imageData,
  { width: 1024, height: 768 }
);
```

## API

### `resize(signal, workerBridge, imageData, options)`

- `signal`: `AbortSignal` to cancel the operation.
- `workerBridge`: (Optional) A `WorkerBridge` instance.
- `imageData`: `ImageInput` to resize.
- `options`: `ResizeOptions` for resizing.
- **Returns**: `Promise<ImageInput>`

### `createResizer(mode)`

- `mode`: `'worker'` or `'client'`.
- **Returns**: A reusable resizing function.

### `ResizeOptions`

```typescript
interface ResizeOptions {
  width?: number;
  height?: number;
  premultiply?: boolean; // default: false
  linearRGB?: boolean; // default: false
}
```

## License

MIT
