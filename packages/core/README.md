# @squoosh-kit/core

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fcore.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fcore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Per-feature adapters around Squoosh codecs (Bun-first), worker/client runtimes.

## Features

- 🚀 **Bun-first** - Optimized for Bun runtime
- 🧵 **Web Workers** - Offload heavy processing from main thread
- 📦 **Tree-shakable** - Import only what you need
- 🔧 **TypeScript** - Full type safety
- ⚡ **WebAssembly** - High-performance image processing
- 🌐 **Universal** - Works in browsers and Node.js/Bun

## Installation

```bash
bun add @squoosh-kit/core
# or
npm install @squoosh-kit/core
# or
yarn add @squoosh-kit/core
```

## Quick Start

### WebP Encoding

```typescript
import { webpEncode } from '@squoosh-kit/core/webp';

const imageData = new Uint8Array(/* your image data */);
const webpData = await webpEncode(imageData, {
  quality: 80,
  lossless: false,
});
```

### Image Resizing

```typescript
import { resize } from '@squoosh-kit/core/resize';

const resizedImage = await resize(imageData, {
  width: 800,
  height: 600,
  method: 'lanczos3',
});
```

### Using Workers

```typescript
import { createWebpEncoder } from '@squoosh-kit/core/webp';

const encoder = await createWebpEncoder();
const result = await encoder.encode(imageData, { quality: 90 });
```

## API Reference

### WebP Module (`@squoosh-kit/core/webp`)

#### `webpEncode(imageData, options)`

Encode image data to WebP format.

**Parameters:**

- `imageData: Uint8Array` - Input image data
- `options: WebpOptions` - Encoding options

**Returns:** `Promise<Uint8Array>` - WebP encoded data

#### `createWebpEncoder()`

Create a WebP encoder instance with worker support.

**Returns:** `Promise<WebpEncoder>`

### Resize Module (`@squoosh-kit/core/resize`)

#### `resize(imageData, options)`

Resize image data.

**Parameters:**

- `imageData: Uint8Array` - Input image data
- `options: ResizeOptions` - Resize options

**Returns:** `Promise<Uint8Array>` - Resized image data

#### `createResizer()`

Create a resizer instance with worker support.

**Returns:** `Promise<Resizer>`

## Options

### WebpOptions

```typescript
interface WebpOptions {
  quality?: number; // 0-100, default: 80
  lossless?: boolean; // default: false
  nearLossless?: number; // 0-100, default: 60
  smartSubsample?: boolean; // default: false
  method?: number; // 0-6, default: 4
}
```

### ResizeOptions

```typescript
interface ResizeOptions {
  width?: number; // Target width
  height?: number; // Target height
  method?: 'lanczos3' | 'lanczos2' | 'mitchell' | 'catrom' | 'triangle' | 'hqx';
  premultiply?: boolean; // default: true
  linearRGB?: boolean; // default: true
}
```

## Browser Support

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## Node.js/Bun Support

- Node.js 18+
- Bun 1.0+

## License

MIT © [Bartosz Nowak](https://github.com/bnowak008)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- 📖 [Documentation](https://github.com/bnowak008/squoosh-kit#readme)
- 🐛 [Issue Tracker](https://github.com/bnowak008/squoosh-kit/issues)
- 💬 [Discussions](https://github.com/bnowak008/squoosh-kit/discussions)
