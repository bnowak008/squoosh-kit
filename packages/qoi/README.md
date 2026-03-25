# @squoosh-kit/qoi

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fqoi.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fqoi)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/qoi`) is one of those modules.

**Directly from the Source**
We don't modify the core QOI codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/qoi` allows you to add QOI encoding and decoding to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/qoi
# or
npm install @squoosh-kit/qoi
```

## Quick Start

```typescript
import { encode, decode, createQoiEncoder } from '@squoosh-kit/qoi';
import type { ImageInput } from '@squoosh-kit/qoi';

// Your image data - from a file, canvas, or anywhere
const imageData: ImageInput = {
  data: imageBuffer,
  width: 800,
  height: 600,
};

// Encode to QOI (lossless, extremely fast)
const qoiBuffer = await encode(imageData);

// Decode a QOI file back to raw pixel data
const rawImage = await decode(existingQoi);

// For multiple images, create a persistent encoder
const encoder = createQoiEncoder('worker');
const qoi = await encoder(imageData);
await encoder.terminate();
```

## What is QOI?

QOI (Quite OK Image format) is a fast, lossless image format designed as a simpler alternative to PNG. It trades slightly larger file sizes for dramatically faster encode/decode speed — often 20-50x faster than PNG. QOI is a good fit for:

- Image pipelines where speed matters more than file size
- Intermediate storage between processing steps
- Applications that need lossless quality with minimal CPU overhead

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `encode(image, signal?)` - Encode raw pixel data to QOI format
- `decode(data, signal?)` - Decode a QOI file to raw pixel data
- `createQoiEncoder(mode?)` - Create a reusable encoder function
- `createQoiDecoder(mode?)` - Create a reusable decoder function
- `ImageInput` type - Input image data structure
- `QoiEncoderFactory` type - Type for reusable encoder functions
- `QoiDecoderFactory` type - Type for reusable decoder functions

## Real-World Examples

**Fast intermediate storage in a processing pipeline**

```typescript
// Step 1: decode source image
const source = await decode(inputPng);

// Step 2: process (resize, filter, etc.)
const processed = await someProcessingStep(source);

// Step 3: store as QOI for fast re-reads
const qoiBuffer = await encode(processed);
await writeFile('intermediate.qoi', qoiBuffer);

// Later: fast reload
const reloaded = await decode(await readFile('intermediate.qoi'));
```

**Batch conversion with cancellation**

```typescript
const encoder = createQoiEncoder('client'); // Direct encoding, no worker
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000);

try {
  for (const imageData of images) {
    const qoiData = await encoder(imageData, controller.signal);
    await writeFile(`output.qoi`, qoiData);
  }
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Batch cancelled');
  }
} finally {
  await encoder.terminate();
}
```

## API Reference

### `encode(image, signal?)`

Encodes raw RGBA pixel data to QOI format. QOI is always lossless.

- `image` - `ImageInput` object with your pixel data
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<Uint8Array>` with the encoded QOI data

### `decode(data, signal?)`

Decodes a QOI file back to raw RGBA pixel data.

- `data` - `BufferSource` containing the QOI file bytes
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<ImageData>` with decoded pixel data, width, and height

### `createQoiEncoder(mode?)`

Creates a reusable encoder. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `encode()`

### `createQoiDecoder(mode?)`

Creates a reusable decoder. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `decode()`

## Cancellation Support

To cancel an operation in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

const encodePromise = encode(imageData, controller.signal);
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
await encode({ data: new Uint8Array(100), width: 800, height: 600 });
```

All validation happens synchronously before WASM processing.

### Package Size

This package includes a WebAssembly binary for the QOI codec (~10-15KB gzipped).

**Size breakdown:**

- JavaScript code: ~4-6KB gzipped
- TypeScript definitions: ~2KB
- WASM binary: ~10-15KB gzipped

### Worker Cleanup

When using worker mode, always clean up when done:

```typescript
const encoder = createQoiEncoder('worker');

try {
  const qoiData = await encoder(imageData);
} finally {
  await encoder.terminate();
}
```

**Note**: In client mode, `terminate()` is a no-op. It's always safe to call for consistency.

## Performance Tips

- **QOI shines in pipelines** - Use it for intermediate steps where you need fast lossless storage
- **Use client mode for servers** - QOI is already fast; worker overhead can exceed encode time for small images
- **Compare to PNG** - QOI files are slightly larger but encode/decode significantly faster

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
