# @squoosh-kit Additional Codecs Implementation Plan

This document outlines a systematic plan to implement the remaining codecs from the Squoosh repository into the `@squoosh-kit` monorepo, ensuring consistency with the existing package structure.

---

## 1. Analysis Summary

The `@squoosh-kit` monorepo has a well-defined architecture, exemplified by the `@squoosh-kit/webp` and `@squoosh-kit/resize` packages. This architecture is built upon a few key principles that must be replicated for all new codec packages:

- **Modular Packages**: Each codec is a self-contained package within the `packages/` directory.
- **Shared Runtime**: Common logic for worker communication, WASM loading, and generic type validation is centralized in `@squoosh-kit/runtime`.
- **Decentralized Builds**: Each package is responsible for its own build process, which generates multiple artifacts for different JavaScript environments (Bun, Node.js, and Browser).
- **Consistent API Surface**: Each package exposes a simple, consistent API, typically an async function for a single operation (e.g., `encode`) and a factory function (`create...`) for creating reusable instances with lifecycle management (`.terminate()`).
- **Bridge Pattern**: A `bridge.ts` file in each package abstracts the communication logic, seamlessly switching between a direct client-side implementation and a Web Worker-based implementation.

This plan will serve as a detailed, step-by-step guide to create new packages for AVIF, MozJPEG, JXL, OxiPNG, and ImageQuant, as well as to extend the WebP package with decoder functionality, all while strictly adhering to the established patterns.

---

## 2. Universal Codec Package Template

Every new codec package must follow this file and code structure to ensure consistency across the monorepo.

### File Structure Template

```
packages/[codec-name]/
├── build.ts
├── bunfig.toml
├── package.json
├── README.md
├── scripts/
│   └── copy-assets.ts
├── src/
│   ├── bridge.ts
│   ├── index.ts
│   ├── [codec-name].worker.ts
│   ├── types.ts
│   └── validators.ts
├── test/
│   ├── integration.test.ts
│   ├── setup.ts
│   └── wasm.test.ts
├── tsconfig.json
└── wasm/
    └── (WASM and JS glue files copied here)
```

### Key File Implementation Details

- **`package.json`**:
  - **`name`**: `@squoosh-kit/[codec-name]`
  - **`exports`**: Must include conditional exports for `browser`, `bun`, `import` (Node ESM), and `require` (Node CJS) for both the main entry point (`.`) and the worker script.
  - **`files`**: Must include `dist/**` and `README.md`.
  - **`scripts`**: Must include `"build": "bun run build.ts"` and `"prepack": "bun run build && bun test"`.
  - **`dependencies`**: Must include `"@squoosh-kit/runtime": "workspace:*"`.

- **`build.ts`**:
  - Must implement builds for `bun`, `node` (esm and cjs), and `browser` targets, similar to the existing `packages/webp/build.ts`.
  - Must generate and include external sourcemaps.
  - Must run `tsc` to generate TypeScript declaration files (`.d.ts`).
  - Must copy the contents of the local `wasm/` directory to `dist/wasm/` to ensure assets are included in the published package.

- **`scripts/copy-assets.ts`**:
  - Responsible for copying the specific WASM and JS glue files for the codec from the root `.squoosh-temp/codecs/` directory into the package's local `wasm/` directory.

- **`src/index.ts`**:
  - Defines the public API.
  - Must export a primary async function (e.g., `encode`, `decode`, `optimize`).
  - Must export a factory function (`create[CodecName]Encoder`, etc.) that returns the primary function along with a `.terminate()` method for resource cleanup.

- **`src/bridge.ts`**:
  - Implements the `ClientBridge` and `WorkerBridge` classes.
  - `ClientBridge` must dynamically `import()` the `*.worker.js` file to get access to the client-side implementation.
  - `WorkerBridge` must use the `createReadyWorker` utility from `@squoosh-kit/runtime`.

