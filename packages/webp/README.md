# @squoosh-kit/webp

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fwebp.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fwebp)

**Professional WebP encoding that doesn't get in your way**

Transform your images into the modern WebP format with the same technology that powers Google's Squoosh. Built on WebAssembly for incredible speed, this package handles the heavy lifting while keeping your application responsive through intelligent worker management.

Perfect for optimizing images in web applications, processing user uploads, or building image conversion services. Whether you're working with Bun, Node.js, or the browser, WebP encoding has never been this straightforward.

## Installation

```bash
bun add @squoosh-kit/webp
# or
npm install @squoosh-kit/webp
```

## Quick Start

Get started with minimal fuss:

```typescript
import { encode, createWebpEncoder } from '@squoosh-kit/webp';
import type { ImageInput } from '@squoosh-kit/webp';

// Your image data - from a file, canvas, or anywhere
const imageData: ImageInput = {
  data: imageBuffer,
  width: 1920,
  height: 1080
};

// One-off encoding (worker spins up automatically)
const webpBuffer = await encode(
  new AbortController().signal,
  imageData,
  { quality: 85 }
);

// For multiple images, create a persistent encoder
const encoder = createWebpEncoder('worker');
const optimized = await encoder(
  new AbortController().signal,
  imageData,
  { quality: 90, lossless: false }
);
```

## How It Works

Under the hood, this package leverages Google's Squoosh WebP encoder compiled to WebAssembly. The heavy processing happens in a Web Worker by default, so your main thread stays free for user interactions.

You get the same quality and performance as the original Squoosh tool, but wrapped in a clean JavaScript API that fits naturally into modern applications.

## Real-World Examples

**Image Upload Processing**
```typescript
// In your upload handler
const processedImage = await encode(
  new AbortController().signal,
  uploadedImage,
  {
    quality: 85,
    lossless: false // Perfect for photos
  }
);

await saveToStorage('optimized.webp', processedImage);
```

**Batch Conversion Service**
```typescript
const encoder = createWebpEncoder('client'); // Direct encoding, no worker

for (const imagePath of imageFiles) {
  const imageData = await loadImage(imagePath);
  const webpData = await encoder(
    new AbortController().signal,
    imageData,
    { quality: 75 }
  );

  await writeFile(`${imagePath}.webp`, webpData);
}
```

## API Reference

### `encode(signal, imageData, options?)`

The main encoding function. Handles everything automatically and returns a Promise.

- `signal` - `AbortSignal` to cancel long-running operations
- `imageData` - `ImageInput` object with your pixel data
- `options` - (optional) `WebpOptions` for quality and format settings
- **Returns** - `Promise<Uint8Array>` with your encoded WebP data

### `createWebpEncoder(mode?)`

Creates a reusable encoder function. More efficient for processing multiple images.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `encode()`

### `WebpOptions`

Fine-tune your encoding:

```typescript
type WebpOptions = {
  quality?: number;     // 0-100, controls file size vs quality (default: 82)
  lossless?: boolean;   // Lossless compression, larger files (default: false)
  nearLossless?: boolean; // Near-lossless mode, best of both worlds (default: false)
};
```

## Performance Tips

- **Use workers for UI apps** - Keeps your interface responsive during encoding
- **Use client mode for servers** - Direct encoding without worker overhead
- **Batch with persistent encoders** - More efficient than one-off calls
- **Adjust quality strategically** - Often 80-90% quality looks identical to 100%

## Works With

- **Bun** - First-class support, fastest performance
- **Node.js** - Works great in server environments
- **Browsers** - Full Web Worker support for responsive UIs
- **TypeScript** - Complete type definitions included

## License

MIT - use it freely in your projects
