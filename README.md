# Squoosh-Kit

[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Alt](https://github.com/bnowak008/squoosh-kit/blob/main/squoosh-kit-banner.webp)

**High-performance image processing for modern JavaScript applications**

Squoosh-Kit brings Google's Squoosh image optimization technology directly to your JavaScript projects. Built from the ground up for Bun with full TypeScript support, it offers lightning-fast image encoding and resizing through WebAssembly, all while keeping your main thread responsive with intelligent worker management.

Whether you're building a web application, a Node.js service, or a desktop app with Bun, Squoosh-Kit gives you the power of professional image processing without the complexity.

## The Squoosh-Kit Approach

- **Blazing Fast**: WebAssembly codecs from Google Squoosh
- **Non-blocking**: Web Workers keep your UI responsive
- **Type Safe**: Full TypeScript support with detailed APIs
- **Bun Native**: Optimized for Bun, works great in Node.js and browsers
- **Zero Config**: Works out of the box with sensible defaults

## What You Get

| Package                                                    | What's Inside                                | Best For                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`@squoosh-kit/core`](./packages/core)                     | All codecs bundled together                  | Quick start, projects needing multiple codecs                                            |
| [`@squoosh-kit/webp`](./packages/webp)                     | WebP encoding/decoding                       | Modern web images, file size optimization                                                |
| [`@squoosh-kit/avif`](./packages/avif)                     | AVIF encoding/decoding                       | Best compression for modern browsers                                                     |
| [`@squoosh-kit/mozjpeg`](./packages/mozjpeg)               | Optimized JPEG encoding/decoding             | JPEG compatibility with 10–20% smaller files                                             |
| [`@squoosh-kit/jxl`](./packages/jxl)                       | JPEG XL encoding/decoding                    | Next-gen format, excellent compression                                                   |
| [`@squoosh-kit/wp2`](./packages/wp2)                       | WP2 encoding/decoding                        | Experimental WebP successor (research use)                                               |
| [`@squoosh-kit/png`](./packages/png)                       | Lossless PNG encoding/decoding               | Pixel-perfect lossless images                                                            |
| [`@squoosh-kit/qoi`](./packages/qoi)                       | QOI lossless encoding/decoding               | Fast lossless intermediate storage                                                       |
| [`@squoosh-kit/resize`](./packages/resize)                 | Resizing with 4 algorithms                   | Thumbnails, responsive images (triangular, catrom, mitchell, lanczos3)                   |
| [`@squoosh-kit/rotate`](./packages/rotate)                 | 90°/180°/270° rotation                       | EXIF orientation correction                                                              |
| [`@squoosh-kit/oxipng`](./packages/oxipng)                 | Lossless PNG optimization                    | Reducing PNG file sizes by 10–30%                                                        |
| [`@squoosh-kit/imagequant`](./packages/imagequant)         | Palette quantization (PNG-8)                 | Icons, logos, indexed-color PNGs                                                         |
| [`@squoosh-kit/hqx`](./packages/hqx)                       | Pixel-art upscaling (2x/3x/4x)              | Retro game sprites, pixel art                                                            |
| [`@squoosh-kit/visdif`](./packages/visdif)                 | Butteraugli perceptual comparison            | Quality assurance, codec tuning                                                          |
| [`@squoosh-kit/vite-plugin`](./packages/vite-plugin)       | Vite plugin for WASM assets and CORS headers | Vite-based apps (React, Vue, Svelte, etc.)                                               |
| [`@squoosh-kit/runtime`](./packages/runtime)               | Internal runtime utilities                   | Advanced customization                                                                   |

## Quick Example

```typescript
import { encode } from '@squoosh-kit/webp';
import { resize } from '@squoosh-kit/resize';

// Resize first, then encode to WebP
const resized = await resize(imageData, { width: 800, method: 'mitchell' });

const webpBuffer = await encode(resized, { quality: 85 });
```

## Installation

Choose what you need, or install everything:

```bash
# Everything at once
bun add @squoosh-kit/core

# Or pick specific features
bun add @squoosh-kit/webp @squoosh-kit/resize

# npm works too
npm install @squoosh-kit/core
```

## Package Size & Download Reduction

Squoosh-Kit includes WebAssembly binaries for WASM codecs (~30-50KB gzipped per package). These enable fast processing through Web Workers and are essential for optimal performance.

### Size Breakdown

- **JavaScript code**: ~10-15KB gzipped
- **TypeScript definitions**: ~5KB
- **WASM binaries**: ~30-50KB gzipped (only needed for worker mode)

### Client-Only Usage

If you're using Squoosh-Kit in **client mode only** (direct encoding/resizing without workers) and want to reduce the download size, you can optionally remove the WASM files:

```bash
# After installation
rm -rf node_modules/@squoosh-kit/webp/dist/wasm/
rm -rf node_modules/@squoosh-kit/resize/dist/wasm/

# This reduces the package size by ~30-50KB gzipped
```

**Important**: Removing WASM files will cause worker mode to fail. Only do this if you're using client mode exclusively:

```typescript
// This will work (client mode)
const encoder = createWebpEncoder('client');

// This will fail (worker mode requires WASM)
const encoder = createWebpEncoder('worker'); // ❌ WASM files missing
```

## Learn More

Each package has its own comprehensive documentation:

- [WebP Encoding](./packages/webp/README.md) — encode, decode, quality options
- [AVIF Encoding](./packages/avif/README.md) — encode, decode, speed/tune options
- [MozJPEG Encoding](./packages/mozjpeg/README.md) — encode, decode, progressive options
- [JPEG XL Encoding](./packages/jxl/README.md) — encode, decode, effort options
- [WP2 Encoding](./packages/wp2/README.md) — encode, decode, UVMode/Csp options
- [PNG Encoding](./packages/png/README.md) — lossless encode, decode
- [QOI Encoding](./packages/qoi/README.md) — fast lossless encode, decode
- [Image Resizing](./packages/resize/README.md) — resize algorithms and configuration
- [Image Rotation](./packages/rotate/README.md) — 0/90/180/270° rotation
- [OxiPNG Optimization](./packages/oxipng/README.md) — lossless PNG compression
- [ImageQuant Quantization](./packages/imagequant/README.md) — palette reduction
- [HQX Upscaling](./packages/hqx/README.md) — pixel-art 2x/3x/4x upscale
- [VisDif Comparison](./packages/visdif/README.md) — Butteraugli perceptual diff
- [Core Package](./packages/core/README.md) — all codecs, namespaced imports
- [Vite Plugin](./packages/vite-plugin/README.md) — WASM assets and CORS setup

## Vite Integration

Install the official Vite plugin to automatically configure WASM assets, CORS headers, and dev server settings:

```bash
bun add -D @squoosh-kit/vite-plugin
```

```typescript
import { defineConfig } from 'vite';
import squooshVitePlugin from '@squoosh-kit/vite-plugin';
import { resolve } from 'path';

export default defineConfig({
  plugins: [squooshVitePlugin(resolve('node_modules/@squoosh-kit'))],
});
```

The plugin handles everything automatically: copying browser-compatible assets to `public/squoosh-kit/`, setting CORS headers (`require-corp`, `same-origin`), excluding Squoosh packages from Vite's optimization pipeline, and serving WASM files with the correct MIME type in development.

### Without Vite (Other Bundlers)

For Webpack, Rollup, or other bundlers, ensure that:

1. ES module imports are supported
2. `import.meta.url` is preserved
3. The `node_modules` directory is accessible at runtime

## Development

This is a Bun-first monorepo. To get started:

```bash
bun install
bun run sync-codecs  # Download Squoosh codecs
bun run build        # Build all packages
bun test             # Run tests
```

## Publishing to npm

Every push to `main` runs the deploy workflow, which:
1. Builds the project and deploys the demo site to Cloudflare Pages
2. Checks whether the current `package.json` version is already published on npm — if not, publishes all packages, creates a git tag, and creates a GitHub Release automatically

To release a new version, bump versions in a PR (for example `bun run version:patch` at the repo root), then merge:

```bash
bun run version:patch   # updates all package.json files, commits, creates a local tag
git push                # push the branch, open a PR as normal
# merge the PR → deploy workflow auto-detects the new version and publishes
```

All package versions must match the root `package.json` version (enforced in the workflow’s **Verify all package versions match** step). Add an `NPM_TOKEN` secret in the repo’s GitHub **Settings → Secrets and variables → Actions**.

## License

The squoosh-kit source code (TypeScript wrappers, worker bridge, build tooling) is licensed under the **MIT License** — see [LICENSE](./LICENSE).

The WebAssembly binaries distributed with `@squoosh-kit/webp` and `@squoosh-kit/resize` are compiled from [Google Squoosh](https://github.com/GoogleChromeLabs/squoosh) and are licensed under the **Apache License 2.0** — see [NOTICE](./NOTICE) for the full attribution and license text.

If you use `@squoosh-kit/webp` or `@squoosh-kit/resize` (or `@squoosh-kit/core` which depends on them), your distribution includes Apache 2.0 content. The two licenses are compatible — both are permissive and allow commercial use.
