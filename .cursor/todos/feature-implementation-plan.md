# Squoosh-Lite Feature Implementation Plan

This document outlines the plan to implement additional codecs and features from the original Squoosh project into `squoosh-lite`.

## Analysis Summary

The current `squoosh-lite` project supports WebP encoding and image resizing. The architecture uses a worker bridge to offload heavy processing to a separate thread, which is a solid foundation. The `scripts/copy-codecs.ts` script handles bringing in pre-built WASM codecs from a fork of the Squoosh repository.

The original Squoosh project supports several other codecs: MozJPEG, AVIF, and OxiPNG for optimization. It also has a WebP decoder, which is currently present in the `squoosh-lite` `wasm` directory but not exposed through an API.

The implementation for each new feature will follow the existing pattern:
1.  Update the `copy-codecs.ts` script to bring in the necessary WASM and JS glue files.
2.  Create a new feature directory under `src/features/`.
3.  Implement the public API in `index.ts` for the feature.
4.  Implement the worker logic in a `*.worker.ts` file.
5.  Update `package.json` to export the new feature module and include it in the build process.
6.  Add an example usage in `examples/demo.ts`.
7.  Add integration tests for the new feature.

## Implementation Plan

### Task Group 1: Add MozJPEG Support
- [ ] Update `scripts/copy-codecs.ts` to copy MozJPEG encoder files from `codecs/mozjpeg/enc` in the Squoosh repo.
- [ ] Create `src/features/mozjpeg/index.ts` with `encode` and `createMozjpegEncoder` functions.
- [ ] Create `src/features/mozjpeg/mozjpeg.worker.ts` to handle the encoding logic, similar to the WebP worker.
- [ ] Update `package.json` `exports` to include `./mozjpeg`.
- [ ] Update `package.json` `build:code` script to include the new MozJPEG files.
- [ ] Add a MozJPEG example to `examples/demo.ts` to demonstrate usage.
- [ ] Create `test/mozjpeg.test.ts` with integration tests to verify encoding.

### Task Group 2: Add AVIF Support
- [ ] Update `scripts/copy-codecs.ts` to copy AVIF encoder files from `codecs/avif/enc`.
- [ ] Create `src/features/avif/index.ts` with `encode` and `createAvifEncoder` functions.
- [ ] Create `src/features/avif/avif.worker.ts` to handle AVIF encoding.
- [ ] Update `package.json` `exports` to include `./avif`.
- [ ] Update `package.json` `build:code` script for the new AVIF files.
- [ ] Add an AVIF example to `examples/demo.ts`.
- [ ] Create `test/avif.test.ts` with integration tests.

### Task Group 3: Add OxiPNG Support
OxiPNG is an optimizer, not an encoder. The API will likely take PNG data and return optimized PNG data.
- [ ] Update `scripts/copy-codecs.ts` to copy OxiPNG files from `codecs/oxipng/pkg`.
- [ ] Create `src/features/oxipng/index.ts` with an `optimize` and `createOxipngOptimizer` function.
- [ ] Create `src/features/oxipng/oxipng.worker.ts` to handle the optimization logic.
- [ ] Update `package.json` `exports` to include `./oxipng`.
- [ ] Update `package.json` `build:code` script for the new OxiPNG files.
- [ ] Add an OxiPNG example to `examples/demo.ts`.
- [ ] Create `test/oxipng.test.ts` with integration tests.

### Task Group 4: Expose WebP Decoder
The WASM files for the WebP decoder are already being copied. This task involves exposing them via an API.
- [ ] Verify WebP decoder WASM is copied to `wasm/webp-dec/`.
- [ ] Create `src/features/webp-dec/index.ts` with `decode` and `createWebpDecoder` functions.
- [ ] Create `src/features/webp-dec/webp-dec.worker.ts` to handle the decoding logic. The output should be image data (`{ data, width, height }`).
- [ ] Update `package.json` `exports` to include `./webp-dec`.
- [ ] Update `package.json` `build:code` script for the new WebP decoder files.
- [ ] Add a WebP decoding example to `examples/demo.ts`.
- [ ] Create `test/webp-dec.test.ts` with integration tests.

### Task Group 5: Refactoring and General Improvements
- [ ] Refactor `scripts/copy-codecs.ts` to be more modular and data-driven to make adding future codecs easier.
- [ ] Update the project `README.md` to document all the new features and how to use them.
- [ ] Review the `worker-bridge.ts` and other runtime components to ensure they are generic enough for all codec operations (encoding, decoding, optimizing).
