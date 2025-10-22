# @squoosh-kit/core

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fcore.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fcore)
[![CI](https://github.com/bnowak008/squoosh-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/bnowak008/squoosh-kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The complete Squoosh Kit experience in a single package.**

`@squoosh-kit/core` brings together all the image processing power of Squoosh Kit in one convenient package. It's the perfect way to get started when you want everything at your fingertips without worrying about which specific package to install.

This meta-package re-exports all functionality from the individual Squoosh Kit packages, so you get WebP encoding, high-quality resizing, and all the underlying runtime utilities in one place.

## Installation

```bash
bun add @squoosh-kit/core
# or
npm install @squoosh-kit/core
```

## Quick Start

### One-off Operations

For simple, one-time conversions, you can use the direct `encode` and `resize` functions.

```typescript
import { encode, resize } from '@squoosh-kit/core';
import { ImageInput } from '@squoosh-kit/runtime';

// Example ImageData (replace with your actual image data)
const imageData: ImageInput = {
  data: new Uint8Array(100 * 100 * 4).fill(255),
  width: 100,
  height: 100,
};

// Encode to WebP
const webpData = await encode(new AbortController().signal, imageData, {
  quality: 85,
});

// Resize an image
const resizedImage = await resize(new AbortController().signal, imageData, {
  width: 50,
  height: 50,
});
```

### Batch Processing

For processing multiple images, it's more efficient to create reusable processors. This will spin up a Web Worker and reuse it for all operations, which is much faster.

```typescript
import { createWebpEncoder, createResizer } from '@squoosh-kit/core';

const encoder = createWebpEncoder('worker');
const resizer = createResizer('worker');

const imagesToProcess = [imageData1, imageData2, imageData3];

for (const image of imagesToProcess) {
  const webpData = await encoder.encode(new AbortController().signal, image);
  const resizedImage = await resizer.resize(
    new AbortController().signal,
    image,
    { width: 150 }
  );
  // ... do something with the results
}
```

## API Reference

### `createWebpEncoder(mode: 'worker' | 'client')`

Creates a reusable WebP encoder instance.

- **`mode`**:
  - `'worker'` (recommended): Offloads encoding to a separate thread to avoid blocking the main thread.
  - `'client'`: Runs encoding on the same thread. Useful in environments where workers are not available.
- **Returns**: An object with an `encode` method.

### `encoder.encode(signal, image, options?)`

Encodes an image to the WebP format.

- **`signal`**: An `AbortSignal` to cancel the operation.
- **`image`**: An `ImageInput` object (`{ data: Uint8Array, width: number, height: number }`).
- **`options?`**: Optional `WebpOptions` for encoding.
- **Returns**: A `Promise<Uint8Array>` with the WebP data.

### `createResizer(mode: 'worker' | 'client')`

Creates a reusable image resizer instance.

- **`mode`**:
  - `'worker'` (recommended): Offloads resizing to a separate thread.
  - `'client'`: Runs resizing on the same thread.
- **Returns**: An object with a `resize` method.

### `resizer.resize(signal, image, options)`

Resizes an image.

- **`signal`**: An `AbortSignal` to cancel the operation.
- **`image`**: An `ImageInput` object.
- **`options`**: `ResizeOptions` (`{ width?: number, height?: number }`).
- **Returns**: A `Promise<ImageInput>` with the resized image data.

## Environment Compatibility

Squoosh Kit is designed to work seamlessly in multiple environments:

- **Node.js**: Fully supported.
- **Bun**: Fully supported and optimized for.
- **Modern Browsers**: Fully supported (Chrome, Firefox, Safari, Edge).

## License

MIT - part of the Squoosh Kit family.
