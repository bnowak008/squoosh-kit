# @squoosh-kit/hqx

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fhqx.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fhqx)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/hqx`) is one of those modules.

**Directly from the Source**
We don't modify the core HQX codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/hqx` allows you to add HQX pixel-art upscaling to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/hqx
# or
npm install @squoosh-kit/hqx
```

## Quick Start

```typescript
import { upscale, createHqxUpscaler } from '@squoosh-kit/hqx';
import type { ImageInput } from '@squoosh-kit/hqx';

const sprite: ImageInput = {
  data: spriteBuffer,
  width: 16,
  height: 16,
};

// Upscale 2x (16x16 → 32x32)
const upscaled2x = await upscale(sprite, { factor: 2 });

// Upscale 4x (16x16 → 64x64)
const upscaled4x = await upscale(sprite, { factor: 4 });

// For multiple sprites, use a persistent upscaler
const scaler = createHqxUpscaler('worker');
const result = await scaler(sprite, { factor: 3 });
await scaler.terminate();
```

## What is HQX?

HQX (High Quality Scale) is a pixel-art upscaling algorithm designed specifically for low-resolution pixel art. Unlike bilinear or bicubic scaling—which blur pixel art—HQX preserves the sharp edges and color palettes characteristic of pixel art while smoothing diagonal lines. It supports 2x, 3x, and 4x upscaling.

HQX is ideal for:

- Retro game sprites and tilesets
- Pixel art illustrations
- Low-resolution game assets that need display at higher resolutions
- Any content where sharpness matters more than photorealism

For photographic images or general resizing, see `@squoosh-kit/resize` instead.

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `upscale(image, options?, signal?)` - Upscale a pixel-art image using HQX
- `createHqxUpscaler(mode?)` - Create a reusable upscaler function
- `ImageInput` type - Input image data structure
- `HqxOptions` type - Upscaling configuration
- `HqxUpscalerFactory` type - Type for reusable upscaler functions

## Real-World Examples

**Upscale a spritesheet for high-DPI displays**

```typescript
const spritesheet: ImageInput = {
  data: await readFile('sprites.raw'),
  width: 128,
  height: 128,
};

// 2x for standard Retina, 4x for high-DPI
const retina = await upscale(spritesheet, { factor: 2 }); // 256x256
const highDpi = await upscale(spritesheet, { factor: 4 }); // 512x512
```

**Batch upscale game assets with worker**

```typescript
const scaler = createHqxUpscaler('worker');

try {
  const upscaledAssets = await Promise.all(
    sprites.map((sprite) => scaler(sprite, { factor: 2 }))
  );
  // Save assets...
} finally {
  await scaler.terminate();
}
```

## API Reference

### `upscale(image, options?, signal?)`

Upscales a pixel-art image using the HQX algorithm. The output dimensions are exactly `factor` times the input dimensions.

- `image` - `ImageInput` object with your pixel data
- `options` - (optional) `HqxOptions` — defaults to `{ factor: 2 }`
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<ImageInput>` with upscaled pixel data and updated dimensions

**Note**: `upscale()` uses a global singleton worker. For long-running applications where worker cleanup is important, use `createHqxUpscaler()` instead.

### `createHqxUpscaler(mode?)`

Creates a reusable upscaler. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `upscale()`

## Cancellation Support

To cancel an upscaling operation in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

const upscalePromise = upscale(sprite, { factor: 4 }, controller.signal);
setTimeout(() => controller.abort(), 5000);

try {
  const result = await upscalePromise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Upscaling was cancelled');
  }
}
```

## Input Validation

All inputs are automatically validated before processing:

```typescript
// Will throw TypeError: image must be an object
await upscale(null, { factor: 2 });

// Will throw TypeError: image.data must be Uint8Array or Uint8ClampedArray
await upscale({ data: [0, 0, 0, 255], width: 16, height: 16 }, { factor: 2 });

// Will throw RangeError: image.data too small
await upscale(
  { data: new Uint8Array(100), width: 64, height: 64 },
  { factor: 2 }
);
```

### Package Size

**Size breakdown:**

- JavaScript code: ~4-6KB gzipped
- TypeScript definitions: ~2KB
- WASM binary: ~15-20KB gzipped

### Worker Cleanup

When using worker mode (`createHqxUpscaler('worker')`), clean up when done:

```typescript
const scaler = createHqxUpscaler('worker');

try {
  const upscaled = await scaler(sprite, { factor: 2 });
} finally {
  await scaler.terminate();
}
```

### `HqxOptions`

```typescript
type HqxOptions = {
  factor?: 2 | 3 | 4; // Upscaling factor (default: 2)
};
```

- `2` — 2x upscale (e.g., 16×16 → 32×32)
- `3` — 3x upscale (e.g., 16×16 → 48×48)
- `4` — 4x upscale (e.g., 16×16 → 64×64)

## Performance Tips

- **Use workers for UI apps** - Keeps the interface responsive while upscaling large spritesheets
- **Use client mode for servers** - Avoids worker overhead for batch processing
- **HQX is not for photos** - For photographic images, use `@squoosh-kit/resize` with lanczos3 or mitchell
- **Factor 2 is fastest** - Higher factors process more pixels; start with 2x unless you specifically need 3x or 4x

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
