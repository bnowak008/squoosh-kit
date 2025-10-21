# @squoosh-kit/core

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fcore.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fcore)

`@squoosh-kit/core` is a meta-package that conveniently bundles all functionality from the Squoosh Kit monorepo.

For smaller production bundles, you may prefer to install only the specific packages you need:

- [`@squoosh-kit/webp`](https://www.npmjs.com/package/@squoosh-kit/webp) - WebP encoding.
- [`@squoosh-kit/resize`](https://www.npmjs.com/package/@squoosh-kit/resize) - High-quality image resizing.

## Installation

```bash
bun add @squoosh-kit/core
# or
npm install @squoosh-kit/core
```

## Quick Start

This package re-exports all functionality from the individual packages.

```typescript
import { webpEncode, resize } from '@squoosh-kit/core';

// WebP Encoding
const webpData = await webpEncode(/* ... */);

// Image Resizing
const resizedImage = await resize(/* ... */);
```

Please refer to the documentation of the individual packages for detailed API information.

## License

MIT
