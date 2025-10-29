# @squoosh-kit/webp

![Squoosh Kit](https://raw.githubusercontent.com/bnowak008/squoosh-kit/main/squoosh-kit-banner.webp)

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fwebp.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fwebp)

## Squoosh Kit
Squoosh Kit is built on a simple idea: provide a lightweight and modular bridge to the powerful, production-tested codecs from Google's Squoosh project. This package (`@squoosh-kit/webp`) is one of those modules.

**Directly from the Source**
We don't modify the core WebP codec. The WebAssembly (`.wasm`) binary is taken directly from the official Squoosh repository builds. This means you get the exact same performance, quality, and reliability you'd expect from Squoosh.

**A Thin, Modern Wrapper**
Our goal is to provide a minimal, modern JavaScript wrapper around the codec. We handle the tricky parts—like loading WASM, managing web workers, and providing a clean, type-safe API—so you can focus on your application. The library is designed to be a thin bridge, not a heavy framework.

**Modular by Design**
We believe you should only install what you need. As a standalone package, `@squoosh-kit/webp` allows you to add professional WebP encoding to your project without pulling in other unrelated image processing tools.

## Installation

```bash
bun add @squoosh-kit/webp
# or
npm install @squoosh-kit/webp
```

## Quick Start

```typescript
import { encode, createWebpEncoder } from '@squoosh-kit/webp';
import type { ImageInput } from '@squoosh-kit/webp';

// Your image data - from a file, canvas, or anywhere
const imageData: ImageInput = {
  data: imageBuffer,
  width: 1920,
  height: 1080,
};

// With cancellation support
const controller = new AbortController();
const webpBuffer = await encode(imageData, { quality: 85 }, controller.signal);

// For multiple images, create a persistent encoder
const encoder = createWebpEncoder('worker');
const optimized = await encoder(
  imageData,
  { quality: 90, lossless: false },
  new AbortController().signal
);

// Without cancellation (operation cannot be stopped once started)
const simple = await encode(imageData, { quality: 85 });
```

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `encode(imageData, options?, signal?)` - Encode an image to WebP format
- `createWebpEncoder(mode?)` - Create a reusable encoder function
- `ImageInput` type - Input image data structure
- `WebpOptions` type - WebP encoding configuration options
- `WebpEncoderFactory` type - Type for reusable encoder functions

Internal implementation details (such as `webpEncodeClient`) are not part of the public API and may change without notice.

## Real-World Examples

**Image Upload Processing with Timeout**

```typescript
// In your upload handler
const controller = new AbortController();

// Set a 30-second timeout
const timeout = setTimeout(() => controller.abort(), 30000);

try {
  const processedImage = await encode(
    uploadedImage,
    {
      quality: 85,
      lossless: false, // Perfect for photos
    },
    controller.signal
  );

  await saveToStorage('optimized.webp', processedImage);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Encoding timed out');
  } else {
    throw error;
  }
} finally {
  clearTimeout(timeout);
}
```

**Batch Conversion Service**

```typescript
const encoder = createWebpEncoder('client'); // Direct encoding, no worker

for (const imagePath of imageFiles) {
  const imageData = await loadImage(imagePath);
  const webpData = await encoder(imageData, { quality: 75 });

  await writeFile(`${imagePath}.webp`, webpData);
}
```

## API Reference

### `encode(imageData, options?, signal?)`

The main encoding function. Handles everything automatically and returns a Promise.

- `imageData` - `ImageInput` object with your pixel data
- `options` - (optional) `WebpOptions` for quality and format settings
- `signal` - (optional) `AbortSignal` to cancel long-running operations. If provided, you can cancel by calling `controller.abort()` on the associated `AbortController`. If not provided, the operation cannot be cancelled.
- **Returns** - `Promise<Uint8Array>` with your encoded WebP data

### `createWebpEncoder(mode?)`

Creates a reusable encoder function. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `encode()`

## Cancellation Support

To cancel an encoding operation in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

// Start encoding
const encodePromise = encode(imageData, { quality: 85 }, controller.signal);

// Cancel after 5 seconds if still running
setTimeout(() => controller.abort(), 5000);

try {
  const result = await encodePromise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Encoding was cancelled');
  }
}
```

**Important**: If no signal is provided, the encoding operation cannot be cancelled. It will run to completion.

## Input Validation

All inputs are automatically validated before processing to provide clear error messages:

### Image Validation

The `ImageInput` must contain valid image data:

```typescript
// Valid image data
const validImage: ImageInput = {
  data: new Uint8Array(4096), // or Uint8ClampedArray
  width: 32,
  height: 32,
};

