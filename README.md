# Squoosh Kit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)

**Per-feature adapters around Squoosh codecs (Bun-first), worker/client runtimes.**

Squoosh Kit provides a clean, modern interface to Google's Squoosh image processing capabilities, optimized for Bun runtime with full TypeScript support and Web Worker integration. This is a monorepo containing the following packages:

## Packages

| Package                                      | Description                            |
| -------------------------------------------- | -------------------------------------- |
| [`@squoosh-kit/core`](./packages/core)       | Meta-package that bundles all features |
| [`@squoosh-kit/webp`](./packages/webp)       | WebP encoding functionality            |
| [`@squoosh-kit/resize`](./packages/resize)   | High-quality image resizing            |
| [`@squoosh-kit/runtime`](./packages/runtime) | Internal runtime and worker bridge     |

## Development

### Initial Setup

First, install dependencies and sync the required Squoosh codec artifacts:

```bash
bun install
bun run sync-codecs
```

### Building All Packages

```bash
bun run build
```

### Running Tests

```bash
bun test
```

## License

MIT
