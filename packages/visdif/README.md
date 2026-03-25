# @squoosh-kit/visdif

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fvisdif.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fvisdif)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/visdif`) is one of those modules.

**Directly from the Source**
We don't modify the core VisDif codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/visdif` allows you to add perceptual image comparison to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/visdif
# or
npm install @squoosh-kit/visdif
```

## Quick Start

```typescript
import { compare, createVisDiff } from '@squoosh-kit/visdif';
import type { ImageInput } from '@squoosh-kit/visdif';

const original: ImageInput = { data: originalBuffer, width: 800, height: 600 };
const compressed: ImageInput = {
  data: compressedBuffer,
  width: 800,
  height: 600,
};

// Returns a Butteraugli distance score
const distance = await compare(original, compressed);

console.log(distance);
// 0.0 = pixel-identical
// < 1.0 = virtually imperceptible difference
// 1.0–2.0 = minor visible difference
// > 3.0 = noticeable quality loss

// For repeated comparisons, use a persistent instance
const differ = createVisDiff('worker');
const score = await differ(original, compressed);
await differ.terminate();
```

## What is Butteraugli?

Butteraugli is a perceptual image similarity metric developed by Google. Unlike PSNR or SSIM, Butteraugli models the human visual system more accurately — it accounts for how the eye perceives differences in edges, textures, and color transitions.

The score returned is a Butteraugli distance:

- `0.0` — Images are pixel-identical
- `< 1.0` — Differences are imperceptible to most viewers
- `1.0–2.0` — Slight quality degradation, noticeable on close inspection
- `> 3.0` — Visible artifacts; consider increasing codec quality settings

VisDif is a good fit for:

- Automated quality assurance in image pipelines
- Tuning codec quality settings to hit a visual quality target
- Comparing before/after processing to verify lossless operations
- CI/CD pipelines that check image quality regressions

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `compare(image1, image2, signal?)` - Compute the Butteraugli distance between two images
- `createVisDiff(mode?)` - Create a reusable comparison function
- `ImageInput` type - Input image data structure
- `VisDifFactory` type - Type for reusable comparison functions

## Real-World Examples

**Quality-gate a codec setting in CI**

```typescript
import { compare } from '@squoosh-kit/visdif';
import { encode } from '@squoosh-kit/avif';

const original = loadImage('source.png');
const avifBuffer = await encode(original, { quality: 60 });
const decoded = decodeAvif(avifBuffer); // your AVIF decoder

const distance = await compare(original, decoded);

if (distance > 2.0) {
  throw new Error(
    `AVIF quality too low: Butteraugli distance ${distance.toFixed(2)}`
  );
}

console.log(`AVIF quality OK: distance = ${distance.toFixed(3)}`);
```

**Find the minimum quality that meets a visual threshold**

```typescript
import { compare } from '@squoosh-kit/visdif';
import { encode } from '@squoosh-kit/webp';

const MAX_DISTANCE = 1.0;

for (let quality = 60; quality <= 100; quality += 5) {
  const encoded = await encode(original, { quality });
  const decoded = decodeWebp(encoded); // your WebP decoder

  const distance = await compare(original, decoded);

  if (distance <= MAX_DISTANCE) {
    console.log(
      `Minimum quality: ${quality} (distance: ${distance.toFixed(3)})`
    );
    break;
  }
}
```

## API Reference

### `compare(image1, image2, signal?)`

Computes the Butteraugli perceptual distance between two images. Both images must have identical dimensions.

- `image1` - `ImageInput` object — the reference (original) image
- `image2` - `ImageInput` object — the image to compare against the reference
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<number>` — the Butteraugli distance score (lower = more similar)

**Note**: `compare()` uses a global singleton worker. For long-running applications where worker cleanup is important, use `createVisDiff()` instead.

### `createVisDiff(mode?)`

Creates a reusable comparison function. More efficient for repeated comparisons.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `compare()`

## Cancellation Support

To cancel a comparison in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

const comparePromise = compare(image1, image2, controller.signal);
setTimeout(() => controller.abort(), 10000);

try {
  const distance = await comparePromise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Comparison was cancelled');
  }
}
```

## Input Validation

Both images are validated before processing:

```typescript
// Will throw TypeError: image must be an object
await compare(null, image2);

// Will throw TypeError: image.data must be Uint8Array or Uint8ClampedArray
await compare({ data: [0, 0, 0, 255], width: 32, height: 32 }, image2);

// Images must have the same dimensions for meaningful comparison
```

### Package Size

**Size breakdown:**

- JavaScript code: ~4-6KB gzipped
- TypeScript definitions: ~2KB
- WASM binary: ~20-30KB gzipped

### Worker Cleanup

When using worker mode, clean up when done:

```typescript
const differ = createVisDiff('worker');

try {
  const distance = await differ(original, compressed);
  console.log(`Distance: ${distance}`);
} finally {
  await differ.terminate();
}
```

## Performance Tips

- **Use workers for UI apps** - Butteraugli analysis is CPU-intensive; offload it to avoid blocking the UI
- **Use client mode in build tools** - Simpler setup for Node/Bun scripts
- **Cache results** - Butteraugli is deterministic; cache scores for unchanged image pairs
- **Pair with encoders** - Use alongside `@squoosh-kit/avif`, `@squoosh-kit/webp`, or `@squoosh-kit/mozjpeg` to tune quality settings programmatically

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
