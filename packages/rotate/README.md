# @squoosh-kit/rotate

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Frotate.svg)](https://badge.fury.io/js/%40squoosh-kit%2Frotate)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/rotate`) is one of those modules.

**Directly from the Source**
We don't modify the core rotation codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/rotate` allows you to add WASM-powered image rotation to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/rotate
# or
npm install @squoosh-kit/rotate
```

## Quick Start

```typescript
import { rotate, createRotator } from '@squoosh-kit/rotate';
import type { ImageInput } from '@squoosh-kit/rotate';

const imageData: ImageInput = {
  data: imageBuffer,
  width: 1920,
  height: 1080,
};

// Rotate 90 degrees clockwise
const rotated = await rotate(imageData, { rotate: 90 });
// rotated.width === 1080, rotated.height === 1920

// For multiple images, use a persistent rotator
const rotator = createRotator();
const result = await rotator(imageData, { rotate: 270 });
await rotator.terminate();
```

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `rotate(image, options?, signal?)` - Rotate an image by a multiple of 90 degrees
- `createRotator(mode?)` - Create a reusable rotator function
- `ImageInput` type - Input/output image data structure
- `RotateOptions` type - Rotation configuration
- `RotatorFactory` type - Type for reusable rotator functions

## Real-World Examples

**EXIF orientation correction**

```typescript
// Many cameras store images sideways and use EXIF orientation to indicate rotation.
// Use this package to apply that rotation explicitly.

const exifRotation = getExifRotation(imageFile); // your EXIF reader
const corrected = await rotate(imageData, {
  rotate: exifRotation as 0 | 90 | 180 | 270,
});
```

**Pipeline with cancellation**

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

try {
  const rotated = await rotate(imageData, { rotate: 90 }, controller.signal);
  // Continue processing rotated image...
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Rotation cancelled');
  }
} finally {
  clearTimeout(timeout);
}
```

## API Reference

### `rotate(image, options?, signal?)`

Rotates raw RGBA pixel data by the specified angle. The returned image has swapped dimensions for 90° and 270° rotations.

- `image` - `ImageInput` object with your pixel data
- `options` - (optional) `RotateOptions` — defaults to `{ rotate: 0 }`
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<ImageInput>` with rotated pixel data and updated dimensions

**Note**: `rotate()` uses a global singleton in **auto** mode (worker in the browser, client in Bun/Node) and is never automatically terminated. For long-running applications where worker cleanup is important, use `createRotator()` instead.

### `createRotator(mode?)`

Creates a reusable rotator. More efficient for processing multiple images.

- `mode` - (optional) `'auto'`, `'worker'`, or `'client'`; defaults to `'auto'` (worker in the browser main thread, client in Bun/Node)
- **Returns** - A function with the same signature as `rotate()`

## Cancellation Support

To cancel a rotation in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

const rotatePromise = rotate(imageData, { rotate: 90 }, controller.signal);
setTimeout(() => controller.abort(), 5000);

try {
  const result = await rotatePromise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Rotation was cancelled');
  }
}
```

## Input Validation

All inputs are automatically validated before processing:

```typescript
// Will throw TypeError: image must be an object
await rotate(null, { rotate: 90 });

// Will throw TypeError: image.data must be Uint8Array or Uint8ClampedArray
await rotate({ data: [0, 0, 0, 255], width: 32, height: 32 }, { rotate: 90 });

// Will throw RangeError: image.data too small
await rotate(
  { data: new Uint8Array(100), width: 800, height: 600 },
  { rotate: 90 }
);
```

### Package Size

**Size breakdown:**

- JavaScript code: ~4-6KB gzipped
- TypeScript definitions: ~2KB
- WASM binary: ~10-15KB gzipped

### Worker Cleanup

When using worker mode (`createRotator('worker')`), clean up the worker when done:

```typescript
const rotator = createRotator('worker');

try {
  const rotated = await rotator(imageData, { rotate: 180 });
} finally {
  await rotator.terminate();
}
```

### `RotateOptions`

```typescript
type RotateOptions = {
  rotate?: 0 | 90 | 180 | 270; // Degrees clockwise (default: 0)
};
```

- `0` — no rotation (pass-through)
- `90` — 90° clockwise (landscape → portrait; dimensions swap)
- `180` — upside down (dimensions unchanged)
- `270` — 270° clockwise / 90° counter-clockwise (portrait → landscape; dimensions swap)

## Performance Tips

- **Auto mode in the browser** - Uses workers automatically to keep the UI responsive - Keeps your interface responsive
- **Auto mode in Bun/Node** - Runs on the main thread without worker overhead - Direct processing without worker overhead
- **Batch with persistent rotators** - More efficient than one-off calls
- **Rotation is lossless** - No quality loss regardless of angle

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

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

The `@squoosh-kit/rotate` source code is licensed under the **MIT License** — see [LICENSE](https://github.com/bnowak008/squoosh-kit/blob/main/LICENSE).

The WebAssembly binaries distributed with this package are compiled from [Google Squoosh](https://github.com/GoogleChromeLabs/squoosh) and are licensed under the **Apache License 2.0** — see [NOTICE](https://github.com/bnowak008/squoosh-kit/blob/main/NOTICE) for the full attribution and license text.

The two licenses are compatible — both are permissive and allow commercial use.
<!-- END:SQUOOSH-KIT-LICENSE -->
