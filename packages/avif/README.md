# @squoosh-kit/avif

A lightweight AVIF image codec for the squoosh-kit, enabling AVIF encoding and decoding in JavaScript/WebAssembly environments.

## Features

- 🚀 **Multi-threaded support** - Automatic fallback between multi-threaded and single-threaded encoders
- 🎨 **Full encoding options** - Quality, speed, tune, and more control over compression
- 📦 **Decode support** - Decode AVIF images to raw pixel data
- 🌐 **Universal runtime** - Works in browsers, Node.js, and Bun
- ⚡ **Worker mode** - Off-load heavy processing to worker threads
- 🔒 **Type-safe** - Full TypeScript support

## Installation

```bash
npm install @squoosh-kit/avif
# or
bun add @squoosh-kit/avif
```

## Usage

### Quick Start

```typescript
import { encode, decode } from '@squoosh-kit/avif';

// Encode image to AVIF
const imageData = {
  data: new Uint8Array(pixelData),
  width: 800,
  height: 600,
};

const avifBuffer = await encode(imageData, {
  quality: 75,
  speed: 6,
});

// Decode AVIF
const decodedImage = await decode(avifBuffer);
```

### Reusable Encoders and Decoders

For processing multiple images, create reusable instances:

```typescript
import { createAvifEncoder, createAvifDecoder } from '@squoosh-kit/avif';

// Create encoder
const encoder = createAvifEncoder('worker');
try {
  const result1 = await encoder(imageData1, { quality: 80 });
  const result2 = await encoder(imageData2, { quality: 75 });
} finally {
  await encoder.terminate();
}

// Create decoder
const decoder = createAvifDecoder('worker');
try {
  const img1 = await decoder(avifBuffer1);
  const img2 = await decoder(avifBuffer2);
} finally {
  await decoder.terminate();
}
```

### Client vs Worker Mode

```typescript
// Worker mode (default) - offloads processing to separate thread
const workerEncoder = createAvifEncoder('worker');

// Client mode - runs directly on main thread
const clientEncoder = createAvifEncoder('client');
```

## API

### `encode(imageData, options?, signal?)`

Encodes image data to AVIF format.

**Parameters:**

- `imageData` (`ImageInput`) - Image data with `data`, `width`, and `height`
- `options` (`AvifEncodeInputOptions?`) - Optional encoding parameters
- `signal` (`AbortSignal?`) - Optional abort signal for cancellation

**Returns:** `Promise<Uint8Array>` - The encoded AVIF data

### `decode(buffer, signal?)`

Decodes AVIF data to image data.

**Parameters:**

- `buffer` (`BufferSource`) - AVIF file data
- `signal` (`AbortSignal?`) - Optional abort signal for cancellation

**Returns:** `Promise<ImageData>` - The decoded image data

### Encoding Options

```typescript
interface AvifEncodeInputOptions {
  quality?: number; // 0-100 (default: 50)
  qualityAlpha?: number; // 0-100 (default: 50)
  denoiseLevel?: number; // 0+ (default: 0)
  tileRowsLog2?: number; // (default: 0)
  tileColsLog2?: number; // (default: 0)
  speed?: number; // 0-10 (default: 6)
  subsample?: number; // (default: 1)
  chromaDeltaQ?: boolean; // (default: false)
  sharpness?: number; // (default: 0)
  enableSharpYUV?: boolean; // (default: false)
  tune?: AVIFTune; // auto|psnr|ssim (default: auto)
}
```

## Performance

The package automatically detects and uses the multi-threaded encoder variant when available, providing significantly faster encoding for large images. The single-threaded variant is used as a fallback.

## Architecture

This package uses WebAssembly modules from the [Squoosh](https://squoosh.app/) project, compiled with Emscripten. It provides a bridge pattern that allows seamless switching between direct client-side execution and Web Worker-based execution for better UI responsiveness.

## License

MIT
