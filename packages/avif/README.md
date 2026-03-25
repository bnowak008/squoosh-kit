# @squoosh-kit/avif

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Favif.svg)](https://badge.fury.io/js/%40squoosh-kit%2Favif)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/avif`) is one of those modules.

**Directly from the Source**
We don't modify the core AVIF codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/avif` allows you to add AVIF encoding and decoding to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/avif
# or
npm install @squoosh-kit/avif
```

## Quick Start

```typescript
import { encode, decode, createAvifEncoder, AVIFTune } from '@squoosh-kit/avif';
import type { ImageInput, AvifEncodeOptions } from '@squoosh-kit/avif';

const imageData: ImageInput = {
  data: imageBuffer,
  width: 1920,
  height: 1080,
};

// Quick encode with default settings
const avifBuffer = await encode(imageData, { quality: 60 });

// With cancellation support
const controller = new AbortController();
const avif = await encode(
  imageData,
  { quality: 60, speed: 6 },
  controller.signal
);

// Decode AVIF back to raw pixel data
const rawImage = await decode(avifBuffer);

// For multiple images, create a persistent encoder
const encoder = createAvifEncoder('worker');
const result = await encoder(imageData, { quality: 70, tune: AVIFTune.ssim });
await encoder.terminate();
```

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `encode(imageData, options?, signal?)` - Encode an image to AVIF format
- `decode(data, signal?)` - Decode an AVIF file to raw pixel data
- `createAvifEncoder(mode?)` - Create a reusable encoder function
- `createAvifDecoder(mode?)` - Create a reusable decoder function
- `AVIFTune` - Tuning mode enum (`auto`, `psnr`, `ssim`)
- `ImageInput` type - Input image data structure
- `AvifEncodeOptions` type - AVIF encoding configuration
- `AvifEncoderFactory` type - Type for reusable encoder functions
- `AvifDecoderFactory` type - Type for reusable decoder functions

## Real-World Examples

**Serve optimized images to modern browsers**

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

try {
  const avif = await encode(
    uploadedImage,
    {
      quality: 60, // Good quality for most photos
      speed: 6, // Faster encoding; lower = smaller files but slower
    },
    controller.signal
  );

  await saveToStorage('image.avif', avif);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Encoding timed out');
  }
} finally {
  clearTimeout(timeout);
}
```

**Batch conversion with quality tuning**

```typescript
const encoder = createAvifEncoder('client'); // Direct encoding on the server

for (const imagePath of imageFiles) {
  const imageData = await loadImage(imagePath);
  const avifData = await encoder(imageData, {
    quality: 65,
    qualityAlpha: 80,
    speed: 8,
  });
  await writeFile(`${imagePath}.avif`, avifData);
}

await encoder.terminate();
```

## API Reference

### `encode(imageData, options?, signal?)`

Encodes raw RGBA pixel data to AVIF format.

**Note**: `encode()` uses a global singleton worker. For long-running applications where worker cleanup is important, use `createAvifEncoder()` instead.

- `imageData` - `ImageInput` object with your pixel data
- `options` - (optional) `AvifEncodeOptions` for quality and compression settings
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<Uint8Array>` with the encoded AVIF data

### `decode(data, signal?)`

Decodes an AVIF file back to raw RGBA pixel data.

- `data` - `BufferSource` containing the AVIF file bytes
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<ImageData>` with decoded pixel data, width, and height

### `createAvifEncoder(mode?)`

Creates a reusable encoder. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `encode()`

### `createAvifDecoder(mode?)`

Creates a reusable decoder.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `decode()`

## Cancellation Support

To cancel an encoding operation in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

const encodePromise = encode(imageData, { quality: 60 }, controller.signal);
setTimeout(() => controller.abort(), 5000);

try {
  const result = await encodePromise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Encoding was cancelled');
  }
}
```

**Important**: If no signal is provided, the encoding operation cannot be cancelled.

## Input Validation

All inputs are automatically validated before processing:

```typescript
// Will throw TypeError: image must be an object
await encode(null, { quality: 60 });

// Will throw TypeError: image.data must be Uint8Array or Uint8ClampedArray
await encode({ data: [0, 0, 0, 255], width: 32, height: 32 }, { quality: 60 });

// Will throw RangeError: image.data too small
await encode(
  { data: new Uint8Array(100), width: 800, height: 600 },
  { quality: 60 }
);
```

### Package Size

This package includes WebAssembly binaries for the AVIF codec (~60-80KB gzipped). AVIF encoding is computationally expensive; the WASM binary includes the full libaom encoder.

**Size breakdown:**

- JavaScript code: ~5-8KB gzipped
- TypeScript definitions: ~3KB
- WASM binaries: ~60-80KB gzipped (multi-threaded variants included)

### Worker Cleanup

When using worker mode, always clean up the worker when done to prevent memory leaks:

```typescript
const encoder = createAvifEncoder('worker');

try {
  const avifData = await encoder(imageData, { quality: 60 });
} finally {
  await encoder.terminate();
}
```

**Note**: In client mode, `terminate()` is a no-op. It's always safe to call for consistency.

### `AvifEncodeOptions`

```typescript
type AvifEncodeOptions = {
  quality?: number; // 0–100, visual quality (default: 60)
  qualityAlpha?: number; // 0–100, alpha channel quality (default: 60)
  denoiseLevel?: number; // 0–50, pre-encode denoising (default: 0)
  tileRowsLog2?: number; // 0–6, tile rows as power of 2 (default: 0)
  tileColsLog2?: number; // 0–6, tile columns as power of 2 (default: 0)
  speed?: number; // 0–10, encoding speed (default: 6, lower = better compression)
  subsample?: number; // Chroma subsampling (default: 1)
  chromaDeltaQ?: boolean; // Use chroma delta quantization (default: false)
  sharpness?: number; // 0–7, sharpness filter (default: 0)
  enableSharpYUV?: boolean; // Use sharp YUV conversion (default: false)
  tune?: AVIFTune; // Tuning mode: auto, psnr, or ssim (default: auto)
};
```

**Key options:**

- `quality` — Primary quality control. `60` is a good starting point for photos. Lower values produce smaller, lower-quality files.
- `speed` — Encoding effort. `0` = maximum compression (very slow); `10` = fastest (larger files). `6` is a practical default.
- `tune` — Metric to optimize for: `AVIFTune.auto` (default), `AVIFTune.psnr` (signal fidelity), or `AVIFTune.ssim` (structural similarity).

## Performance Tips

- **AVIF is slow to encode** — Use workers or client mode with server-side encoding; expect several seconds for large images at low speed settings
- **Speed 6–8 for real-time** — Speeds below 4 are typically too slow for interactive use
- **AVIF produces excellent quality** — At equivalent visual quality, AVIF files are typically 30-50% smaller than WebP
- **Batch with persistent encoders** — Amortizes WASM initialization cost across multiple encodes

## Encoding Quality & File Size

AVIF uses AV1 video compression applied to still images:

- **Quality 80–100** — Near-lossless, very large files
- **Quality 60–80** — High quality, significantly smaller than PNG/JPEG
- **Quality 40–60** — Good quality for photos, very compact
- **Quality 0–40** — Visible artifacts; useful only for very small thumbnails

At quality 60 with default settings, AVIF files are typically **50–70% smaller** than equivalent-quality JPEG.

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
