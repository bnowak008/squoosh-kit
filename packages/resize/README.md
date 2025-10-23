# @squoosh-kit/resize

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fresize.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fresize)

**Professional image resizing with uncompromising quality**

Transform your images with flexible resizing algorithms that balance quality and performance. Using the proven Squoosh WASM codecs with support for Triangular, Catrom, Mitchell, and Lanczos3 methods, this package delivers crisp results at any size.

Whether you need fast thumbnails for a gallery, responsive images for the web, or high-quality output for production, this package handles resizing with the algorithm your users deserve, all while keeping your application smooth and responsive.

## Installation

```bash
bun add @squoosh-kit/resize
# or
npm install @squoosh-kit/resize
```

## Quick Start

Resize images with confidence:

```typescript
import { resize, createResizer } from '@squoosh-kit/resize';
import type { ImageInput } from '@squoosh-kit/resize';

// Your image data - works with any source
const imageData: ImageInput = {
  data: imageBuffer,
  width: 2048,
  height: 1536,
};

// With cancellation support
const controller = new AbortController();
const thumbnail = await resize(
  imageData,
  { width: 400 }, // height calculated automatically
  controller.signal
);

// Cancel after 5 seconds if still running
setTimeout(() => controller.abort(), 5000);

// Without cancellation (operation cannot be stopped once started)
const resizedImage = await resize(imageData, { width: 1200, height: 800 });

// Create a resizer for batch operations
const resizer = createResizer('worker');
const results = await Promise.all([
  resizer(imageData, { width: 800 }, new AbortController().signal),
  resizer(imageData, { width: 1200 }, new AbortController().signal),
  resizer(imageData, { width: 1600 }, new AbortController().signal),
]);
```

## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `resize(imageData, options, signal?)` - Resize an image
- `createResizer(mode?)` - Create a reusable resizer function
- `ImageInput` type - Input image data structure
- `ResizeOptions` type - Resize configuration options
- `ResizerFactory` type - Type for reusable resizer functions

Internal implementation details (such as `resizeClient`) are not part of the public API and may change without notice.

## Resize Methods

Control the quality/speed trade-off with the `method` option:

```typescript
// Balanced quality and speed (default)
const balanced = await resize(imageData, { width: 800, method: 'mitchell' });

// Fast for real-time preview
const fast = await resize(imageData, { width: 800, method: 'triangular' });

// Highest quality for production
const highQuality = await resize(imageData, { width: 800, method: 'lanczos3' });
```

### Available Methods

All methods are provided by the Squoosh WASM codec:

- **triangular** (typ_idx=0): Fastest, lowest quality. Good for real-time previews and large-scale batch processing.
- **catrom** (typ_idx=1): Medium quality and speed. Good general-purpose option.
- **mitchell** (typ_idx=2, default): Balanced quality and performance. Recommended for most use cases.
- **lanczos3** (typ_idx=3): Highest quality, slowest. Use for production output where quality is paramount.

### Advanced Options

```typescript
// Color space control - use linear RGB for more accurate math
const linearResize = await resize(imageData, {
  width: 800,
  method: 'lanczos3',
  linearRGB: true, // Proper color space conversion
});

// Alpha channel handling - premultiply for better transparency
const transparencyResize = await resize(imageData, {
  width: 800,
  premultiply: true, // Improves quality with transparent images
});
```

## The Quality Difference

This isn't your average image resizer. Choose your trade-off between speed and quality with four proven algorithms from Google Squoosh. All processing happens in WebAssembly for incredible speed, with Web Workers ensuring your main thread stays free for user interactions.

## Real-World Examples

**Responsive Image Generation**

```typescript
// Generate multiple sizes for responsive design
const sizes = [320, 640, 1024, 1600];

const responsiveImages = await Promise.all(
  sizes.map((width) =>
    resize(
      originalImage,
      { width, height: Math.round(width * 0.75) },
      new AbortController().signal
    )
  )
);
```

**Photo Gallery Thumbnails with Timeout**

```typescript
const resizer = createResizer('client'); // Direct for server use

for (const photo of photoFiles) {
  const controller = new AbortController();

  // Set a 30-second timeout
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const fullImage = await loadImage(photo);
    const thumbnail = await resizer(
      fullImage,
      { width: 300, height: 200 },
      controller.signal
    );

    await saveThumbnail(photo.name, thumbnail);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`Resize timed out for ${photo.name}`);
    } else {
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
}
```

