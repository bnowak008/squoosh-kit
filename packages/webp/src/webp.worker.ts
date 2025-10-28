/**
 * WebP encoder - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
  validateWebpOptions,
  detectSimd,
} from '@squoosh-kit/runtime';
import webp_enc, { type WebPModule } from '../wasm/webp/webp_enc';
import type { EncodeInputOptions, EncodeOptions } from './types';

let cachedModule: WebPModule | null = null;
let moduleLoadingPromise: Promise<WebPModule> | null = null;

async function loadWebPModule(): Promise<WebPModule> {
  if (cachedModule) {
    return cachedModule;
  }

  if (moduleLoadingPromise) {
    return moduleLoadingPromise;
  }

  moduleLoadingPromise = (async (): Promise<WebPModule> => {
    try {
      // Environment polyfills for Emscripten-generated code
      // The WebP encoder WASM module expects browser-like globals (self, location)
      // These polyfills ensure compatibility when running in Bun/Node.js environments

      // Polyfill 'self' global for Emscripten compatibility
      if (typeof self === 'undefined') {
        (global as { self?: typeof globalThis }).self = global;
      }

      // Polyfill 'location' object for Emscripten module initialization
      if (typeof self !== 'undefined' && !self.location) {
        (self as { location?: { href: string } }).location = {
          href: import.meta.url,
        };
      }

      // Polyfill SharedArrayBuffer for worker contexts without COOP/COEP headers
      if (
        typeof SharedArrayBuffer === 'undefined' &&
        typeof window === 'undefined'
      ) {
        (
          globalThis as unknown as Record<string, typeof ArrayBuffer>
        ).SharedArrayBuffer = ArrayBuffer;
      }

      // Helper function to load WASM and initialize with explicit binary
      const initModuleWithBinary = async (
        moduleFactory: (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<WebPModule>,
        wasmPath: string
      ): Promise<WebPModule> => {
        try {
          // Try to load WASM binary
          const wasmBuffer = await loadWasmBinary(wasmPath);
          if (typeof console !== 'undefined' && console.log) {
            console.log(
              `[WebP] Loaded WASM binary from ${wasmPath} (${(wasmBuffer.byteLength / 1024).toFixed(1)}KB)`
            );
          }
          return moduleFactory({ noInitialRun: true, wasmBinary: wasmBuffer });
        } catch (error) {
          // Fallback: try without explicit binary
          if (typeof console !== 'undefined' && console.warn) {
            console.warn(
              '[WebP] Failed to load WASM binary explicitly, trying module initialization without it:',
              error
            );
          }
          return moduleFactory({ noInitialRun: true });
        }
      };

      // Detect SIMD support and load appropriate module
      const simdSupported = await detectSimd();

      if (simdSupported) {
        if (typeof console !== 'undefined' && console.log) {
          console.log('[WebP] SIMD support detected, loading SIMD encoder');
        }
        try {
          // Try to load SIMD-optimized encoder dynamically
          // Import the precompiled SIMD module - it's a standalone Emscripten module factory
          const simdModuleFactory = await import(
            /* @vite-ignore */ '../wasm/webp/webp_enc_simd.js'
          );
          cachedModule = await initModuleWithBinary(
            simdModuleFactory.default as (config: {
              noInitialRun: boolean;
              wasmBinary?: ArrayBuffer;
            }) => Promise<WebPModule>,
            /* @vite-ignore */ './wasm/webp/webp_enc_simd.wasm'
          );
          if (cachedModule) {
            return cachedModule;
          }
        } catch (simdError) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn(
              '[WebP] Failed to load SIMD encoder, falling back to standard:',
              simdError
            );
          }
          // Fall through to standard encoder
        }
      }

      // Load standard (non-SIMD) encoder as fallback
      cachedModule = await initModuleWithBinary(
        webp_enc as (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<WebPModule>,
        /* @vite-ignore */ './wasm/webp/webp_enc.wasm'
      );

      if (!cachedModule) {
        throw new Error('Failed to load WebP module');
      }

      return cachedModule;
    } catch (error) {
      moduleLoadingPromise = null;
      throw new Error(
        `Failed to load WebP module: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  })();

  return moduleLoadingPromise;
}

/**
 * Convert our simplified options to full EncodeOptions
 * Uses Squoosh defaults for optimal performance and file size
 */
function createEncodeOptions(options?: EncodeInputOptions): EncodeOptions {
  // Squoosh defaults from their defaultOptions in meta.ts
  return {
    quality: options?.quality ?? 75,
    target_size: 0,
    target_PSNR: 0,
    method: options?.method ?? 4,
    sns_strength: options?.sns_strength ?? 50,
    filter_strength: options?.filter_strength ?? 60,
    filter_sharpness: options?.filter_sharpness ?? 0,
    filter_type: options?.filter_type ?? 1,
    partitions: options?.partitions ?? 0,
    segments: options?.segments ?? 4,
    pass: options?.pass ?? 1,
    show_compressed: 0,
    preprocessing: options?.preprocessing ?? 0,
    autofilter: options?.autofilter ?? 0,
    partition_limit: 0,
    alpha_compression: options?.alpha_compression ?? 1,
    alpha_filtering: options?.alpha_filtering ?? 1,
    alpha_quality: options?.alpha_quality ?? options?.quality ?? 75,
    lossless: options?.lossless ? 1 : 0,
    exact: options?.exact ?? 0,
    image_hint: options?.image_hint ?? 0,
    emulate_jpeg_size: 0,
    thread_level: 0,
    low_memory: 0,
    near_lossless: options?.near_lossless ?? options?.quality ?? 75,
    use_delta_palette: 0,
    use_sharp_yuv: options?.use_sharp_yuv ?? 0,
  };
}

/**
 * Client-mode WebP encoder (exported for direct use)
 */
export async function webpEncodeClient(
  image: ImageInput,
  options?: EncodeInputOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  // Validate inputs before starting
  validateImageInput(image);
  validateWebpOptions(options);

  // Check abort before starting
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Normalize image input
  const width = image.width;
  const height = image.height;
  const data = image.data;

  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error('Image data must be Uint8Array or Uint8ClampedArray');
  }

  const t0 = performance.now();
  const module = await loadWebPModule();
  const t1 = performance.now();

  if (typeof console !== 'undefined' && console.log) {
    console.log(`[WebP] module loading took ${(t1 - t0).toFixed(2)}ms`);
    console.log(
      `[WebP] Module type: ${cachedModule && 'encode' in cachedModule ? 'Ready' : 'Unknown'}`
    );
  }

  // Check abort after async operation
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const encodeOptions = createEncodeOptions(options);

  // Call the encode function with optimized data handling
  // Create a zero-copy Uint8Array view if needed (don't copy the buffer)
  const dataArray =
    data instanceof Uint8ClampedArray
      ? new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.length)
      : new Uint8Array(
          data.buffer as ArrayBuffer,
          data.byteOffset,
          data.length
        );

  if (typeof console !== 'undefined' && console.log) {
    console.log(`[WebP] encode options:`, encodeOptions);
  }

  const t2 = performance.now();
  const result = module.encode(dataArray, width, height, encodeOptions);
  const t3 = performance.now();

  if (typeof console !== 'undefined' && console.log) {
    console.log(`[WebP] actual encoding took ${(t3 - t2).toFixed(2)}ms`);
  }

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!result) {
    throw new Error('WebP encoding failed');
  }

  return result;
}

/**
 * Worker message handler
 * Register the handler regardless of environment (for both worker context and tests)
 */
if (typeof self !== 'undefined') {
  self.onmessage = async (event: MessageEvent) => {
    const data = event.data;

    // Handle worker ping for initialization
    if (data?.type === 'worker:ping') {
      self.postMessage({ type: 'worker:ready' });
      return;
    }

    const request = data as WorkerRequest<{
      image: ImageInput;
      options?: EncodeInputOptions;
    }>;

    const response: WorkerResponse<Uint8Array> = {
      id: request.id,
      ok: false,
    };

    try {
      if (request.type === 'webp:encode') {
        const { image, options } = request.payload;

        const t0 = performance.now();
        const controller = new AbortController();
        const result = await webpEncodeClient(
          image,
          options,
          controller.signal
        );
        const t1 = performance.now();

        if (typeof console !== 'undefined' && console.log) {
          console.log(`[WebP Worker] encode took ${(t1 - t0).toFixed(2)}ms`);
        }

        response.ok = true;
        response.data = result;

        // Post the response without transferring - the Uint8Array will be cloned
        // Transfer is only used for incoming requests (image.data buffer from client)
        self.postMessage(response);
      } else {
        response.error = `Unknown message type: ${request.type}`;
        self.postMessage(response);
      }
    } catch (error) {
      response.error = error instanceof Error ? error.message : String(error);
      self.postMessage(response);
    }
  };
}
