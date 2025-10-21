# Usage Examples

This document provides practical examples using the new `@squoosh-lite/webp` and `@squoosh-lite/resize` packages.

## Installation

```bash
bun add @squoosh-lite/webp @squoosh-lite/resize
```

## Example 1: Resize and Encode to WebP (Bun/Node.js)

```typescript
import { createResizer } from '@squoosh-lite/resize';
import { createWebpEncoder } from '@squoosh-lite/webp';
import { readFileSync, writeFileSync } from 'fs';

// Create client-mode functions for synchronous execution
const resizer = createResizer('client');
const encoder = createWebpEncoder('client');

// Create abort controller for cancellation support
const controller = new AbortController();

// Load image data (assuming you have RGBA data)
const originalImage = {
  data: new Uint8Array(1920 * 1080 * 4), // Your RGBA data here
  width: 1920,
  height: 1080
};

// Resize the image
const resized = await resizer(
  controller.signal,
  originalImage,
  { width: 800 } // Height will be calculated to maintain aspect ratio
);

console.log(`Resized from ${originalImage.width}x${originalImage.height} to ${resized.width}x${resized.height}`);

// Encode to WebP
const webpData = await encoder(
  controller.signal,
  resized,
  { quality: 85, lossless: false }
);

// Save to file
writeFileSync('output.webp', webpData);
console.log(`Saved WebP image (${webpData.length} bytes)`);
```

## Example 2: Browser with Worker Mode

```typescript
import { encode as webpEncode } from '@squoosh-lite/webp';
import { resize } from '@squoosh-lite/resize';

// Get image from canvas
const canvas = document.getElementById('sourceCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

const controller = new AbortController();

// Resize using worker mode (null = use default internal worker)
const resized = await resize(
  controller.signal,
  null,
  imageData,
  { width: 800, height: 600 }
);

// Encode to WebP using worker mode
const webpData = await webpEncode(
  controller.signal,
  null,
  resized,
  { quality: 90 }
);

// Create download link
const blob = new Blob([webpData], { type: 'image/webp' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'resized-image.webp';
a.click();
URL.revokeObjectURL(url);
```

## Example 3: WebP Encoding Only

```typescript
import { createWebpEncoder } from '@squoosh-lite/webp';

const encoder = createWebpEncoder('client');
const controller = new AbortController();

// High quality lossless encoding
const webpData = await encoder(
  controller.signal,
  { data: rgbaData, width: 1024, height: 768 },
  { quality: 100, lossless: true }
);
```

## Example 4: Image Resizing Only

```typescript
import { createResizer } from '@squoosh-lite/resize';

const resizer = createResizer('client');
const controller = new AbortController();

// Resize with specific width and height
const resized = await resizer(
  controller.signal,
  originalImage,
  { 
    width: 640,
    height: 480,
    premultiply: false,
    linearRGB: false
  }
);
```

## Example 5: Abort Long-Running Operations

```typescript
import { createWebpEncoder } from '@squoosh-lite/webp';

const encoder = createWebpEncoder('client');
const controller = new AbortController();

// Set a timeout to abort after 5 seconds
setTimeout(() => {
  console.log('Aborting encoding...');
  controller.abort();
}, 5000);

try {
  const webpData = await encoder(
    controller.signal,
    largeImage,
    { quality: 95 }
  );
  console.log('Encoding completed');
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Encoding was aborted');
  } else {
    console.error('Encoding failed:', error);
  }
}
```

## Example 6: Processing Multiple Images

```typescript
import { createResizer } from '@squoosh-lite/resize';
import { createWebpEncoder } from '@squoosh-lite/webp';

const resizer = createResizer('client');
const encoder = createWebpEncoder('client');

async function processImage(image: ImageInput, name: string) {
  const controller = new AbortController();
  
  // Resize
  const resized = await resizer(
    controller.signal,
    image,
    { width: 800 }
  );
  
  // Encode
  const webpData = await encoder(
    controller.signal,
    resized,
    { quality: 85 }
  );
  
  // Save
  await Bun.write(`${name}.webp`, webpData);
  return webpData.length;
}

// Process multiple images
const images = [
  { data: image1Data, width: 1920, height: 1080 },
  { data: image2Data, width: 2560, height: 1440 },
  { data: image3Data, width: 3840, height: 2160 }
];

const results = await Promise.all(
  images.map((img, i) => processImage(img, `image-${i + 1}`))
);

console.log('Processed images:', results.map((size, i) => 
  `image-${i + 1}: ${size} bytes`
));
```

## Example 7: Custom Worker Bridge

If you need more control over worker management:

```typescript
import { encode as webpEncode } from '@squoosh-lite/webp';
import { WorkerBridge } from '@squoosh-lite/core';

// Create your own worker bridge for custom worker management
const workerBridge = new WorkerBridge();

const controller = new AbortController();
const webpData = await webpEncode(
  controller.signal,
  workerBridge,
  imageData,
  { quality: 80 }
);

// Clean up when done
workerBridge.terminate();
```

## TypeScript Types

All functions are fully typed. Here are the main types:

```typescript
import type { WebpOptions } from '@squoosh-lite/webp';
import type { ResizeOptions } from '@squoosh-lite/resize';

const webpOptions: WebpOptions = {
  quality: 85,        // 0-100
  lossless: false,    // boolean
  nearLossless: false // boolean (reserved for future use)
};

const resizeOptions: ResizeOptions = {
  width: 800,           // number (optional if height is provided)
  height: 600,          // number (optional if width is provided)
  premultiply: false,   // boolean
  linearRGB: false      // boolean
};
```

## Error Handling

Always wrap operations in try-catch blocks:

```typescript
import { createWebpEncoder } from '@squoosh-lite/webp';

const encoder = createWebpEncoder('client');
const controller = new AbortController();

try {
  const webpData = await encoder(
    controller.signal,
    imageData,
    { quality: 85 }
  );
  console.log('Success!');
} catch (error) {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      console.log('Operation was aborted');
    } else {
      console.error('Operation failed:', error.message);
    }
  }
}
```

## Performance Tips

1. **Use Client Mode for Server-Side**: When running in Bun/Node.js, use `'client'` mode to avoid worker overhead
2. **Use Worker Mode for Browser**: In browsers, use worker mode to keep the main thread responsive
3. **Reuse Encoder/Resizer Functions**: Create them once and reuse for multiple operations
4. **Process in Batches**: Use `Promise.all()` to process multiple images concurrently
5. **Set Appropriate Quality**: Balance quality vs file size (85-90 is usually good)
6. **Consider Lossless Only When Needed**: Lossless encoding produces larger files

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+

Requires WebAssembly and ES Modules support. For worker mode, Web Workers support is also required.

## Node.js Compatibility

Requires Node.js 18+ with the `--experimental-wasm-modules` flag:

```bash
node --experimental-wasm-modules your-script.js
```

## Bun Compatibility

Works natively with Bun without any additional flags:

```bash
bun run your-script.ts
```
