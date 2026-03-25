# @squoosh-kit/png

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fpng.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fpng)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/png`) is one of those modules.

**Directly from the Source**
We don't modify the core PNG codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/png` allows you to add lossless PNG encoding and decoding to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/png
# or
npm install @squoosh-kit/png
```

## Quick Start

```typescript
import { encode, decode, createPngEncoder } from '@squoosh-kit/png';
import type { ImageInput } from '@squoosh-kit/png';

// Your image data - from a file, canvas, or anywhere
const imageData: ImageInput = {
  data: imageBuffer,
  width: 800,
  height: 600,
};

// Encode to PNG (lossless, no options needed)
const pngBuffer = await encode(imageData);

// Decode a PNG back to raw pixel data
const rawImage = await decode(existingPng);

// For multiple images, create a persistent encoder
const encoder = createPngEncoder('worker');
const png = await encoder(imageData);
await encoder.terminate();
```

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `encode(imageData, signal?)` - Encode raw pixel data to PNG format
- `decode(data, signal?)` - Decode a PNG file to raw pixel data
- `createPngEncoder(mode?)` - Create a reusable encoder function
- `createPngDecoder(mode?)` - Create a reusable decoder function
- `ImageInput` type - Input image data structure
- `PngEncoderFactory` type - Type for reusable encoder functions
- `PngDecoderFactory` type - Type for reusable decoder functions

## Real-World Examples

**Save canvas content as PNG**

```typescript
// From a browser canvas
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

const pngBuffer = await encode({
  data: imageData.data,
  width: canvas.width,
  height: canvas.height,
});

// Download in the browser
const blob = new Blob([pngBuffer], { type: 'image/png' });
const url = URL.createObjectURL(blob);
```

**Batch PNG processing with timeout**

```typescript
const encoder = createPngEncoder('worker');
const controller = new AbortController();
setTimeout(() => controller.abort(), 60000);

try {
  const results = await Promise.all(
    images.map((img) => encoder(img, controller.signal))
  );
  // Save results...
} finally {
  await encoder.terminate();
}
```

## API Reference

### `encode(imageData, signal?)`

Encodes raw RGBA pixel data to PNG format. PNG is always lossless — the encoded output is a pixel-perfect representation of the input.

- `imageData` - `ImageInput` object with your pixel data
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<Uint8Array>` with the encoded PNG data

### `decode(data, signal?)`

Decodes a PNG file back to raw RGBA pixel data.

- `data` - `Uint8Array` containing the PNG file bytes
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<ImageData>` with decoded pixel data, width, and height

### `createPngEncoder(mode?)`

Creates a reusable encoder. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `encode()`

### `createPngDecoder(mode?)`

Creates a reusable decoder. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `decode()`

## Cancellation Support

To cancel an operation in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

const encodePromise = encode(imageData, controller.signal);

// Cancel after 5 seconds if still running
setTimeout(() => controller.abort(), 5000);

try {
  const result = await encodePromise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Encoding was cancelled');
  }
}
```

**Important**: If no signal is provided, the operation cannot be cancelled. It will run to completion.

## Input Validation

All inputs are automatically validated before processing:

```typescript
// Will throw TypeError: image must be an object
await encode(null);

// Will throw TypeError: image.data must be Uint8Array or Uint8ClampedArray
await encode({ data: [0, 0, 0, 255], width: 32, height: 32 });

// Will throw RangeError: image.data too small
// (needs width * height * 4 bytes)
await encode({ data: new Uint8Array(100), width: 800, height: 600 });
```

All validation happens synchronously before WASM processing, so you get errors immediately.

### Package Size

This package includes a WebAssembly binary for the PNG codec (~15-20KB gzipped). PNG encoding is lossless and uses the libpng-based WASM from Squoosh.

**Size breakdown:**

- JavaScript code: ~4-6KB gzipped
- TypeScript definitions: ~2KB
- WASM binary: ~15-20KB gzipped

### Worker Cleanup

When using worker mode (`createPngEncoder('worker')`), always clean up the worker when done:

```typescript
const encoder = createPngEncoder('worker');

try {
  const pngData = await encoder(imageData);
  // Use the encoded data...
} finally {
  await encoder.terminate();
}
```

**Note**: In client mode (`createPngEncoder('client')`), `terminate()` is a no-op. It's always safe to call for consistency.

## Performance Tips

- **Use workers for UI apps** - Keeps your interface responsive during encoding
- **Use client mode for servers** - Direct encoding without worker overhead
- **Batch with persistent encoders** - More efficient than one-off calls
- **PNG is lossless** - File sizes are larger than AVIF/WebP/MozJPEG; use OxiPNG to optimize afterwards

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
