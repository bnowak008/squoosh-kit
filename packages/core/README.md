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
While this `core` package bundles everything for convenience, the Squoosh-Kit philosophy is to provide small, focused packages so you only install what you need. See the [Individual Packages](#individual-packages) section to use a specific codec directly.

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

## What's Included

This package bundles all Squoosh-Kit codecs under a single import:

| Namespace    | Package                   | Purpose                              |
| ------------ | ------------------------- | ------------------------------------ |
| `webp`       | `@squoosh-kit/webp`       | WebP encoding/decoding               |
| `avif`       | `@squoosh-kit/avif`       | AVIF encoding/decoding               |
| `mozjpeg`    | `@squoosh-kit/mozjpeg`    | Optimized JPEG encoding/decoding     |
| `jxl`        | `@squoosh-kit/jxl`        | JPEG XL encoding/decoding            |
| `wp2`        | `@squoosh-kit/wp2`        | WP2 encoding/decoding (experimental) |
| `png`        | `@squoosh-kit/png`        | Lossless PNG encoding/decoding       |
| `qoi`        | `@squoosh-kit/qoi`        | QOI lossless encoding/decoding       |
| `resize`     | `@squoosh-kit/resize`     | High-quality image resizing          |
| `rotate`     | `@squoosh-kit/rotate`     | 90°/180°/270° rotation               |
| `oxipng`     | `@squoosh-kit/oxipng`     | Lossless PNG optimization            |
| `imagequant` | `@squoosh-kit/imagequant` | Palette quantization (PNG-8)         |
| `hqx`        | `@squoosh-kit/hqx`        | Pixel-art upscaling (2x/3x/4x)       |
| `visdif`     | `@squoosh-kit/visdif`     | Butteraugli perceptual comparison    |

## When to Use Core vs Individual Packages

**Use `@squoosh-kit/core` when:**

- You need multiple codecs and want a single import
- You're exploring the library and want everything available
- Bundle size is not a concern (e.g., server-side tooling)

**Use individual packages when:**

- You only need one specific codec
- Bundle size is critical (install only `@squoosh-kit/webp`, `@squoosh-kit/avif`, etc.)
- You need fine-grained control over versions

## Individual Packages

Each codec is available as a standalone package on npm:

| Package                    | npm                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `@squoosh-kit/webp`        | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fwebp.svg)](https://www.npmjs.com/package/@squoosh-kit/webp)               |
| `@squoosh-kit/avif`        | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Favif.svg)](https://www.npmjs.com/package/@squoosh-kit/avif)               |
| `@squoosh-kit/mozjpeg`     | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fmozjpeg.svg)](https://www.npmjs.com/package/@squoosh-kit/mozjpeg)         |
| `@squoosh-kit/jxl`         | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fjxl.svg)](https://www.npmjs.com/package/@squoosh-kit/jxl)                 |
| `@squoosh-kit/wp2`         | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fwp2.svg)](https://www.npmjs.com/package/@squoosh-kit/wp2)                 |
| `@squoosh-kit/png`         | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fpng.svg)](https://www.npmjs.com/package/@squoosh-kit/png)                 |
| `@squoosh-kit/qoi`         | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fqoi.svg)](https://www.npmjs.com/package/@squoosh-kit/qoi)                 |
| `@squoosh-kit/resize`      | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fresize.svg)](https://www.npmjs.com/package/@squoosh-kit/resize)           |
| `@squoosh-kit/rotate`      | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Frotate.svg)](https://www.npmjs.com/package/@squoosh-kit/rotate)           |
| `@squoosh-kit/oxipng`      | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Foxipng.svg)](https://www.npmjs.com/package/@squoosh-kit/oxipng)           |
| `@squoosh-kit/imagequant`  | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fimagequant.svg)](https://www.npmjs.com/package/@squoosh-kit/imagequant)   |
| `@squoosh-kit/hqx`         | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fhqx.svg)](https://www.npmjs.com/package/@squoosh-kit/hqx)                 |
| `@squoosh-kit/visdif`      | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fvisdif.svg)](https://www.npmjs.com/package/@squoosh-kit/visdif)           |
| `@squoosh-kit/runtime`     | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fruntime.svg)](https://www.npmjs.com/package/@squoosh-kit/runtime)         |
| `@squoosh-kit/vite-plugin` | [![npm](https://badge.fury.io/js/%40squoosh-kit%2Fvite-plugin.svg)](https://www.npmjs.com/package/@squoosh-kit/vite-plugin) |

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

## License

MIT - part of the Squoosh-Kit family
