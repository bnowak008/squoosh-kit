# @squoosh-kit/wp2

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fwp2.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fwp2)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/wp2`) is one of those modules.

**Directly from the Source**
We don't modify the core WP2 codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/wp2` allows you to add WP2 encoding and decoding to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/wp2
# or
npm install @squoosh-kit/wp2
```

## Quick Start

```typescript
import {
  encode,
  decode,
  createWp2Encoder,
  UVMode,
  Csp,
} from '@squoosh-kit/wp2';
import type { ImageInput, Wp2EncodeOptions } from '@squoosh-kit/wp2';

const imageData: ImageInput = {
  data: imageBuffer,
  width: 1920,
  height: 1080,
};

// Encode with default settings
const wp2Buffer = await encode(imageData, { quality: 75 });

// Decode WP2 back to raw pixel data
const rawImage = await decode(wp2Buffer);

// With cancellation support
const controller = new AbortController();
const wp2 = await encode(
  imageData,
  { quality: 75, effort: 5 },
  controller.signal
);

// For multiple images, create a persistent encoder
const encoder = createWp2Encoder('worker');
const result = await encoder(imageData, { quality: 80 });
await encoder.terminate();
```

## What is WP2?

WP2 (WebP 2) is an experimental successor to WebP developed by Google. It offers improved compression compared to WebP at the cost of browser compatibility — WP2 has no native browser support and is primarily used for research and experimentation.

WP2 is included in Squoosh-Kit to match the feature set of the Squoosh tool. For production web delivery, consider `@squoosh-kit/webp`, `@squoosh-kit/avif`, or `@squoosh-kit/jxl` instead.

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `encode(imageData, options?, signal?)` - Encode an image to WP2 format
- `decode(data, signal?)` - Decode a WP2 file to raw pixel data
- `createWp2Encoder(mode?)` - Create a reusable encoder function
- `createWp2Decoder(mode?)` - Create a reusable decoder function
- `UVMode` - Chroma subsampling mode enum
- `Csp` - Color space enum
- `ImageInput` type - Input image data structure
- `Wp2EncodeOptions` type - WP2 encoding configuration
- `Wp2EncoderFactory` type - Type for reusable encoder functions
- `Wp2DecoderFactory` type - Type for reusable decoder functions

## Real-World Examples

**Encode with default settings**

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000);

try {
  const wp2 = await encode(
    imageData,
    { quality: 75, effort: 4 },
    controller.signal
  );
  await saveToStorage('image.wp2', wp2);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Encoding timed out');
  }
}
```

**Batch encoding with a persistent encoder**

```typescript
const encoder = createWp2Encoder('client');

for (const imagePath of imageFiles) {
  const imageData = await loadImage(imagePath);
  const wp2Data = await encoder(imageData, { quality: 70, effort: 5 });
  await writeFile(`${imagePath}.wp2`, wp2Data);
}

await encoder.terminate();
```

## API Reference

### `encode(imageData, options?, signal?)`

Encodes raw RGBA pixel data to WP2 format.

**Note**: `encode()` uses a global singleton worker. For long-running applications where worker cleanup is important, use `createWp2Encoder()` instead.

- `imageData` - `ImageInput` object with your pixel data
- `options` - (optional) `Wp2EncodeOptions` for quality and compression settings
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<Uint8Array>` with the encoded WP2 data

### `decode(data, signal?)`

Decodes a WP2 file back to raw RGBA pixel data.

- `data` - `BufferSource` containing the WP2 file bytes
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<ImageData>` with decoded pixel data, width, and height

### `createWp2Encoder(mode?)`

Creates a reusable encoder. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `encode()`

### `createWp2Decoder(mode?)`

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

When using worker mode, always clean up when done:

```typescript
const encoder = createWp2Encoder('worker');

try {
  const wp2Data = await encoder(imageData, { quality: 75 });
} finally {
  await encoder.terminate();
}
```

**Note**: In client mode, `terminate()` is a no-op. It's always safe to call for consistency.

### `Wp2EncodeOptions`

```typescript
type Wp2EncodeOptions = {
  quality?: number; // 0–100, visual quality (default: 75)
  alpha_quality?: number; // 0–100, alpha channel quality (default: 75)
  effort?: number; // 0–9, encoding effort (default: 5, lower = faster)
  pass?: number; // 1–10, number of encoding passes (default: 1)
  sns?: number; // 0–100, spatial noise shaping (default: 50)
  uv_mode?: UVMode; // Chroma subsampling mode (default: UVModeAdapt)
  csp_type?: Csp; // Color space (default: kYCoCg)
  error_diffusion?: number; // 0–100, error diffusion strength (default: 0)
  use_random_matrix?: boolean; // Use random matrix for encoding (default: false)
};
```

**Key options:**

- `quality` — Primary quality control. `75` is a good default.
- `effort` — Encoding effort. `0` = fastest; `9` = best compression. `5` is a practical default.
- `uv_mode` — Chroma subsampling:
  - `UVMode.UVModeAdapt` — Mix of 4:2:0 and 4:4:4 per block (default)
  - `UVMode.UVMode420` — All blocks 4:2:0 (smaller files, less color detail)
  - `UVMode.UVMode444` — All blocks 4:4:4 (larger files, best color)
  - `UVMode.UVModeAuto` — Automatically choose
- `csp_type` — Color space conversion:
  - `Csp.kYCoCg` — YCoCg (default, generally best for WP2)
  - `Csp.kYCbCr` — Standard YCbCr
  - `Csp.kCustom` — Custom color space
  - `Csp.kYIQ` — YIQ color space

## Performance Tips

- **WP2 is experimental** — For production use, prefer WebP, AVIF, or JXL which have browser support
- **Use workers for UI apps** — Encoding at high effort levels can be slow
- **Effort 4–6 is practical** — Good compression without excessive encoding time
- **Batch with persistent encoders** — Amortizes WASM initialization across multiple encodes

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
