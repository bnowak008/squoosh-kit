# @squoosh-kit/mozjpeg

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fmozjpeg.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fmozjpeg)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/mozjpeg`) is one of those modules.

**Directly from the Source**
We don't modify the core MozJPEG codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/mozjpeg` allows you to add high-quality JPEG encoding and decoding to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/mozjpeg
# or
npm install @squoosh-kit/mozjpeg
```

## Quick Start

```typescript
import { encode, decode, createMozjpegEncoder } from '@squoosh-kit/mozjpeg';
import type { ImageInput, MozjpegEncodeOptions } from '@squoosh-kit/mozjpeg';

const imageData: ImageInput = {
  data: imageBuffer,
  width: 1920,
  height: 1080,
};

// Encode with default settings (quality 75, progressive)
const jpegBuffer = await encode(imageData);

// With custom quality
const highQuality = await encode(imageData, { quality: 90 });

// Decode a JPEG back to raw pixel data
const rawImage = await decode(jpegBuffer);

// For multiple images, create a persistent encoder
const encoder = createMozjpegEncoder();
const result = await encoder(imageData, { quality: 85, progressive: true });
await encoder.terminate();
```

## What is MozJPEG?

MozJPEG is Mozilla's improved JPEG encoder. It produces smaller JPEG files than standard libjpeg at the same visual quality, typically 10–20% smaller with no perceptible difference. It's widely used in image optimization pipelines and is a drop-in replacement for standard JPEG encoding.

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `encode(imageData, options?, signal?)` - Encode an image to JPEG format using MozJPEG
- `decode(data, signal?)` - Decode a JPEG file to raw pixel data
- `createMozjpegEncoder(mode?)` - Create a reusable encoder function
- `createMozjpegDecoder(mode?)` - Create a reusable decoder function
- `ImageInput` type - Input image data structure
- `MozjpegEncodeOptions` type - MozJPEG encoding configuration
- `MozjpegEncoderFactory` type - Type for reusable encoder functions
- `MozjpegDecoderFactory` type - Type for reusable decoder functions

## Real-World Examples

**Upload handler with timeout**

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

try {
  const jpeg = await encode(
    uploadedImage,
    {
      quality: 85,
      progressive: true, // Loads progressively in browsers
    },
    controller.signal
  );

  await saveToStorage('photo.jpg', jpeg);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Encoding timed out');
  }
} finally {
  clearTimeout(timeout);
}
```

**Batch server-side JPEG optimization**

```typescript
const encoder = createMozjpegEncoder('client'); // Direct encoding, no worker

for (const imagePath of imageFiles) {
  const imageData = await loadImage(imagePath);
  const jpegData = await encoder(imageData, {
    quality: 80,
    progressive: true,
    optimize_coding: true,
  });
  await writeFile(`${imagePath}.jpg`, jpegData);
}

await encoder.terminate();
```

## API Reference

### `encode(imageData, options?, signal?)`

Encodes raw RGBA pixel data to JPEG format using MozJPEG.

**Note**: `encode()` uses a global singleton in **auto** mode (worker in the browser, client in Bun/Node). For long-running applications where worker cleanup is important, use `createMozjpegEncoder()` instead.

- `imageData` - `ImageInput` object with your pixel data
- `options` - (optional) `MozjpegEncodeOptions` for quality and compression settings
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<Uint8Array>` with the encoded JPEG data

### `decode(data, signal?)`

Decodes a JPEG file back to raw RGBA pixel data.

- `data` - `BufferSource` containing the JPEG file bytes
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<ImageData>` with decoded pixel data, width, and height

### `createMozjpegEncoder(mode?)`

Creates a reusable encoder. More efficient for processing multiple images.

- `mode` - (optional) `'auto'`, `'worker'`, or `'client'`; defaults to `'auto'` (worker in the browser main thread, client in Bun/Node)
- **Returns** - A function with the same signature as `encode()`

### `createMozjpegDecoder(mode?)`

Creates a reusable decoder.

- `mode` - (optional) `'auto'`, `'worker'`, or `'client'`; defaults to `'auto'` (worker in the browser main thread, client in Bun/Node)
- **Returns** - A function with the same signature as `decode()`

## Cancellation Support

To cancel an encoding operation in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

const encodePromise = encode(imageData, { quality: 85 }, controller.signal);
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
await encode(null, { quality: 85 });

