# @squoosh-lite/webp

WebP encoding for Squoosh Lite - high-quality WebP compression with worker and client modes.

**Bun-first** with support for modern browsers and Node.js 18+.

## Installation

```bash
bun add @squoosh-lite/webp
# or
npm install @squoosh-lite/webp
```

## Quick Start

### Basic Usage (Bun - Client Mode)

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

### Browser Usage (Worker Mode)

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

## API

### `encode(signal, workerBridge, imageData, options?)`

Primary WebP encoding function.

**Parameters:**

- `signal: AbortSignal` - Signal to abort the operation
- `workerBridge: WorkerBridge | null` - Worker bridge or null for default worker mode
- `imageData: ImageInput` - Image data (ImageData or `{ data, width, height }`)
- `options?: WebpOptions` - Encoding options

**Returns:** `Promise<Uint8Array>` - Encoded WebP file data

### `createWebpEncoder(mode?)`

Factory function to create a bound encoder.

**Parameters:**

- `mode?: 'worker' | 'client'` - Execution mode (default: 'worker')

**Returns:** Encoder function with signature `(signal, imageData, options?) => Promise<Uint8Array>`

### `WebpOptions`

```typescript
type WebpOptions = {
  quality?: number; // 0-100, default: 82
  lossless?: boolean; // default: false
  nearLossless?: boolean; // reserved for future use
};
```

## License

Apache-2.0

This package wraps and redistributes prebuilt WebAssembly modules from:

- **libwebp** - Google (BSD-style license)
- **Squoosh** - Google Chrome Labs (Apache-2.0)

See the [LICENSE](../../LICENSE) file and respective codec licenses for details.
