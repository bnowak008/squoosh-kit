# @squoosh-kit/runtime

[![npm version](https://badge.fury.io/js/%40squoosh-kit%2Fruntime.svg)](https://badge.fury.io/js/%40squoosh-kit%2Fruntime)
[![CI](https://github.com/bnowak008/squoosh-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/bnowak008/squoosh-kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The engine that makes Squoosh Kit tick.**

This package provides the foundational runtime utilities that power all Squoosh Kit functionality. It handles the complex orchestration between your main application thread and the high-performance WebAssembly workers that do the actual image processing.

While most users won't interact with this package directly (it's consumed internally by the other Squoosh Kit packages), it contains the clever bits that make everything work smoothly across different JavaScript environments.

## Core Features

- **Worker Bridge**: A seamless communication layer between the main thread and Web Workers, with a client-side fallback.
- **Environment Detection**: Utilities to detect the current runtime environment (Node.js, Bun, Browser, Worker).
- **Type-Safe Communication**: A robust request/response messaging system with full TypeScript support.

## For Squoosh Kit Developers

If you are contributing to Squoosh Kit or building a custom codec package, this runtime provides the essential building blocks.

### `createCodecWorker(workerPath)`

This is the most important utility for creating workers in a cross-platform way. It intelligently detects the environment and uses the correct method to instantiate a `Worker`.

```typescript
import { createCodecWorker } from '@squoosh-kit/runtime';

// This will work in Bun, Node.js, and the browser.
const worker = await createCodecWorker('@my-codec/worker.js');
```

### `callWorker(worker, type, payload, signal, transfer?)`

A type-safe function for sending a request to a worker and waiting for a response.

- `worker`: The `Worker` instance.
- `type`: A string identifier for the worker action (e.g., `'resize:run'`).
- `payload`: The data to send to the worker.
- `signal`: An `AbortSignal` to cancel the operation.
- `transfer?`: An optional array of `Transferable` objects.

### Environment Utilities

You can use the exported environment checkers (`isBun`, `isNode`, `isBrowser`, `isWorker`) to add environment-specific logic to your codecs.

## Environment Compatibility

- **Node.js**: Fully supported.
- **Bun**: Fully supported.
- **Modern Browsers**: Fully supported.

## License

MIT - the foundation of Squoosh Kit.