// Will throw TypeError: image.data must be Uint8Array or Uint8ClampedArray
await encode({ data: [0, 0, 0, 255], width: 32, height: 32 }, { quality: 85 });

// Will throw RangeError: image.data too small
await encode(
  { data: new Uint8Array(100), width: 800, height: 600 },
  { quality: 85 }
);
```

### Package Size

**Size breakdown:**

- JavaScript code: ~5-8KB gzipped
- TypeScript definitions: ~3KB
- WASM binaries: ~40-50KB gzipped

### Worker Cleanup

When using worker mode, always clean up the worker when done:

```typescript
const encoder = createMozjpegEncoder('worker');

try {
  const jpegData = await encoder(imageData, { quality: 85 });
} finally {
  await encoder.terminate();
}
```

**Note**: In client mode, `terminate()` is a no-op. It's always safe to call for consistency.

### `MozjpegEncodeOptions`

```typescript
type MozjpegEncodeOptions = {
  quality?: number; // 0–100, visual quality (default: 75)
  baseline?: boolean; // Use baseline instead of progressive JPEG (default: false)
  arithmetic?: boolean; // Use arithmetic coding (default: false)
  progressive?: boolean; // Enable progressive encoding (default: true)
  optimize_coding?: boolean; // Optimize Huffman coding tables (default: true)
  smoothing?: number; // 0–100, pre-encode smoothing (default: 0)
  color_space?: MozJpegColorSpace; // Color space: GRAYSCALE, RGB, YCbCr (default: YCbCr)
  quant_table?: number; // Quantization table preset, 0–8 (default: 3)
  trellis_multipass?: boolean; // Multi-pass trellis quantization (default: false)
  trellis_opt_zero?: boolean; // Optimize trellis zero coefficients (default: false)
  trellis_opt_table?: boolean; // Optimize trellis quantization table (default: false)
  trellis_loops?: number; // Trellis quantization passes, 1–50 (default: 1)
  auto_subsample?: boolean; // Auto chroma subsampling (default: true)
  chroma_subsample?: number; // Chroma subsampling level (default: 2)
  separate_chroma_quality?: boolean; // Enable separate chroma quality (default: false)
  chroma_quality?: number; // 0–100, chroma quality when separate (default: 75)
};
```

**Key options:**

- `quality` — Primary quality control. `75–85` is a good range for most photos.
- `progressive` — Progressive JPEGs load gradually in browsers (low-res → high-res). Usually a good default.
- `optimize_coding` — Slightly improves compression with no quality tradeoff. Leave enabled.
- `trellis_multipass` — More aggressive optimization pass; produces smaller files at the cost of encoding time.

## Performance Tips

- **Quality 75–85 is the sweet spot** — Near-indistinguishable from higher quality at significantly smaller file size
- **Use progressive for web** — Better user experience; browsers can show a rough preview immediately
- **Auto mode in Bun/Node** - Runs on the main thread without worker overhead — Avoids worker overhead in Node/Bun scripts
- **MozJPEG vs WebP vs AVIF** — MozJPEG is best for maximum JPEG compatibility; for modern browsers, WebP or AVIF will be smaller

## Encoding Quality & File Size

MozJPEG produces consistently smaller files than standard JPEG encoders at the same quality setting:

- **Quality 80–100** — High fidelity, minimal artifacts
- **Quality 60–80** — Good quality for most photos, significant size savings
- **Quality 40–60** — Visible compression artifacts; useful only for thumbnails or previews
- **Quality 0–40** — Heavy compression; noticeable degradation

At quality 80, MozJPEG files are typically **10–20% smaller** than libjpeg output at the same setting.

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

The `@squoosh-kit/mozjpeg` source code is licensed under the **MIT License** — see [LICENSE](https://github.com/bnowak008/squoosh-kit/blob/main/LICENSE).

The WebAssembly binaries distributed with this package are compiled from [Google Squoosh](https://github.com/GoogleChromeLabs/squoosh) and are licensed under the **Apache License 2.0** — see [NOTICE](https://github.com/bnowak008/squoosh-kit/blob/main/NOTICE) for the full attribution and license text.

The two licenses are compatible — both are permissive and allow commercial use.
<!-- END:SQUOOSH-KIT-LICENSE -->
