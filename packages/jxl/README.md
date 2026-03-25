# @squoosh-kit/jxl

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fjxl.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fjxl)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/jxl`) is one of those modules.

**Directly from the Source**
We don't modify the core JPEG XL codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/jxl` allows you to add JPEG XL encoding and decoding to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/jxl
# or
npm install @squoosh-kit/jxl
```

## Quick Start

```typescript
import { encode, decode, createJxlEncoder } from '@squoosh-kit/jxl';
import type { ImageInput, JxlEncodeOptions } from '@squoosh-kit/jxl';

const imageData: ImageInput = {
  data: imageBuffer,
  width: 1920,
  height: 1080,
};

// Encode with default settings
const jxlBuffer = await encode(imageData, { quality: 75 });

// With cancellation support
const controller = new AbortController();
const jxl = await encode(
  imageData,
  { quality: 75, effort: 7 },
  controller.signal
);

// Decode JXL back to raw pixel data
const rawImage = await decode(jxlBuffer);

// For multiple images, create a persistent encoder
const encoder = createJxlEncoder('worker');
const result = await encoder(imageData, { quality: 80, progressive: true });
await encoder.terminate();
```

## What is JPEG XL?

JPEG XL (JXL) is a next-generation image format designed to replace JPEG. It offers:

- **Better compression than AVIF and WebP** at equivalent visual quality
- **Lossless mode** with better compression than PNG
- **Progressive decoding** for better web loading experience
- **JPEG recompression** — losslessly pack existing JPEGs into JXL with ~20% smaller files

Browser support is growing. JXL is currently supported in Safari 17+ and Chrome with a flag. For maximum compatibility, consider providing a JPEG/WebP fallback.

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `encode(imageData, options?, signal?)` - Encode an image to JPEG XL format
- `decode(data, signal?)` - Decode a JXL file to raw pixel data
- `createJxlEncoder(mode?)` - Create a reusable encoder function
- `createJxlDecoder(mode?)` - Create a reusable decoder function
- `ImageInput` type - Input image data structure
- `JxlEncodeOptions` type - JPEG XL encoding configuration
- `JxlEncoderFactory` type - Type for reusable encoder functions
- `JxlDecoderFactory` type - Type for reusable decoder functions

## Real-World Examples

**High-quality archival encoding**

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 60000);

try {
  const jxl = await encode(
    photoData,
    {
      quality: 90, // High quality for archival
      effort: 9, // Maximum compression effort
      progressive: true,
    },
    controller.signal
  );

  await saveToStorage('archive.jxl', jxl);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Encoding timed out — try a lower effort setting');
  }
}
```

**Fast batch conversion for web delivery**

```typescript
const encoder = createJxlEncoder('client');

for (const imagePath of imageFiles) {
  const imageData = await loadImage(imagePath);
  const jxlData = await encoder(imageData, {
    quality: 75,
    effort: 4, // Faster encoding for bulk conversion
  });
  await writeFile(`${imagePath}.jxl`, jxlData);
}

await encoder.terminate();
```

## API Reference

### `encode(imageData, options?, signal?)`

Encodes raw RGBA pixel data to JPEG XL format.

**Note**: `encode()` uses a global singleton worker. For long-running applications where worker cleanup is important, use `createJxlEncoder()` instead.

- `imageData` - `ImageInput` object with your pixel data
- `options` - (optional) `JxlEncodeOptions` for quality and compression settings
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<Uint8Array>` with the encoded JXL data

### `decode(data, signal?)`

Decodes a JXL file back to raw RGBA pixel data.

- `data` - `BufferSource` containing the JXL file bytes
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<ImageData>` with decoded pixel data, width, and height

### `createJxlEncoder(mode?)`

Creates a reusable encoder. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `encode()`

### `createJxlDecoder(mode?)`

Creates a reusable decoder.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `decode()`

## Cancellation Support

To cancel an encoding operation in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

const encodePromise = encode(imageData, { quality: 75 }, controller.signal);
setTimeout(() => controller.abort(), 10000);

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
await encode(null, { quality: 75 });

// Will throw TypeError: image.data must be Uint8Array or Uint8ClampedArray
await encode({ data: [0, 0, 0, 255], width: 32, height: 32 }, { quality: 75 });

// Will throw RangeError: image.data too small
await encode(
  { data: new Uint8Array(100), width: 800, height: 600 },
  { quality: 75 }
);
```

### Package Size

**Size breakdown:**

- JavaScript code: ~5-8KB gzipped
- TypeScript definitions: ~3KB
- WASM binaries: ~50-70KB gzipped (multi-threaded and SIMD variants included)

### Worker Cleanup

When using worker mode, always clean up the worker when done:

```typescript
const encoder = createJxlEncoder('worker');

try {
  const jxlData = await encoder(imageData, { quality: 75 });
} finally {
  await encoder.terminate();
}
```

**Note**: In client mode, `terminate()` is a no-op. It's always safe to call for consistency.

### `JxlEncodeOptions`

```typescript
type JxlEncodeOptions = {
  effort?: number; // 1–10, encoding effort (default: 7, lower = faster)
  quality?: number; // 0–100, visual quality (default: 75)
  progressive?: boolean; // Enable progressive decoding (default: false)
  epf?: number; // -1–3, edge-preserving filter (-1 = auto, default: -1)
  lossyPalette?: boolean; // Lossy palette optimization (default: false)
  decodingSpeedTier?: number; // 0–4, optimize for faster decoding (default: 0)
  photonNoiseIso?: number; // 0–50000, add film grain noise (default: 0)
  lossyModular?: boolean; // Use lossy modular mode (default: false)
};
```

**Key options:**

- `quality` — Primary quality control. `75` is a good default. JXL typically achieves better visual quality than AVIF at the same setting.
- `effort` — Encoding effort. `1` = fastest (larger files); `10` = maximum compression (very slow). `7` is a practical default.
- `progressive` — Enables progressive decoding, allowing browsers to show a rough preview before the full image loads.
- `decodingSpeedTier` — Sacrifice some file size for faster client-side decoding. Useful when targeting lower-end devices.

## Performance Tips

- **JXL encodes slower than WebP** — Use effort 4–7 for interactive pipelines; effort 9–10 only for archival
- **Use workers for UI apps** — Encoding at high effort can take 10+ seconds for large images
- **JXL at quality 75 ≈ WebP at quality 85** — JXL achieves better compression at the same perceptual quality
- **Progressive mode costs little** — Enable it for web delivery with minimal size penalty

## Encoding Quality & File Size

- **Quality 85–100** — Near-lossless quality
- **Quality 65–85** — Excellent for general photography
- **Quality 50–65** — Good for thumbnails and previews
- **Quality 0–50** — Heavy compression; visible artifacts

At quality 75 with effort 7, JXL files are typically **20–35% smaller** than equivalent-quality WebP.

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support (JXL decode support varies by browser)
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
