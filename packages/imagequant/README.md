# @squoosh-kit/imagequant

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fimagequant.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fimagequant)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/imagequant`) is one of those modules.

**Directly from the Source**
We don't modify the core ImageQuant codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/imagequant` allows you to add palette-based lossy PNG compression to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/imagequant
# or
npm install @squoosh-kit/imagequant
```

## Quick Start

```typescript
import { quantize, createImagequantQuantizer } from '@squoosh-kit/imagequant';
import type { ImageInput } from '@squoosh-kit/imagequant';

const imageData: ImageInput = {
  data: rawPixelBuffer,
  width: 800,
  height: 600,
};

// Quantize to 256 colors (default)
const quantized = await quantize(imageData);
// quantized.data is a palette-mapped Uint8ClampedArray

// Reduce to 64 colors with full dithering
const reduced = await quantize(imageData, { numColors: 64, dither: 1.0 });

// For multiple images, use a persistent quantizer
const quantizer = createImagequantQuantizer('worker');
const result = await quantizer(imageData, { numColors: 128 });
await quantizer.terminate();
```

## What is ImageQuant?

ImageQuant is a palette quantizer — it reduces a full-color (24-bit RGB) image to a smaller palette of up to 256 colors. This is the same technique used to create indexed-color PNGs (PNG-8), which can be significantly smaller than full-color PNGs for images with limited color ranges like icons, illustrations, and logos.

The output is quantized pixel data, not an encoded file. To save as PNG-8, pass the result to `@squoosh-kit/png` or another encoder.

ImageQuant is a good fit for:

- Icons, logos, and illustrations with limited colors
- Reducing PNG file sizes for web delivery
- Preparing images for platforms with palette constraints

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `quantize(image, options?, signal?)` - Reduce an image to a limited color palette
- `createImagequantQuantizer(mode?)` - Create a reusable quantizer function
- `ImageInput` type - Input image data structure
- `ImagequantOptions` type - Quantization configuration
- `ImagequantQuantizerFactory` type - Type for reusable quantizer functions

## Real-World Examples

**Create a palette-optimized PNG for web delivery**

```typescript
import { quantize } from '@squoosh-kit/imagequant';
import { encode } from '@squoosh-kit/png';

// Quantize to 256 colors
const quantized = await quantize(iconImage, { numColors: 256, dither: 1.0 });

// Encode the quantized data to PNG
const png = await encode(quantized);

// The resulting PNG will be much smaller than encoding full-color directly
```

**Batch optimize icons with limited palette**

```typescript
const quantizer = createImagequantQuantizer('worker');

try {
  const optimized = await Promise.all(
    icons.map((icon) => quantizer(icon, { numColors: 32, dither: 0.8 }))
  );
  // Encode and save each...
} finally {
  await quantizer.terminate();
}
```

## API Reference

### `quantize(image, options?, signal?)`

Reduces an image to a limited color palette using ImageQuant's lossy quantization algorithm.

- `image` - `ImageInput` object with your pixel data
- `options` - (optional) `ImagequantOptions` for quality and palette settings
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<{ data: Uint8ClampedArray; width: number; height: number }>` with the quantized pixel data

**Note**: `quantize()` uses a global singleton worker. For long-running applications where worker cleanup is important, use `createImagequantQuantizer()` instead.

### `createImagequantQuantizer(mode?)`

Creates a reusable quantizer. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `quantize()`

## Cancellation Support

To cancel a quantization in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

const quantizePromise = quantize(
  imageData,
  { numColors: 256 },
  controller.signal
);
setTimeout(() => controller.abort(), 10000);

try {
  const result = await quantizePromise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Quantization was cancelled');
  }
}
```

## Input Validation

All inputs are automatically validated before processing:

```typescript
// Will throw TypeError: image must be an object
await quantize(null);

// Will throw TypeError: image.data must be Uint8Array or Uint8ClampedArray
await quantize({ data: [0, 0, 0, 255], width: 32, height: 32 });

// Will throw RangeError: image.data too small
await quantize({ data: new Uint8Array(100), width: 800, height: 600 });
```

### Package Size

**Size breakdown:**

- JavaScript code: ~4-6KB gzipped
- TypeScript definitions: ~2KB
- WASM binary: ~15-25KB gzipped

### Worker Cleanup

When using worker mode, clean up when done:

```typescript
const quantizer = createImagequantQuantizer('worker');

try {
  const quantized = await quantizer(imageData, { numColors: 256 });
} finally {
  await quantizer.terminate();
}
```

### `ImagequantOptions`

```typescript
type ImagequantOptions = {
  numColors?: number; // 2–256, palette size (default: 256)
  dither?: number; // 0–1, dithering strength (default: 1.0)
  zx?: boolean; // Use auto color count (default: false)
};
```

- `numColors` — How many colors to include in the palette. Fewer colors = smaller file, lower quality.
  - `256` — Maximum palette (best quality)
  - `64-128` — Good tradeoff for illustrations
  - `2-32` — Very small palettes; noticeable quality loss on complex images
- `dither` — Controls Floyd-Steinberg dithering, which approximates missing colors with patterns.
  - `1.0` — Maximum dithering (best visual quality)
  - `0.0` — No dithering (banding visible on gradients)
- `zx` — When `true`, ImageQuant automatically determines the optimal color count instead of using `numColors`.

## Performance Tips

- **Use workers for UI apps** - Keeps your interface responsive
- **Use client mode for servers** - Avoids worker overhead for batch processing
- **More colors = better quality** - Start with 256 and reduce if file size is still too large
- **Dithering improves perceived quality** - Leave at `1.0` unless you specifically need hard edges
- **Pair with OxiPNG** - After quantizing, run through `@squoosh-kit/oxipng` for additional compression

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