**Dynamic Image Processing**

```typescript
// Resize based on user preferences
const userWidth = getUserPreferredWidth();
const processedImage = await resize(imageData, {
  width: userWidth,
  linearRGB: true, // Better color accuracy
  premultiply: false, // Maintain transparency
});
```

## API Reference

### `resize(imageData, options, signal?)`

The main resizing function. Smart defaults make it easy to use.

- `imageData` - `ImageInput` object with your pixel data
- `options` - `ResizeOptions` for dimensions and quality
- `signal` - (optional) `AbortSignal` to cancel long operations. If provided, you can cancel by calling `controller.abort()` on the associated `AbortController`. If not provided, the operation cannot be cancelled.
- **Returns** - `Promise<ImageInput>` with resized image data

### `createResizer(mode?)`

Creates a reusable resizing function for efficient batch processing.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `resize()`

## Cancellation Support

To cancel a resize operation in progress, pass an `AbortSignal`:

```typescript
const controller = new AbortController();

// Start resize
const resizePromise = resize(imageData, { width: 800 }, controller.signal);

// Cancel after 5 seconds if still running
setTimeout(() => controller.abort(), 5000);

try {
  const result = await resizePromise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Resize was cancelled');
  }
}
```

**Important**: If no signal is provided, the resize operation cannot be cancelled. It will run to completion.

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
await resize(null, { width: 800 });

// Will throw TypeError: image.data is required
await resize({ width: 32, height: 32 }, { width: 800 });

// Will throw TypeError: image.data must be Uint8Array or Uint8ClampedArray
await resize({ data: [0, 0, 0, 255], width: 32, height: 32 }, { width: 800 });

// Will throw RangeError: image.width must be a positive integer
await resize(
  { data: new Uint8Array(100), width: 0, height: 32 },
  { width: 800 }
);

// Will throw RangeError: image.data too small
// (needs 32 * 32 * 4 = 4096 bytes, but only 100 provided)
await resize(
  { data: new Uint8Array(100), width: 32, height: 32 },
  { width: 800 }
);
```

### Options Validation

All resize options are validated for correctness:

```typescript
// Will throw RangeError: options.width must be a positive integer
await resize(validImage, { width: -800 });

// Will throw RangeError: options.height must be a positive integer
await resize(validImage, { height: 0 });

// Will throw TypeError: options.method must be one of: triangular, catrom, mitchell, lanczos3
await resize(validImage, { width: 800, method: 'invalid' });

// Will throw TypeError: options.premultiply must be boolean
await resize(validImage, { width: 800, premultiply: 1 });
```

### Why Validation Matters

Input validation prevents:

- **Cryptic WASM errors** - Clear messages instead of "undefined behavior"
- **Out-of-bounds buffer access** - Catches undersized buffers early
- **NaN propagation** - Rejects invalid numeric dimensions
- **Type confusion** - Ensures data is in the correct format

All validation happens synchronously before WASM processing, so you get errors immediately without starting an async operation.

### Edge Case Handling

The library safely handles edge cases that could cause errors or unexpected behavior:

#### Aspect Ratio Preservation with Small Dimensions

When resizing with only width or height specified, the other dimension is calculated while maintaining aspect ratio. Extreme aspect ratios are handled safely:

```typescript
// Width 1, height calculates automatically - minimum 1 pixel enforced
const tinyWidth = await resize(
  { data, width: 1921, height: 1080 },
  { width: 1 }
);
// Result: width=1, height≥1 (never 0)

// Very wide image, height to 1
const tinyHeight = await resize(
  { data, width: 1920, height: 1 },
  { height: 1 }
);
// Result: width≥1 (never 0), height=1
```

#### Rounding Precision

Decimal aspect ratios are rounded carefully to avoid precision loss:

```typescript
// Calculation: (1080 * 960) / 1920 = 540 (exact)
const result1 = await resize(
  { data, width: 1920, height: 1080 },
  { width: 960 }
);
// Result: width=960, height=540

// Calculation: (1081 * 960) / 1920 = 540.5 → rounds to 541
const result2 = await resize(
  { data, width: 1920, height: 1081 },
  { width: 960 }
);
// Result: width=960, height=541 (properly rounded)
```

#### Minimum Dimension Enforcement

Output dimensions must be at least 1x1 pixel (WASM requirement):

```typescript
// Both dimensions will be at least 1
const minimal = await resize(
  { data, width: 100, height: 100 },
  { width: 0.1 } // Would round to 0, enforced to 1
);
// This throws validation error (width must be ≥1)