- **`src/[codec-name].worker.ts`**:
  - Contains the core logic for interacting with the WASM module.
  - Must export an async function for the client-side implementation (e.g., `[codecName]EncodeClient`).
  - Must include a message handler (`self.onmessage`) to process requests when running in a worker context.
  - Must implement robust WASM loading logic, handling different environments (SIMD, non-SIMD, Node vs. Browser).

- **`src/types.ts`**:
  - Defines the specific options types for the codec (e.g., `[CodecName]EncodeOptions`).
  - Should re-export relevant types from the WASM module's `.d.ts` file where applicable.

- **`src/validators.ts`**:
  - Contains codec-specific validation logic for its options (e.g., `validateAvifEncodeOptions`).
  - Generic validation (`validateImageInput`) should still be imported from `@squoosh-kit/runtime`.

- **`test/setup.ts`**:
  - Must contain a `beforeAll` hook that executes the `scripts/copy-assets.ts` script to ensure WASM files are available before tests run.

---

## 3. Advanced Implementation Details

### 3.1. WASM Loader Strategy (SIMD & Multi-Threading)

Codecs like AVIF and JXL provide SIMD and/or multi-threaded (`_mt`) WASM modules. The loading strategy in `packages/webp/src/webp.worker.ts` should be used as a template:

1.  **Detect SIMD**: Use the `detectSimd()` utility from `@squoosh-kit/runtime`.
2.  **Attempt to Load Optimized Module**: If SIMD is supported, first try to `import()` the `_simd.js` or `_mt.js` module.
3.  **Fallback Gracefully**: If the optimized module fails to load (or SIMD is not supported), fall back to the standard, single-threaded module.
4.  **Use `loadWasmBinary`**: Use the `loadWasmBinary` helper from the runtime to fetch the `.wasm` file, providing a more robust loading mechanism than relying on Emscripten's default fetch.

This pattern ensures that the library uses the most performant module available in the user's environment without failing if a specific feature (like SIMD) is unavailable.

### 3.2. Emscripten Environment Polyfills

The WASM modules generated by Emscripten often assume a browser-like environment. To ensure compatibility in Node.js and Bun, the following polyfills (found in `webp.worker.ts`) must be included at the top of each new `*.worker.ts` file:

- `self`: `if (typeof self === 'undefined') { global.self = global; }`
- `location`: `if (typeof self !== 'undefined' && !self.location) { self.location = { href: import.meta.url }; }`
- `SharedArrayBuffer`: A polyfill may be needed for certain environments to prevent crashes.

### 3.3. API Design: Encoders, Decoders, and Optimizers

The function signatures and data types should be consistent based on the codec's purpose:

- **Encoders**:
  - **Input**: `ImageInput` (`{ data: Uint8Array | Uint8ClampedArray, width: number, height: number }`).
  - **Output**: `Promise<Uint8Array>` (the encoded file buffer).
  - **Function Name**: `encode`.

- **Decoders**:
  - **Input**: `BufferSource` (e.g., a `Uint8Array` of the file to be decoded).
  - **Output**: `Promise<ImageInput>` (the decoded raw pixel data).
  - **Function Name**: `decode`.

- **Optimizers** (for OxiPNG, ImageQuant):
  - **Input**: `BufferSource` (the unoptimized file buffer, e.g., a PNG).
  - **Output**: `Promise<Uint8Array>` (the optimized file buffer).
  - **Function Name**: `optimize`.

This distinction is critical for defining the correct types in `src/types.ts` and implementing the correct data handling in the worker.

---

## 4. Implementation Plan by Codec

### Task Group 1: Add AVIF Support (`@squoosh-kit/avif`)

