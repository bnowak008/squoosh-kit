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
const rotator = createRotator('worker');
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

**Note**: `rotate()` uses a global singleton worker that is never automatically terminated. For long-running applications where worker cleanup is important, use `createRotator()` instead.

### `createRotator(mode?)`

Creates a reusable rotator. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
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

- **Use workers for UI apps** - Keeps your interface responsive
- **Use client mode for servers** - Direct processing without worker overhead
- **Batch with persistent rotators** - More efficient than one-off calls
- **Rotation is lossless** - No quality loss regardless of angle

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
