# @squoosh-kit/core

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fcore.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fcore)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project.

**Directly from the Source**
We don't modify the core codecs. The WebAssembly (`.wasm`) binaries are taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around these codecs. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
While this `core` package bundles everything for convenience, the Squoosh-Kit philosophy is to provide small, focused packages so you only install what you need. See the [Related Packages](#related-packages) section to use a specific codec directly.

## Installation

```bash
bun add @squoosh-kit/core
# or
npm install @squoosh-kit/core
```

## Quick Start

All codecs are namespaced to avoid collisions — multiple packages export `encode` and `decode`, so they live under their own namespace:

```typescript
import { webp, avif, mozjpeg, resize, png, rotate } from '@squoosh-kit/core';
import type { ImageInput } from '@squoosh-kit/core';

const imageData: ImageInput = {
  data: rawPixelBuffer,
  width: 1920,
  height: 1080,
};

// Encode to WebP
const webpBuffer = await webp.encode(imageData, { quality: 85 });

// Encode to AVIF
const avifBuffer = await avif.encode(imageData, { quality: 60 });

// Resize first, then encode
const resized = await resize.resize(imageData, { width: 800, height: 600 });
const thumbnail = await mozjpeg.encode(resized, { quality: 80 });

// Lossless PNG
const pngBuffer = await png.encode(imageData);

// Rotate 90 degrees
const rotated = await rotate.rotate(imageData, { rotate: 90 });
```

## Browser (Vite)

Add [`@squoosh-kit/vite-plugin`](https://www.npmjs.com/package/@squoosh-kit/vite-plugin) so worker and WASM files are copied to `public/squoosh-kit/`. In the browser, **auto** mode uses workers and loads from `/squoosh-kit` by default — `encode()`, `createWebpEncoder()`, and the other factories do not need `assetPath` unless you serve those files from a different URL.

## What's Included

This package bundles all Squoosh-Kit codecs under a single import:

<!-- BEGIN:SQUOOSH-KIT-CORE-INCLUDED -->
| Namespace    | Package                                                                            | Purpose                              |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------ |
| `webp`       | [`@squoosh-kit/webp`](https://www.npmjs.com/package/@squoosh-kit/webp)             | WebP encoding/decoding               |
| `avif`       | [`@squoosh-kit/avif`](https://www.npmjs.com/package/@squoosh-kit/avif)             | AVIF encoding/decoding               |
| `mozjpeg`    | [`@squoosh-kit/mozjpeg`](https://www.npmjs.com/package/@squoosh-kit/mozjpeg)       | Optimized JPEG encoding/decoding     |
| `jxl`        | [`@squoosh-kit/jxl`](https://www.npmjs.com/package/@squoosh-kit/jxl)               | JPEG XL encoding/decoding            |
| `wp2`        | [`@squoosh-kit/wp2`](https://www.npmjs.com/package/@squoosh-kit/wp2)               | WP2 encoding/decoding (experimental) |
| `png`        | [`@squoosh-kit/png`](https://www.npmjs.com/package/@squoosh-kit/png)               | Lossless PNG encoding/decoding       |
| `qoi`        | [`@squoosh-kit/qoi`](https://www.npmjs.com/package/@squoosh-kit/qoi)               | QOI lossless encoding/decoding       |
| `resize`     | [`@squoosh-kit/resize`](https://www.npmjs.com/package/@squoosh-kit/resize)         | High-quality image resizing          |
| `rotate`     | [`@squoosh-kit/rotate`](https://www.npmjs.com/package/@squoosh-kit/rotate)         | 90°/180°/270° rotation               |
| `oxipng`     | [`@squoosh-kit/oxipng`](https://www.npmjs.com/package/@squoosh-kit/oxipng)         | Lossless PNG optimization            |
| `imagequant` | [`@squoosh-kit/imagequant`](https://www.npmjs.com/package/@squoosh-kit/imagequant) | Palette quantization (PNG-8)         |
| `hqx`        | [`@squoosh-kit/hqx`](https://www.npmjs.com/package/@squoosh-kit/hqx)               | Pixel-art upscaling (2x/3x/4x)       |
| `visdif`     | [`@squoosh-kit/visdif`](https://www.npmjs.com/package/@squoosh-kit/visdif)         | Butteraugli perceptual comparison    |
<!-- END:SQUOOSH-KIT-CORE-INCLUDED -->

## When to Use Core vs Individual Packages

**Use `@squoosh-kit/core` when:**

- You need multiple codecs and want a single import
- You're exploring the library and want everything available
- Bundle size is not a concern (e.g., server-side tooling)

**Use individual packages when:**

- You only need one specific codec
- Bundle size is critical (install only `@squoosh-kit/webp`, `@squoosh-kit/avif`, etc.)
- You need fine-grained control over versions

## API Reference

All functions follow the same patterns as the individual packages. For detailed documentation including options, examples, and edge cases, see the individual package READMEs:

- [WebP](https://www.npmjs.com/package/@squoosh-kit/webp) — `encode`, `decode`, `createWebpEncoder`, `createWebpDecoder`
- [AVIF](https://www.npmjs.com/package/@squoosh-kit/avif) — `encode`, `decode`, `createAvifEncoder`, `createAvifDecoder`, `AVIFTune`
- [MozJPEG](https://www.npmjs.com/package/@squoosh-kit/mozjpeg) — `encode`, `decode`, `createMozjpegEncoder`, `createMozjpegDecoder`
- [JPEG XL](https://www.npmjs.com/package/@squoosh-kit/jxl) — `encode`, `decode`, `createJxlEncoder`, `createJxlDecoder`
- [WP2](https://www.npmjs.com/package/@squoosh-kit/wp2) — `encode`, `decode`, `createWp2Encoder`, `createWp2Decoder`, `UVMode`, `Csp`
- [PNG](https://www.npmjs.com/package/@squoosh-kit/png) — `encode`, `decode`, `createPngEncoder`, `createPngDecoder`
- [QOI](https://www.npmjs.com/package/@squoosh-kit/qoi) — `encode`, `decode`, `createQoiEncoder`, `createQoiDecoder`
- [Resize](https://www.npmjs.com/package/@squoosh-kit/resize) — `resize`, `createResizer`
- [Rotate](https://www.npmjs.com/package/@squoosh-kit/rotate) — `rotate`, `createRotator`
- [OxiPNG](https://www.npmjs.com/package/@squoosh-kit/oxipng) — `optimize`, `createOxipngOptimizer`
- [ImageQuant](https://www.npmjs.com/package/@squoosh-kit/imagequant) — `quantize`, `createImagequantQuantizer`
- [HQX](https://www.npmjs.com/package/@squoosh-kit/hqx) — `upscale`, `createHqxUpscaler`
- [VisDif](https://www.npmjs.com/package/@squoosh-kit/visdif) — `compare`, `createVisDiff`

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

## License

MIT - part of the Squoosh-Kit family
