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

  moduleLoadingPromise = (async () => {
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

      // Load WASM binary with robust fallback strategies
      // Try multiple paths to support both development (../wasm) and npm installed (./wasm) scenarios
      let wasmBuffer: ArrayBuffer | null = null;
      const pathsToTry = [
        new URL(/* @vite-ignore */ './wasm/webp/webp_enc.wasm', import.meta.url)
          .href,
        new URL(
          /* @vite-ignore */ '../wasm/webp/webp_enc.wasm',
          import.meta.url
        ).href,
      ];

      let lastError: Error | null = null;
      for (const path of pathsToTry) {
        try {
          wasmBuffer = await loadWasmBinary(path);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          // Continue to next path
        }
      }

      if (!wasmBuffer) {
        throw (
          lastError || new Error('Could not load WASM binary from any path')
        );
      }

      // Initialize WASM module by passing buffer as wasmBinary
      // The Emscripten-compiled module will use this instead of trying to fetch
      const module = await webp_enc({ wasmBinary: wasmBuffer });
      cachedModule = module;

      if (!cachedModule) {
        throw new Error('Failed to load WASM module');
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
 * Balanced for quality and file size
 */
function createEncodeOptions(options?: EncodeInputOptions): EncodeOptions {
  const quality = Math.max(0, Math.min(100, options?.quality ?? 82));
  const lossless = options?.lossless ?? false;
  const nearLossless = options?.near_lossless ?? false;

  // Select method based on quality: faster for high quality, more thorough for lower quality
  const method = (options?.method ?? quality >= 80) ? 3 : quality >= 60 ? 4 : 5;

  // Scale compression parameters with quality
  const filterStrength = quality >= 80 ? 0 : quality >= 60 ? 30 : 50;
  const snsStrength = quality >= 80 ? 50 : 75;
  const passes = quality >= 80 ? 2 : 3;

  return {
    quality,
    target_size: 0,
    target_PSNR: 0,
    method,
    sns_strength: snsStrength,
    filter_strength: filterStrength,
    filter_sharpness: 0,
    filter_type: 1,
    partitions: 0,
    segments: 4,
    pass: passes,
    show_compressed: 0,
    preprocessing: lossless ? 0 : 1,
    autofilter: 1,
    partition_limit: 0,
    alpha_compression: 1,
    alpha_filtering: 1,
    alpha_quality: quality >= 80 ? 100 : 88,
    lossless: lossless ? 1 : 0,
    exact: 0,
    image_hint: 0,
    emulate_jpeg_size: 0,
    thread_level: 0,
    low_memory: 0,
    near_lossless: nearLossless ? quality : 100,
    use_delta_palette: 0,
    use_sharp_yuv: 1,
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

  const module = await loadWebPModule();

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

  const result = module.encode(dataArray, width, height, encodeOptions);

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

        const controller = new AbortController();
        const result = await webpEncodeClient(
          image,
          options,
          controller.signal
        );

        response.ok = true;
        response.data = result;

        // Transfer the result buffer back directly from the response data
        const resultBuffer: ArrayBuffer = response.data.buffer as ArrayBuffer;
        self.postMessage(response, [resultBuffer]);
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