// But if validation passes, minimum 1x1 is guaranteed
const valid = await resize({ data, width: 1000, height: 1000 }, { width: 1 });
// Result: width=1, height≥1
```

#### Why This Matters

- **No NaN values** - Rounding prevents `Infinity` from division by zero
- **No 0-pixel images** - Minimum 1x1 ensures valid output
- **Consistent behavior** - Aspect ratios always preserve proportion
- **Safe calculations** - `Math.max(1, ...)` protects against negative results

### Package Size

This package includes WebAssembly binaries (~30-50KB gzipped) for the resize codec. These enable fast processing through Web Workers and are essential for optimal performance.

**Size breakdown:**

- JavaScript code: ~5-10KB gzipped
- TypeScript definitions: ~3KB
- WASM binaries: ~30-50KB gzipped (required for resizing)

If you're using client mode only and want to reduce package size, you can safely remove the WASM files:

```bash
rm -rf node_modules/@squoosh-kit/resize/dist/wasm/
```

**Note**: This will cause worker mode to fail. Only remove if using client mode exclusively.

### Worker Cleanup

When using worker mode (`createResizer('worker')`), always clean up the worker when you're done to prevent memory leaks:

```typescript
const resizer = createResizer('worker');

try {
  const result = await resizer(imageData, { width: 800 });
  // Use the result...
} finally {
  // Clean up the worker to free resources
  await resizer.terminate();
}
```

For batch operations, keep the resizer alive throughout processing:

```typescript
const resizer = createResizer('worker');

try {
  const results = await Promise.all([
    resizer(image1, { width: 800 }),
    resizer(image2, { width: 800 }),
    resizer(image3, { width: 800 }),
  ]);

  // Process results...
} finally {
  // Clean up when all operations are complete
  await resizer.terminate();
}
```

**Note**: In client mode (`createResizer('client')`), calling `terminate()` is a no-op since there are no worker resources to clean up. It's always safe to call for consistency.

### `ResizeOptions`

Control the quality and behavior of resizing:

```typescript
type ResizeOptions = {
  width?: number; // Target width (aspect ratio maintained if only width/height set)
  height?: number; // Target height (aspect ratio maintained if only width/height set)
  method?: 'triangular' | 'catrom' | 'mitchell' | 'lanczos3'; // Resize algorithm (default: 'mitchell')
  premultiply?: boolean; // Premultiply alpha channel (default: false)
  linearRGB?: boolean; // Use linear RGB color space (default: false)
};
```

### Parameter Reference

All options map directly to the Squoosh WASM resize function:

| Option        | WASM Parameter         | Type                                                 | Default         | Description                                              |
| ------------- | ---------------------- | ---------------------------------------------------- | --------------- | -------------------------------------------------------- |
| `width`       | output_width           | number?                                              | original width  | Target width (aspect ratio maintained if height omitted) |
| `height`      | output_height          | number?                                              | original height | Target height (aspect ratio maintained if width omitted) |
| `method`      | typ_idx                | 'triangular' \| 'catrom' \| 'mitchell' \| 'lanczos3' | 'mitchell'      | Resize algorithm selection                               |
| `premultiply` | premultiply            | boolean?                                             | false           | Pre-multiply alpha channel before resizing               |
| `linearRGB`   | color_space_conversion | boolean?                                             | false           | Use linear RGB color space instead of sRGB               |

## Pro Tips

- **Maintain aspect ratio** - Set only width or height, and the other dimension calculates automatically
- **Use linearRGB for accuracy** - Better color reproduction, especially for photos
- **Batch with persistent resizers** - More efficient than one-off operations
- **Workers for UI responsiveness** - Keeps your interface smooth during heavy processing

## Perfect For

- **Web Applications** - Responsive images, user avatar processing
- **Media Libraries** - Batch thumbnail generation, format conversion
- **E-commerce** - Product image optimization, zoom functionality
- **Content Management** - Automated image processing pipelines
- **Mobile Apps** - Device-specific image sizing and optimization

## Works Everywhere

- **Bun** - Optimized performance and full feature support
- **Node.js** - Perfect for server-side image processing
- **Browsers** - Web Worker support for responsive user interfaces
- **TypeScript** - Complete type safety and IntelliSense support

## License

MIT - resize with confidence
