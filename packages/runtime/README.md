# @squoosh-kit/runtime

**The engine that makes Squoosh Kit tick**

This package provides the foundational runtime utilities that power all Squoosh Kit functionality. It handles the complex orchestration between your main application thread and the high-performance WebAssembly workers that do the actual image processing.

While most users won't interact with this package directly (it's consumed internally by the other Squoosh Kit packages), it contains the clever bits that make everything work smoothly across different JavaScript environments.

## What's Inside

**Worker Bridge**

- Seamless communication between main thread and Web Workers
- Automatic worker lifecycle management
- Graceful fallback for environments without worker support

**Environment Detection**

- Smart detection of execution context (worker vs main thread)
- Platform-specific optimizations and polyfills
- Consistent behavior across Bun, Node.js, and browsers

**Communication Layer**

- Type-safe request/response messaging
- Built-in error handling and recovery
- Support for operation cancellation and progress tracking

## How It Works

When you call a function like `encode()` or `resize()`, this runtime package:

1. **Chooses the right execution mode** - Web Worker for UI responsiveness or direct execution for maximum speed
2. **Manages the worker lifecycle** - Spins up workers when needed, reuses them efficiently
3. **Handles the heavy lifting** - Coordinates between your code and the WebAssembly codecs
4. **Keeps things responsive** - Ensures your main thread stays free for user interactions

## For Developers

This package is primarily consumed by the other Squoosh Kit packages (`webp`, `resize`, `core`), but if you're building custom image processing functionality or contributing to Squoosh Kit itself, you'll find:

- **Clean abstractions** - Simple APIs that hide WebAssembly complexity
- **Type safety** - Full TypeScript support throughout
- **Cross-platform compatibility** - Works everywhere JavaScript runs
- **Performance optimizations** - Tuned for both speed and responsiveness

## API Overview

The main types and functions you'll encounter:

```typescript
// Core types for image data
type ImageInput = ImageData | { data: Uint8Array; width: number; height: number };

// Worker communication
interface WorkerRequest<T = any> {
  id: string;
  type: string;
  payload: T;
}

interface WorkerResponse<T = any> {
  id: string;
  ok: boolean;
  data?: T;
  error?: string;
}

// Bridge creation
createBridge(mode: 'worker' | 'client'): ImageProcessorBridge;
```

## Environment Support

- **Bun** - Native performance optimizations
- **Node.js** - Server-grade reliability and speed
- **Browsers** - Full Web Worker integration for responsive UIs
- **WebAssembly** - Hardware-accelerated image processing

## Contributing

If you're working on Squoosh Kit itself, this package is where the magic happens. The bridge implementations, worker management, and cross-platform compatibility logic all live here.

For detailed API documentation, check the TypeScript definitions and source code comments - everything is thoroughly documented for maintainers.

## License

MIT - the foundation of Squoosh Kit