- [ ] **Package**: Create the `packages/avif` directory and all template files (`package.json`, `build.ts`, etc.).
- [ ] **Assets**: Implement `scripts/copy-assets.ts` to copy `avif_enc*` and `avif_dec*` files from `.squoosh-temp/codecs/avif/`. Pay special attention to the `_mt` (multi-threaded) versions.
- [ ] **API**: Implement `encode` and `decode` in `src/index.ts`.
- [ ] **Types**: Define `AvifEncodeOptions` and `AvifDecodeOptions` in `src/types.ts`.
- [ ] **Validation**: Create `src/validators.ts` with `validateAvifEncodeOptions` and `validateAvifDecodeOptions`.
- [ ] **Logic**: Implement `avif.worker.ts` and `bridge.ts`. The worker must include the advanced loader strategy to handle the multi-threaded (`_mt`) encoder.
- [ ] **Testing**: Create `test/avif.test.ts` with tests for encoding and decoding.
- [ ] **Docs**: Write `README.md` for the `@squoosh-kit/avif` package.

### Task Group 2: Add MozJPEG Support (`@squoosh-kit/mozjpeg`)

- [ ] **Package**: Create the `packages/mozjpeg` directory and all template files.
- [ ] **Assets**: Implement `scripts/copy-assets.ts` to copy `mozjpeg_enc*` and `mozjpeg_dec*` files from `.squoosh-temp/codecs/mozjpeg/`.
- [ ] **API**: Implement `encode` and `decode` in `src/index.ts`.
- [ ] **Types**: Define `MozjpegEncodeOptions` and `MozjpegDecodeOptions` in `src/types.ts`.
- [ ] **Validation**: Create `src/validators.ts` with `validateMozjpegEncodeOptions` and `validateMozjpegDecodeOptions`.
- [ ] **Logic**: Implement `mozjpeg.worker.ts` and `bridge.ts`.
- [ ] **Testing**: Create `test/mozjpeg.test.ts`.
- [ ] **Docs**: Write `README.md` for the `@squoosh-kit/mozjpeg` package.

### Task Group 3: Add JXL Support (`@squoosh-kit/jxl`)

- [ ] **Package**: Create the `packages/jxl` directory and all template files.
- [ ] **Assets**: Implement `scripts/copy-assets.ts` to copy `jxl_enc*` and `jxl_dec*` files from `.squoosh-temp/codecs/jxl/`. Note the `_mt` and `_simd` versions.
- [ ] **API**: Implement `encode` and `decode` in `src/index.ts`.
- [ ] **Types**: Define `JxlEncodeOptions` and `JxlDecodeOptions` in `src/types.ts`.
- [ ] **Validation**: Create `src/validators.ts` with `validateJxlEncodeOptions` and `validateJxlDecodeOptions`.
- [ ] **Logic**: Implement `jxl.worker.ts` and `bridge.ts`, using the advanced loader strategy to handle SIMD and multi-threaded modules.
- [ ] **Testing**: Create `test/jxl.test.ts`.
- [ ] **Docs**: Write `README.md` for the `@squoosh-kit/jxl` package.

### Task Group 4: Add OxiPNG Support (`@squoosh-kit/oxipng`)

- [ ] **Package**: Create the `packages/oxipng` directory and all template files.
- [ ] **Assets**: Implement `scripts/copy-assets.ts` to copy `squoosh_oxipng*` files from `.squoosh-temp/codecs/oxipng/pkg/`. Note the `pkg-parallel` version.
- [ ] **API**: Implement an `optimize` function in `src/index.ts` (Input: `BufferSource`, Output: `Promise<Uint8Array>`).
- [ ] **Types**: Define `OxipngOptions` in `src/types.ts`.
- [ ] **Validation**: Create `src/validators.ts` with `validateOxipngOptions`.
- [ ] **Logic**: Implement `oxipng.worker.ts` and `bridge.ts`, using the advanced loader for the parallel version.
- [ ] **Testing**: Create `test/oxipng.test.ts`.
- [ ] **Docs**: Write `README.md` for the `@squoosh-kit/oxipng` package.

### Task Group 5: Add ImageQuant Support (`@squoosh-kit/imagequant`)

