# @squoosh-kit/oxipng

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Foxipng.svg)](https://badge.fury.io/js/%40squoosh-kit%2Foxipng)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Squoosh-Kit](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

## Squoosh-Kit

Squoosh-Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/oxipng`) is one of those modules.

**Directly from the Source**
We don't modify the core OxiPNG codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/oxipng` allows you to add lossless PNG optimization to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/oxipng
# or
npm install @squoosh-kit/oxipng
```

## Quick Start

```typescript
import { optimize, createOxipngOptimizer } from '@squoosh-kit/oxipng';
import type { ImageInput } from '@squoosh-kit/oxipng';

const imageData: ImageInput = {
  data: rawPixelBuffer,
  width: 800,
  height: 600,
};

// Optimize PNG with default settings (level 2)
const optimizedPng = await optimize(imageData);

// Higher optimization effort
const maxOptimized = await optimize(imageData, { level: 6 });

// For multiple images, use a persistent optimizer
const optimizer = createOxipngOptimizer('worker');
const result = await optimizer(imageData, { level: 3 });
await optimizer.terminate();
```

## What is OxiPNG?

OxiPNG is a lossless PNG optimizer. It re-encodes existing PNG data using more aggressive compression settings, reducing file size without any quality loss. A typical optimization at level 2–4 can reduce PNG file sizes by 10–30% with no visible difference.

OxiPNG is a good fit for:

- Reducing PNG sizes before serving to clients
- Optimizing screenshots or UI assets
- Post-processing after PNG encoding (pair with `@squoosh-kit/png`)

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `optimize(imageData, options?, signal?)` - Optimize raw pixel data to a compressed PNG
- `createOxipngOptimizer(mode?)` - Create a reusable optimizer function
- `ImageInput` type - Input image data structure
- `OxipngOptions` type - Optimization configuration
- `OxipngOptimizerFactory` type - Type for reusable optimizer functions

## Real-World Examples

**Optimize PNGs in a build pipeline**

```typescript
const optimizer = createOxipngOptimizer('client'); // No worker overhead for batch

for (const imagePath of pngFiles) {
  const imageData = await loadImageAsRgba(imagePath);
  const optimized = await optimizer(imageData, { level: 4 });
  await writeFile(imagePath, optimized);
  console.log(
    `Optimized ${imagePath}: ${imageData.data.length} → ${optimized.length} bytes`
  );
}

await optimizer.terminate();
```

**Optimize with a timeout**

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

try {
  const optimized = await optimize(imageData, { level: 6 }, controller.signal);
  await writeFile('output.png', optimized);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Optimization timed out — try a lower level');
  }
} finally {
  clearTimeout(timeout);
}
```

## API Reference

### `optimize(imageData, options?, signal?)`

Optimizes raw RGBA pixel data into a compressed PNG. This is a lossless operation — the output PNG decodes back to identical pixel values.

- `imageData` - `ImageInput` object with your pixel data
- `options` - (optional) `OxipngOptions` for compression settings
- `signal` - (optional) `AbortSignal` to cancel the operation
- **Returns** - `Promise<Uint8Array>` with the optimized PNG data

**Note**: Higher `level` values produce smaller files but take longer. Level 2 is a good default for most use cases.

### `createOxipngOptimizer(mode?)`

Creates a reusable optimizer. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `optimize()`

## Cancellation Support

To cancel an optimization in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

const optimizePromise = optimize(imageData, { level: 6 }, controller.signal);
setTimeout(() => controller.abort(), 10000);

try {
  const result = await optimizePromise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Optimization was cancelled');
  }
}
```

## Input Validation

All inputs are automatically validated before processing:

```typescript
// Will throw TypeError: image must be an object
await optimize(null);

// Will throw TypeError: image.data must be Uint8Array or Uint8ClampedArray
await optimize({ data: [0, 0, 0, 255], width: 32, height: 32 });

// Will throw RangeError: image.data too small
await optimize({ data: new Uint8Array(100), width: 800, height: 600 });
```

### Package Size

**Size breakdown:**

- JavaScript code: ~4-6KB gzipped
- TypeScript definitions: ~2KB
- WASM binary: ~20-30KB gzipped

### Worker Cleanup

When using worker mode, clean up when done:

```typescript
const optimizer = createOxipngOptimizer('worker');

try {
  const optimized = await optimizer(imageData, { level: 4 });
} finally {
  await optimizer.terminate();
}
```

### `OxipngOptions`

```typescript
type OxipngOptions = {
  level?: number; // 0–6, optimization effort (default: 2)
  interlace?: boolean; // Use Adam7 interlacing (default: false)
};
```

- `level` — Controls how hard OxiPNG tries to compress. Higher = smaller files, slower processing.
  - `0` — No optimization (fast, no size reduction)
  - `1-2` — Light optimization (fast, good results)
  - `3-4` — Moderate optimization (balanced)
  - `5-6` — Maximum optimization (slowest, smallest files)
- `interlace` — Enables Adam7 interlacing, which allows progressive rendering in browsers. Interlaced PNGs are typically slightly larger.

## Performance Tips

- **Level 2 is the sweet spot** — Good compression with fast processing; use for most cases
- **Level 6 for static assets** — Worth the extra time for files that will be served many times
- **Use workers for UI apps** — Higher levels can take several seconds on large images
- **Use client mode for build tools** — Direct processing is simpler in Node/Bun scripts
- **Pair with @squoosh-kit/png** — Encode raw pixels with png, then optimize with oxipng

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
