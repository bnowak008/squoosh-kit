# @squoosh-kit/mozjpeg

A lightweight MozJPEG image codec for the squoosh-kit, enabling high-quality JPEG encoding in JavaScript/WebAssembly environments.

## Features

- 🎨 **High-quality JPEG encoding** - MozJPEG's advanced compression techniques
- ⚡ **Progressive JPEG support** - Option to encode progressive JPEGs
- 🌐 **Universal runtime** - Works in browsers, Node.js, and Bun
- 🔧 **Extensive options** - Quality, smoothing, color space, and more control
- ⚡ **Worker mode** - Off-load heavy processing to worker threads
- 🔒 **Type-safe** - Full TypeScript support

## Installation

```bash
npm install @squoosh-kit/mozjpeg
# or
bun add @squoosh-kit/mozjpeg
```

## Usage

### Quick Start

```typescript
import { encode } from '@squoosh-kit/mozjpeg';

// Encode image to JPEG
const imageData = {
  data: new Uint8Array(pixelData),
  width: 800,
  height: 600,
};

const jpegBuffer = await encode(imageData, {
  quality: 80,
  progressive: true,
});
```

### Reusable Encoders

For processing multiple images, create reusable instances:

```typescript
import { createMozjpegEncoder } from '@squoosh-kit/mozjpeg';

const encoder = createMozjpegEncoder('worker');
try {
  const result1 = await encoder(imageData1, { quality: 80 });
  const result2 = await encoder(imageData2, { quality: 75 });
} finally {
  await encoder.terminate();
}
```

### Client vs Worker Mode

```typescript
// Worker mode (default) - offloads processing to separate thread
const workerEncoder = createMozjpegEncoder('worker');

// Client mode - runs directly on main thread
const clientEncoder = createMozjpegEncoder('client');
```

## API

### `encode(imageData, options?, signal?)`

Encodes image data to JPEG format using MozJPEG.

**Parameters:**

- `imageData` (`ImageInput`) - Image data with `data`, `width`, and `height`
- `options` (`MozjpegEncodeInputOptions?`) - Optional encoding parameters
- `signal` (`AbortSignal?`) - Optional abort signal for cancellation

**Returns:** `Promise<Uint8Array>` - The encoded JPEG data

### Encoding Options

```typescript
interface MozjpegEncodeInputOptions {
  quality?: number; // 0-100 (default: 75)
  baseline?: boolean; // Output baseline JPEG (default: false)
  arithmetic?: boolean; // Use arithmetic coding (default: false)
  progressive?: boolean; // Output progressive JPEG (default: true)
  optimize_coding?: boolean; // Optimize Huffman tables (default: true)
  smoothing?: number; // Smoothing level (default: 0)
  color_space?: MozJpegColorSpace; // Color space (default: YCbCr)
  quant_table?: number; // Quantization table (default: 3)
  trellis_multipass?: boolean; // Trellis multipass (default: false)
  trellis_opt_zero?: boolean; // Trellis optimize zeros (default: false)
  trellis_opt_table?: boolean; // Trellis optimize table (default: false)
  trellis_loops?: number; // Trellis loops (default: 0)
  auto_subsample?: boolean; // Auto chroma subsampling (default: true)
  chroma_subsample?: number; // Chroma subsampling (default: 2)
  separate_chroma_quality?: boolean; // Separate chroma quality (default: false)
  chroma_quality?: number; // Chroma quality 0-100 (default: 75)
}
```

## Performance

MozJPEG is known for producing smaller JPEG files with higher visual quality compared to standard JPEG encoders. The worker mode ensures that encoding doesn't block the main thread.

## Architecture

This package uses WebAssembly modules from the [Squoosh](https://squoosh.app/) project, compiled with Emscripten. It provides a bridge pattern that allows seamless switching between direct client-side execution and Web Worker-based execution for better UI responsiveness.

## License

MIT
