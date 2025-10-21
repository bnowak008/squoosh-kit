# @squoosh-kit/resize

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fresize.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fresize)

**Professional image resizing with uncompromising quality**

Transform your images with the same high-quality resizing algorithm that powers Google's Squoosh. Using the Lanczos3 method for mathematically precise scaling, this package delivers crisp, clear results at any size through WebAssembly acceleration.

Whether you need thumbnails for a gallery, responsive images for the web, or batch processing for a media library, this package handles resizing with the quality your users deserve, all while keeping your application smooth and responsive.

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
  height: 1536
};

// Smart resizing maintains aspect ratio
const thumbnail = await resize(
  new AbortController().signal,
  imageData,
  { width: 400 } // height calculated automatically
);

// Exact dimensions when you need them
const resizedImage = await resize(
  new AbortController().signal,
  imageData,
  { width: 1200, height: 800 }
);

// Create a resizer for batch operations
const resizer = createResizer('worker');
const results = await Promise.all([
  resizer(new AbortController().signal, imageData, { width: 800 }),
  resizer(new AbortController().signal, imageData, { width: 1200 }),
  resizer(new AbortController().signal, imageData, { width: 1600 })
]);
```

## The Quality Difference

This isn't your average image resizer. Under the hood, it uses the Lanczos3 algorithm - a sophisticated mathematical approach that considers surrounding pixels when calculating each new pixel value. The result is resizing that maintains sharpness, avoids artifacts, and preserves the visual quality that matters.

All processing happens in WebAssembly for incredible speed, with Web Workers ensuring your main thread stays free for user interactions.

## Real-World Examples

**Responsive Image Generation**
```typescript
// Generate multiple sizes for responsive design
const sizes = [320, 640, 1024, 1600];

const responsiveImages = await Promise.all(
  sizes.map(width =>
    resize(
      new AbortController().signal,
      originalImage,
      { width, height: Math.round(width * 0.75) }
    )
  )
);
```

**Photo Gallery Thumbnails**
```typescript
const resizer = createResizer('client'); // Direct for server use

for (const photo of photoFiles) {
  const fullImage = await loadImage(photo);
  const thumbnail = await resizer(
    new AbortController().signal,
    fullImage,
    { width: 300, height: 200 }
  );

  await saveThumbnail(photo.name, thumbnail);
}
```

**Dynamic Image Processing**
```typescript
// Resize based on user preferences
const userWidth = getUserPreferredWidth();
const processedImage = await resize(
  new AbortController().signal,
  imageData,
  {
    width: userWidth,
    linearRGB: true,        // Better color accuracy
    premultiply: false      // Maintain transparency
  }
);
```

## API Reference

### `resize(signal, imageData, options)`

The main resizing function. Smart defaults make it easy to use.

- `signal` - `AbortSignal` to cancel long operations
- `imageData` - `ImageInput` object with your pixel data
- `options` - (optional) `ResizeOptions` for dimensions and quality
- **Returns** - `Promise<ImageInput>` with resized image data

### `createResizer(mode?)`

Creates a reusable resizing function for efficient batch processing.

- `mode` - (optional) `'worker'` or `'client'`, defaults to `'worker'`
- **Returns** - A function with the same signature as `resize()`

### `ResizeOptions`

Control the quality and behavior of resizing:

```typescript
type ResizeOptions = {
  width?: number;        // Target width (aspect ratio maintained if only width/height set)
  height?: number;       // Target height (aspect ratio maintained if only width/height set)
  premultiply?: boolean; // Premultiply alpha channel (default: false)
  linearRGB?: boolean;   // Use linear RGB color space (default: false)
};
```

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