- [ ] **Package**: Create the `packages/imagequant` directory and all template files.
- [ ] **Assets**: Implement `scripts/copy-assets.ts` to copy `imagequant*` files from `.squoosh-temp/codecs/imagequant/`.
- [ ] **API**: Implement an `optimize` function in `src/index.ts` (Input: `BufferSource`, Output: `Promise<Uint8Array>`).
- [ ] **Types**: Define `ImagequantOptions` in `src/types.ts`.
- [ ] **Validation**: Create `src/validators.ts` with `validateImagequantOptions`.
- [ ] **Logic**: Implement `imagequant.worker.ts` and `bridge.ts`.
- [ ] **Testing**: Create `test/imagequant.test.ts`.
- [ ] **Docs**: Write `README.md` for the `@squoosh-kit/imagequant` package.

### Task Group 6: Extend `@squoosh-kit/webp` with Decoder

- [ ] **Assets**: Update `packages/webp/scripts/copy-assets.ts` to also copy `webp_dec*` files from `.squoosh-temp/codecs/webp/dec/`.
- [ ] **API**: Add a `decode` function and `createWebpDecoder` factory to `packages/webp/src/index.ts`.
- [ ] **Types**: Add `WebpDecodeOptions` to `packages/webp/src/types.ts`.
- [ ] **Validation**: Add `validateWebpDecodeOptions` to `packages/webp/src/validators.ts`.
- [ ] **Logic**: Update `packages/webp/src/webp.worker.ts` and `bridge.ts` to handle decoding requests.
- [ ] **Testing**: Add tests for decoding to `packages/webp/test/webp.test.ts`.
- [ ] **Docs**: Update `packages/webp/README.md` to document the new decoding functionality.

---

## 5. General Improvements

- [ ] **Update Root `README.md`**: Add the new packages to the list of available modules.
- [ ] **Update Example App**: Add examples for the new codecs to `apps/example/src/ImageProcessor.tsx` to provide a live demonstration.
- [ ] **Review `@squoosh-kit/runtime`**: Ensure the runtime's utilities are generic enough for all codec operations (encode, decode, optimize).

### 5.1. Detailed Review of `@squoosh-kit/runtime`

To support `decode` and `optimize` operations, the `@squoosh-kit/runtime` package requires the following enhancements to its shared utilities:

- **[ ] `packages/runtime/src/types.ts`**: Add a type alias for buffer inputs to standardize the API for decoders and optimizers.

  ```typescript
  /**
   * Represents a buffer that can be processed by squoosh-kit decoders and optimizers.
   * It is an alias for the built-in BufferSource type.
   */
  export type InputBuffer = BufferSource;
  ```

- **[ ] `packages/runtime/src/validators.ts`**: Add a new validation function for `InputBuffer` to ensure that decoders and optimizers receive valid, non-shared buffers.

  ```typescript
  export function validateBufferSource(
    buffer: unknown
  ): asserts buffer is BufferSource {
    if (!buffer) {
      throw new TypeError('Input buffer is required');
    }

    if (ArrayBuffer.isView(buffer)) {
      validateArrayBuffer(buffer.buffer);
    } else if (buffer instanceof ArrayBuffer) {
      validateArrayBuffer(buffer);
    } else {
      throw new TypeError(
        'Input must be an ArrayBuffer or a view (e.g., Uint8Array)'
      );
    }
  }
  ```

- **[ ] `packages/runtime/src/worker-helper.ts`**: The `workerMap` inside the `createCodecWorker` function acts as a registry for all codec workers. For each new codec package, this map must be updated with a new entry.

  _Example entry for the AVIF codec:_

  ```typescript
  const workerMap: Record<string, { package: string; specifier: string }> = {
    'resize.worker.js': {
      /* ... */
    },
    'webp.worker.js': {
      /* ... */
    },
    'avif.worker.js': {
      package: '@squoosh-kit/avif',
      specifier: 'avif.worker.js',
    },
    // ... other codecs
  };
  ```
