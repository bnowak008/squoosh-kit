# @squoosh-kit/resize

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fresize.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fresize)
[![CI](https://github.com/bnowak008/squoosh-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/bnowak008/squoosh-kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Professional image resizing with uncompromising quality.**

Transform your images with the same high-quality resizing algorithm that powers Google's Squoosh. Using the Lanczos3 method for mathematically precise scaling, this package delivers crisp, clear results at any size through WebAssembly acceleration.

Whether you need thumbnails for a gallery, responsive images for the web, or batch processing for a media library, this package handles resizing with the quality your users deserve, all while keeping your application smooth and responsive.

## Installation

```bash
bun add @squoosh-kit/resize
# or
npm install @squoosh-kit/resize
```

## Quick Start

### One-off Resizing

For a single image, the `resize` function is the easiest way to get started. It will maintain the aspect ratio if you only provide a width or a height.

```typescript
import { resize } from '@squoosh-kit/resize';
import type { ImageInput } from '@squoosh-kit/runtime';

const imageData: ImageInput = {
  data: new Uint8Array(2048 * 1536 * 4).fill(0),
  width: 2048,
  height: 1536,
};

// Smart resizing maintains aspect ratio
const thumbnail = await resize(
  new AbortController().signal,
  imageData,
  { width: 400 } // height will be calculated automatically to 300
);
```

### Batch Resizing

For processing multiple images, create a reusable `resizer` to improve performance by using a persistent Web Worker.

```typescript
import { createResizer } from '@squoosh-kit/resize';

const resizer = createResizer('worker');

const images = [image1, image2, image3];

const results = await Promise.all(
  images.map((image) =>
    resizer.resize(new AbortController().signal, image, { width: 800 })
  )
);
```

## API Reference

### `createResizer(mode: 'worker' | 'client')`

Creates a reusable image resizer instance.

- **`mode`**:
  - `'worker'` (recommended): Offloads resizing to a separate thread to avoid blocking the main thread.
  - `'client'`: Runs resizing on the same thread. Useful in environments where workers are not available.
- **Returns**: An object with a `resize` method.

### `resizer.resize(signal, image, options)`

Resizes an image.

- **`signal`**: An `AbortSignal` to cancel the operation.
- **`image`**: An `ImageInput` object (`{ data: Uint8Array, width: number, height: number }`).
- **`options`**: `ResizeOptions` (`{ width?: number, height?: number }`).
- **Returns**: A `Promise<ImageInput>` with the resized image data.

### `resize(signal, image, options)`

A convenience function for a single resize operation. It creates a temporary client-side resizer internally.

## Environment Compatibility

- **Node.js**: Fully supported for server-side image processing.
- **Bun**: Fully supported and optimized for.
- **Modern Browsers**: Fully supported with Web Workers for a responsive UI.

## License

MIT - resize with confidence.
