# Squoosh Lite

Lightweight, modular packages that expose **per-feature** [Squoosh](https://github.com/GoogleChromeLabs/squoosh) functionality (WebP encode, Resize) through **clean imports**, reusing **already-built** Squoosh codec artifacts.

**Bun-first** with support for modern browsers and Node.js 18+.

## Packages

- **[@squoosh-lite/webp](packages/webp)** - WebP encoding
- **[@squoosh-lite/resize](packages/resize)** - Image resizing
- **[@squoosh-lite/core](packages/core)** - Core functionality (supports subpath imports for backward compatibility)

> **Note:** If you're upgrading from an older version that used `@squoosh-lite/core/webp` and `@squoosh-lite/core/resize`, see the [Migration Guide](MIGRATION.md).

## Features

- 🚀 **WebP Encoding** - High-quality WebP compression
- 📐 **Image Resizing** - Fast image scaling with quality options
- 🔄 **Worker & Client Modes** - Choose between web worker or inline execution
- 🎯 **Tree-shakeable** - Import only what you need
- 🦕 **Bun-first** - Optimized for Bun runtime with fallback support
- 📦 **Clean Imports** - Direct package imports like `@squoosh-lite/webp`

## Installation

Install individual packages based on your needs:

```bash
# For WebP encoding
bun add @squoosh-lite/webp

# For image resizing
bun add @squoosh-lite/resize

# Or install the core package for subpath imports
bun add @squoosh-lite/core
```

## Quick Start

### WebP Encoding (Bun - Client Mode)

```typescript
import { createWebpEncoder } from '@squoosh-lite/webp';

const encoder = createWebpEncoder('client');

// Prepare RGBA image data
const width = 800;
const height = 600;
const rgba = new Uint8Array(width * height * 4); // Your RGBA data here

// Encode to WebP
const controller = new AbortController();
const webpData = await encoder(
  controller.signal,
  { data: rgba, width, height },
  { quality: 80 }
);

// Save the result
await Bun.write('output.webp', webpData);
```

### WebP Encoding (Browser - Worker Mode)

```typescript
import { encode as webpEncode } from '@squoosh-lite/webp';

// Get image data from canvas
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Encode using default worker mode (null = use internal worker)
const controller = new AbortController();
const webpData = await webpEncode(controller.signal, null, imageData, {
  quality: 82,
  lossless: false,
});

// Create a downloadable blob
const blob = new Blob([webpData], { type: 'image/webp' });
const url = URL.createObjectURL(blob);
```

### Image Resizing

```typescript
import { createResizer } from '@squoosh-lite/resize';

const resizer = createResizer('client');

const controller = new AbortController();
const resized = await resizer(
  controller.signal,
  { data: rgba, width: 1920, height: 1080 },
  { width: 800, height: 600 }
);

console.log(`Resized to ${resized.width}x${resized.height}`);
```

### Resize with Aspect Ratio Preservation

```typescript
import { resize } from '@squoosh-lite/resize';

// Resize to width 800, height calculated automatically
const controller = new AbortController();
const resized = await resize(
  controller.signal,
  null, // use default worker
  imageData,
  { width: 800 } // height will maintain aspect ratio
);
```

### Complete Pipeline (Resize + Encode)

```typescript
import { createResizer } from '@squoosh-lite/resize';
import { createWebpEncoder } from '@squoosh-lite/webp';

const resizer = createResizer('client');
const encoder = createWebpEncoder('client');
const controller = new AbortController();

// Load and resize
const resized = await resizer(controller.signal, originalImage, {
  width: 1200,
});

// Encode to WebP
const webpData = await encoder(controller.signal, resized, { quality: 85 });

await Bun.write('resized-output.webp', webpData);
```

## API Reference

### WebP Module (`@squoosh-lite/webp`)

#### `encode(signal, workerBridge, imageData, options?)`

Primary WebP encoding function.

**Parameters:**

- `signal: AbortSignal` - Signal to abort the operation
- `workerBridge: WorkerBridge | null` - Worker bridge or null for default worker mode
- `imageData: ImageInput` - Image data (ImageData or `{ data, width, height }`)
- `options?: WebpOptions` - Encoding options

**Returns:** `Promise<Uint8Array>` - Encoded WebP file data

#### `createWebpEncoder(mode?)`

Factory function to create a bound encoder.

**Parameters:**

- `mode?: 'worker' | 'client'` - Execution mode (default: 'worker')

**Returns:** Encoder function with signature `(signal, imageData, options?) => Promise<Uint8Array>`

#### `WebpOptions`

```typescript
type WebpOptions = {
  quality?: number; // 0-100, default: 82
  lossless?: boolean; // default: false
  nearLossless?: boolean; // reserved for future use
};
```

### Resize Module (`@squoosh-lite/resize`)

#### `resize(signal, workerBridge, imageData, options)`

Primary resize function.

**Parameters:**

- `signal: AbortSignal` - Signal to abort the operation
- `workerBridge: WorkerBridge | null` - Worker bridge or null for default worker mode
- `imageData: ImageInput` - Image data to resize
- `options: ResizeOptions` - Resize options

**Returns:** `Promise<ImageInput>` - Resized image data

#### `createResizer(mode?)`

Factory function to create a bound resizer.

**Parameters:**

- `mode?: 'worker' | 'client'` - Execution mode (default: 'worker')

**Returns:** Resizer function with signature `(signal, imageData, options) => Promise<ImageInput>`

#### `ResizeOptions`

```typescript
type ResizeOptions = {
  width?: number; // Target width (if omitted, calculated from height)
  height?: number; // Target height (if omitted, calculated from width)
  premultiply?: boolean; // Premultiply alpha (default: false)
  linearRGB?: boolean; // Use linear RGB color space (default: false)
};
```

### Common Types

#### `ImageInput`

```typescript
type ImageInput =
  | ImageData
  | {
      data: Uint8Array; // RGBA8888 pixel data
      width: number;
      height: number;
    };
```

**Note:** Bun and Node.js environments may not have `ImageData`, so the object form `{ data, width, height }` is always supported.

## Execution Modes

### Worker Mode (Default)

Runs codecs in a Web Worker for non-blocking execution. Best for browser environments and larger images.

```typescript
import { createWebpEncoder } from '@squoosh-lite/webp';

const encoder = createWebpEncoder('worker');
// or
const encoder = createWebpEncoder(); // defaults to 'worker'
```

### Client Mode

Runs codecs inline in the main thread. Best for Bun/Node.js or when worker overhead is unnecessary.

```typescript
import { createWebpEncoder } from '@squoosh-lite/webp';

const encoder = createWebpEncoder('client');
```

## Aborting Operations

All operations support `AbortSignal` for cancellation:

```typescript
const controller = new AbortController();

// Start encoding
const promise = encoder(controller.signal, imageData, options);

// Abort if needed
setTimeout(() => controller.abort(), 5000);

try {
  const result = await promise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation was aborted');
  }
}
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+

Requires support for:

- WebAssembly
- ES Modules
- Web Workers (for worker mode)

## Node.js Compatibility

Requires Node.js 18+ with:

- `--experimental-wasm-modules` flag (for WASM support)
- Worker thread support

Example:

```bash
node --experimental-wasm-modules your-script.js
```

## Development

### Setup

```bash
bun install
```

### Copy Codec Artifacts

```bash
bun run prepare
```

This fetches prebuilt WASM artifacts from the [Squoosh fork](https://github.com/bnowak008/squoosh) (branch: `dev`).

### Build

```bash
bun run build
```

Outputs ESM modules to `dist/` with TypeScript declarations.

### Using Local Squoosh Fork

Set `SQUOOSH_DIR` to use a local checkout:

```bash
SQUOOSH_DIR=/path/to/squoosh bun run prepare
```

## License

Apache-2.0

This package wraps and redistributes prebuilt WebAssembly modules from various upstream projects:

- **libwebp** - Google (BSD-style license)
- **Squoosh** - Google Chrome Labs (Apache-2.0)

See the [LICENSE](./LICENSE) file and respective codec licenses for details.

## Third-Party Licenses

The WASM binaries included in this package are built from the following open source projects:

- **libwebp**: Copyright (c) 2010, Google Inc. All rights reserved. [License](https://chromium.googlesource.com/webm/libwebp/+/refs/heads/main/COPYING)
- **Squoosh**: Copyright 2020 Google Inc. [License](https://github.com/GoogleChromeLabs/squoosh/blob/dev/LICENSE)

We do not modify these binaries; we redistribute them with attribution per their respective licenses.

## Contributing

Contributions are welcome! Please ensure:

1. Code follows existing patterns and style
2. New features include tests
3. All tests pass before submitting PR

## Future Roadmap

- [ ] AVIF encoding support
- [ ] MozJPEG encoding support
- [ ] OxiPNG optimization
- [ ] Image decoding capabilities
- [ ] Additional codec options
