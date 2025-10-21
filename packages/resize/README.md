# @squoosh-lite/resize

Image resizing for Squoosh Lite - fast image scaling with quality options.

**Bun-first** with support for modern browsers and Node.js 18+.

## Installation

```bash
bun add @squoosh-lite/resize
# or
npm install @squoosh-lite/resize
```

## Quick Start

### Basic Usage (Bun - Client Mode)

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

## API

### `resize(signal, workerBridge, imageData, options)`

Primary resize function.

**Parameters:**

- `signal: AbortSignal` - Signal to abort the operation
- `workerBridge: WorkerBridge | null` - Worker bridge or null for default worker mode
- `imageData: ImageInput` - Image data to resize
- `options: ResizeOptions` - Resize options

**Returns:** `Promise<ImageInput>` - Resized image data

### `createResizer(mode?)`

Factory function to create a bound resizer.

**Parameters:**

- `mode?: 'worker' | 'client'` - Execution mode (default: 'worker')

**Returns:** Resizer function with signature `(signal, imageData, options) => Promise<ImageInput>`

### `ResizeOptions`

```typescript
type ResizeOptions = {
  width?: number; // Target width (if omitted, calculated from height)
  height?: number; // Target height (if omitted, calculated from width)
  premultiply?: boolean; // Premultiply alpha (default: false)
  linearRGB?: boolean; // Use linear RGB color space (default: false)
};
```

### `ImageInput`

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

## License

Apache-2.0

This package wraps and redistributes prebuilt WebAssembly modules from:

- **Squoosh** - Google Chrome Labs (Apache-2.0)

See the [LICENSE](../../LICENSE) file for details.
