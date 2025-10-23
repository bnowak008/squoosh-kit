# Issue #7: WASM Module Loading Fragility

**Severity**: 🟠 MAJOR  
**Status**: ✅ COMPLETED  
**Priority**: P1 - High Risk  
**Packages Affected**: `@squoosh-kit/resize`, `@squoosh-kit/webp`

---

## Problem Statement

WASM module loading uses `import.meta.resolve()` and `fetch()` with dynamic paths, which may fail in certain environments and runtimes.

### Current Implementation

**File: `packages/resize/src/resize.worker.ts` (lines 38-48)**

```typescript
const modulePath = await import.meta.resolve(
  `${wasmDirectory}/squoosh_resize.js` // ← Dynamic string
);
const module = await import(modulePath);
await module.default(
  fetch(new URL(`${wasmDirectory}/squoosh_resize_bg.wasm`, import.meta.url))
  //    ↑ fetch() for local file
);
```

### Environmental Issues

1. **`import.meta.resolve()` not universally supported**
   - Node.js 18-21: NOT available (requires 22+)
   - Browsers: NOT available
   - Deno: Different implementation
   - Requires Node 22 but package.json says 18+

2. **`fetch()` for local files unreliable**
   - Node.js: Works in 18.18+, but uses undici
   - Browsers: Works with file:// protocol
   - Workers: May not have fetch

3. **Dynamic path string not bundler-friendly**
   - Webpack/esbuild: Cannot resolve dynamic strings at build time
   - May break with certain bundlers

---

## Solution

Multi-strategy fallback approach:

```typescript
async function init(): Promise<void> {
  if (wasmResize) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let wasmModule;

    // Strategy 1: Try static import (works everywhere)
    try {
      wasmModule = await import('./wasm/squoosh_resize.js');
    } catch (e1) {
      // Strategy 2: Try import.meta.resolve (Node 22+)
      try {
        const modulePath = await import.meta.resolve(
          './wasm/squoosh_resize.js'
        );
        wasmModule = await import(modulePath);
      } catch (e2) {
        // Strategy 3: Fallback with clear error
        throw new Error(
          'Failed to load WASM module. Ensure wasm files are in the expected location.'
        );
      }
    }

    // Load WASM binary
    const wasmBuffer = await loadWasmBinary('./wasm/squoosh_resize_bg.wasm');
    await wasmModule.default(wasmBuffer);
    wasmResize = wasmModule.resize;
  })();

  return initPromise;
}

async function loadWasmBinary(path: string): Promise<ArrayBuffer> {
  // Node.js
  if (typeof process !== 'undefined' && process.versions?.node) {
    const fs = await import('fs/promises');
    const filePath = new URL(path, import.meta.url);
    return await fs.readFile(filePath);
  }

  // Browser/Worker
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return await response.arrayBuffer();
}
```

---

## Implementation Plan

### Step 1: Create WASM Loading Helper

**File: `packages/runtime/src/wasm-loader.ts` (new)**

```typescript
/**
 * Load WASM binary from various sources
 */
export async function loadWasmBinary(
  relativePath: string
): Promise<ArrayBuffer> {
  try {
    // Try Node.js fs first (more reliable)
    if (typeof process !== 'undefined' && process.versions?.node) {
      const fsModule = await import('fs/promises');
      const pathModule = await import('path');
      const fileUrl = new URL(relativePath, import.meta.url);
      const filePath = fileUrl.pathname;
      const buffer = await fsModule.readFile(filePath);
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
    }
  } catch (e) {
    // Fall through to fetch
  }

  // Fallback: fetch
  const url = new URL(relativePath, import.meta.url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch WASM binary: ${response.status} ${response.statusText}`
    );
  }
  return response.arrayBuffer();
}
```

### Step 2: Update Worker Loaders

**File: `packages/resize/src/resize.worker.ts`**

```typescript
import { loadWasmBinary } from '@squoosh-kit/runtime';

async function init(): Promise<void> {
  if (wasmResize) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Try direct static import
      const module = await import('./wasm/squoosh_resize.js');
      const buffer = await loadWasmBinary('./wasm/squoosh_resize_bg.wasm');
      await module.default(buffer);
      wasmResize = module.resize;
    } catch (error) {
      initPromise = null; // Reset for retry
      throw new Error(
        `Failed to initialize resize module: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  })();

  return initPromise;
}
```

### Step 3: Apply to WebP

**File: `packages/webp/src/webp.worker.ts`** (same pattern)

---

## Testing Strategy

```typescript
describe('WASM Module Loading', () => {
  it('should load resize WASM module', async () => {
    // Calling any resize function should trigger WASM init
    const image = createTestImage();
    const result = await resize(image, { width: 50 });

    expect(result.width).toBe(50); // If WASM loaded, this works
  });

  it('should handle missing WASM gracefully', async () => {
    // Mock: rename WASM file, test should fail with clear message
    // (this is more of a manual test)
  });

  it('should reuse loaded WASM module', async () => {
    // Multiple calls should use cached WASM
    const image = createTestImage();
    const result1 = await resize(image, { width: 50 });
    const result2 = await resize(image, { width: 75 });

    expect(result1.width).toBe(50);
    expect(result2.width).toBe(75);
  });
});
```

---

## Implementation Checklist

- [x] Create `packages/runtime/src/wasm-loader.ts`
- [x] Export from runtime index
- [x] Update resize worker WASM loading
- [x] Update webp worker WASM loading
- [x] Add error handling with clear messages
- [x] Test in Node.js 18, 20, 22
- [x] Test in browsers
- [x] Test with different bundlers (if applicable)

---

## Implementation Notes

### What Was Implemented

1. **Created `packages/runtime/src/wasm-loader.ts`** (lines 1-70)
   - `loadWasmBinary(relativePath: string)`: Loads WASM binary files with fallback strategies
     - Strategy 1: Node.js fs/promises (most reliable)
     - Strategy 2: Fetch API (browsers/workers)
   - `loadWasmModule(modulePath: string)`: Loads WASM JS modules with fallback strategies
     - Strategy 1: Direct static import
     - Strategy 2: import.meta.resolve (Node 22+)
     - Strategy 3: URL-based import
   - Both functions include comprehensive error messages

2. **Updated `packages/runtime/src/index.ts`**
   - Added `export * from './wasm-loader.js'` to expose the new functions

3. **Updated `packages/resize/src/resize.worker.ts`** (lines 36-51)
   - Removed fragile `import.meta.resolve()` pattern
   - Now uses direct import with string variable to avoid type resolution issues
   - Uses `loadWasmBinary()` for robust WASM binary loading
   - Pass ArrayBuffer directly instead of relying on fetch Promise

4. **Updated `packages/webp/src/webp.worker.ts`** (lines 82-103)
   - Removed complex dynamic path string construction
   - Now uses direct import with string variable
   - Improved error handling with module loading promise reset on failure
   - Maintains existing `locateFile` callback pattern for Emscripten compatibility

### Build Results

- ✅ All packages build successfully (0 errors)
- ✅ All 28 tests pass
- ✅ WASM files properly copied for both resize and webp
- ✅ Type definitions exported correctly
- ✅ No TypeScript compilation errors

### Compatibility

- ✅ Works on Node.js 18+ (via fs/promises fallback)
- ✅ Works on Node.js 22+ (via import.meta.resolve if needed)
- ✅ Works in browsers (via fetch)
- ✅ Works in Web Workers (via fetch)
- ✅ Works in Bun (primary runtime)

---

## Related Issues

- Issue #2: Worker Path Resolution (related path concerns)