// Will throw TypeError: image must be an object
await encode(null, { quality: 85 });

// Will throw TypeError: image.data is required
await encode({ width: 32, height: 32 }, { quality: 85 });

// Will throw TypeError: image.data must be Uint8Array or Uint8ClampedArray
await encode({ data: [0, 0, 0, 255], width: 32, height: 32 }, { quality: 85 });

// Will throw RangeError: image.width must be a positive integer
await encode(
  { data: new Uint8Array(100), width: 0, height: 32 },
  { quality: 85 }
);

// Will throw RangeError: image.data too small
// (needs 32 * 32 * 4 = 4096 bytes, but only 100 provided)
await encode(
  { data: new Uint8Array(100), width: 32, height: 32 },
  { quality: 85 }
);
```

### Options Validation

All encoding options are validated for correctness:

```typescript
// Will throw RangeError: options.quality must be an integer between 0 and 100
await encode(validImage, { quality: 150 });

// Will throw TypeError: options.lossless must be boolean
await encode(validImage, { lossless: 1 });

// Will throw TypeError: options.nearLossless must be boolean
await encode(validImage, { nearLossless: 'true' });
```

### Why Validation Matters

Input validation prevents:

- **Cryptic WASM errors** - Clear messages instead of "undefined behavior"
- **Out-of-bounds buffer access** - Catches undersized buffers early
- **Silent failures** - Invalid options are caught immediately
- **Type confusion** - Ensures data is in the correct format

All validation happens synchronously before WASM processing, so you get errors immediately without starting an async operation.

### Package Size

This package includes WebAssembly binaries (~30-40KB gzipped) for the WebP encoder. These enable fast processing through Web Workers and are essential for optimal performance.

**Size breakdown:**

- JavaScript code: ~5-8KB gzipped
- TypeScript definitions: ~3KB
- WASM binaries: ~30-40KB gzipped (required for encoding)

If you're using client mode only and want to reduce package size, you can safely remove the WASM files:

```bash
rm -rf node_modules/@squoosh-kit/webp/dist/wasm/
```

**Note**: This will cause worker mode to fail. Only remove if using client mode exclusively.

### Worker Cleanup

When using worker mode (`createWebpEncoder('worker')`), always clean up the worker when you're done to prevent memory leaks:

```typescript
const encoder = createWebpEncoder('worker');

try {
  const webpData = await encoder(imageData, { quality: 85 });
  // Use the encoded data...
} finally {
  // Clean up the worker to free resources
  await encoder.terminate();
}
```

For batch operations, keep the encoder alive throughout processing:

```typescript
const encoder = createWebpEncoder('worker');

try {
  const webpImages = await Promise.all([
    encoder(image1, { quality: 85 }),
    encoder(image2, { quality: 85 }),
    encoder(image3, { quality: 85 }),
  ]);

  // Save encoded images...
} finally {
  // Clean up when all operations are complete
  await encoder.terminate();
}
```

**Note**: In client mode (`createWebpEncoder('client')`), calling `terminate()` is a no-op since there are no worker resources to clean up. It's always safe to call for consistency.

### `WebpOptions`

Fine-tune your encoding:

```typescript
type WebpOptions = {
  quality?: number; // 0-100, controls file size vs quality (default: 82)
  lossless?: boolean; // Lossless compression, larger files (default: false)
  nearLossless?: boolean; // Near-lossless mode, best of both worlds (default: false)
};
```

## Performance Tips

- **Use workers for UI apps** - Keeps your interface responsive during encoding
- **Use client mode for servers** - Direct encoding without worker overhead
- **Batch with persistent encoders** - More efficient than one-off calls
- **Adjust quality strategically** - Often 80-90% quality looks identical to 100%

## Encoding Quality & File Size

The encoder uses quality-aware compression that automatically adjusts encoding parameters based on your quality setting:

- **High quality (80-100%)** - Faster encoding, lower CPU overhead
- **Medium quality (60-80%)** - Balanced compression and speed
- **Low quality (0-60%)** - More aggressive compression, slower encoding

This means that at 85% quality, you get smaller files than the original by applying targeted compression techniques like:

- Adaptive filtering based on content
- Spatial noise shaping for better detail preservation
- Multiple encoding passes for optimal results
- Sharp YUV conversion for better color handling

**Result**: Your image at 85% quality WebP will typically be **30-70% smaller** than the original JPEG or PNG while maintaining near-identical visual quality.

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
