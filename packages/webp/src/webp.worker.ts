/**
 * WebP encoder/decoder - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
  detectSimd,
} from '@squoosh-kit/runtime';
import { validateWebpOptions } from './validators';
import { type WebPModule } from '../wasm/webp/webp_enc';
import type { WebPModule as WebPDecModule } from '../wasm/webp-dec/webp_dec';
import type { EncodeInputOptions, EncodeOptions } from './types';

let cachedModule: WebPModule | null = null;

async function loadWebPModule(): Promise<WebPModule> {
  if (cachedModule) {
    return cachedModule;
  }

  const simdSupported = await detectSimd();
  const modulePath = simdSupported
    ? 'webp/webp_enc_simd.js'
    : 'webp/webp_enc.js';

  try {
    console.log('[WebP Worker] Initializing. SIMD support:', simdSupported);
    console.log(
      `[WebP Worker] Attempting to import module from path: ${modulePath}`
    );

    // Mock self.location for test environments where it doesn't exist
    // Emscripten code tries to access self.location.href during initialization
    // We set it to import.meta.url so _scriptDir will be used instead
    const globalSelf = typeof self !== 'undefined' ? self : globalThis;
    if (!globalSelf.location) {
      (globalSelf as { location?: { href: string } }).location = {
        href: import.meta.url,
      };
    }
    // Also ensure self exists if it doesn't (for Emscripten code that checks ENVIRONMENT_IS_WORKER)
    if (typeof self === 'undefined' && typeof globalThis !== 'undefined') {
      (globalThis as { self?: typeof globalThis }).self = globalThis;
    }

    // Use a standard dynamic import instead of require, and tell Vite to ignore it
    // Using string concatenation to avoid bundler issues with template literals
    // Try both paths: '../wasm/' first when running from source (tests), './wasm/' first in dist
    let moduleFactory;
    const isSource = import.meta.url.includes('/src/');
    const pathsToTry = isSource
      ? ['../wasm/' + modulePath, './wasm/' + modulePath]
      : ['./wasm/' + modulePath, '../wasm/' + modulePath];

    let lastError: Error | null = null;
    for (const importPath of pathsToTry) {
      try {
        moduleFactory = (await import(/* @vite-ignore */ importPath)).default;
        console.log(
          `[WebP Worker] Successfully loaded module from: ${importPath}`
        );
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `[WebP Worker] Failed to load from ${importPath}, trying next path...`
        );
      }
    }

    if (!moduleFactory) {
      throw lastError || new Error('Could not load WebP module from any path');
    }

    console.log('[WebP Worker] Module factory loaded successfully.');

    // Try both paths for WASM binary as well
    const wasmPathsToTry = simdSupported
      ? isSource
        ? ['../wasm/webp/webp_enc_simd.wasm', './wasm/webp/webp_enc_simd.wasm']
        : ['./wasm/webp/webp_enc_simd.wasm', '../wasm/webp/webp_enc_simd.wasm']
      : isSource
        ? ['../wasm/webp/webp_enc.wasm', './wasm/webp/webp_enc.wasm']
        : ['./wasm/webp/webp_enc.wasm', '../wasm/webp/webp_enc.wasm'];

    console.log(
      `[WebP Worker] Preparing to load WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
    );

    const initModuleWithBinary = async (
      moduleFactory: (config: {
        noInitialRun: boolean;
        wasmBinary?: ArrayBuffer;
      }) => Promise<WebPModule>,
      wasmPaths: string[]
    ): Promise<WebPModule> => {
      // Use the worker's own import.meta.url as the base for resolving WASM paths
      const workerBaseUrl = new URL('.', import.meta.url);
      let lastError: Error | null = null;
      for (const wasmPath of wasmPaths) {
        try {
          console.log(
            `[WebP Worker] Calling loadWasmBinary with path: ${wasmPath}`
          );
          const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
          console.log(
            `[WebP Worker] Successfully fetched WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
          );

          // Ensure self.location exists right before calling moduleFactory
          // Emscripten code accesses self.location.href when the factory is executed
          const globalSelf = typeof self !== 'undefined' ? self : globalThis;
          if (!globalSelf.location) {
            (globalSelf as { location?: { href: string } }).location = {
              href: import.meta.url,
            };
          }
          if (
            typeof self === 'undefined' &&
            typeof globalThis !== 'undefined'
          ) {
            (globalThis as { self?: typeof globalThis }).self = globalThis;
          }

          return await moduleFactory({
            noInitialRun: true,
            wasmBinary,
          });
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(
            `[WebP Worker] Failed to load WASM from ${wasmPath}, trying next path...`
          );
        }
      }
      throw (
        lastError ||
        new Error('Could not load WASM binary from any of the attempted paths')
      );
    };

    cachedModule = await initModuleWithBinary(moduleFactory, wasmPathsToTry);
    console.log('[WebP Worker] WebP module initialized successfully.');
    return cachedModule;
  } catch (err) {
    console.error(
      `[WebP Worker] CRITICAL: Failed to load WebP module from path: ${modulePath}`,
      err
    );
    throw err;
  }
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

let cachedDecModule: WebPDecModule | null = null;

async function loadWebPDecModule(): Promise<WebPDecModule> {
  if (cachedDecModule) {
    return cachedDecModule;
  }

  // No SIMD variant available for the WebP decoder
  const modulePath = 'webp-dec/webp_dec.js';

  try {
    console.log('[WebP Worker] Initializing dec module...');
    console.log(
      `[WebP Worker] Attempting to import dec module from path: ${modulePath}`
    );

    const globalSelf = typeof self !== 'undefined' ? self : globalThis;
    if (!globalSelf.location) {
      (globalSelf as { location?: { href: string } }).location = {
        href: import.meta.url,
      };
    }
    if (typeof self === 'undefined' && typeof globalThis !== 'undefined') {
      (globalThis as { self?: typeof globalThis }).self = globalThis;
    }

    // Polyfill ImageData for Node/Bun environments where it's not available
    if (typeof ImageData === 'undefined') {
      (
        globalThis as {
          ImageData?: new (
            data: Uint8ClampedArray,
            width: number,
            height: number
          ) => ImageData;
        }
      ).ImageData = class {
        data: Uint8ClampedArray;
        width: number;
        height: number;
        colorSpace = 'srgb' as PredefinedColorSpace;
        constructor(data: Uint8ClampedArray, width: number, height: number) {
          this.data = data;
          this.width = width;
          this.height = height;
        }
      } as unknown as typeof ImageData;
    }

    let moduleFactory;
    const isSource = import.meta.url.includes('/src/');
    const pathsToTry = isSource
      ? ['../wasm/' + modulePath, './wasm/' + modulePath]
      : ['./wasm/' + modulePath, '../wasm/' + modulePath];

    let lastError: Error | null = null;
    for (const importPath of pathsToTry) {
      try {
        moduleFactory = (await import(/* @vite-ignore */ importPath)).default;
        console.log(
          `[WebP Worker] Successfully loaded dec module from: ${importPath}`
        );
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `[WebP Worker] Failed to load dec from ${importPath}, trying next path...`
        );
      }
    }

    if (!moduleFactory) {
      throw (
        lastError || new Error('Could not load WebP dec module from any path')
      );
    }

    console.log('[WebP Worker] Dec module factory loaded successfully.');

    const wasmPathsToTry = isSource
      ? ['../wasm/webp-dec/webp_dec.wasm', './wasm/webp-dec/webp_dec.wasm']
      : ['./wasm/webp-dec/webp_dec.wasm', '../wasm/webp-dec/webp_dec.wasm'];

    console.log(
      `[WebP Worker] Preparing to load dec WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
    );

    const initDecModuleWithBinary = async (
      moduleFactory: (config: {
        noInitialRun: boolean;
        wasmBinary?: ArrayBuffer;
      }) => Promise<WebPDecModule>,
      wasmPaths: string[]
    ): Promise<WebPDecModule> => {
      const workerBaseUrl = new URL('.', import.meta.url);
      let lastError: Error | null = null;
      for (const wasmPath of wasmPaths) {
        try {
          console.log(
            `[WebP Worker] Calling loadWasmBinary with dec path: ${wasmPath}`
          );
          const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
          console.log(
            `[WebP Worker] Successfully fetched dec WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
          );

          const globalSelf = typeof self !== 'undefined' ? self : globalThis;
          if (!globalSelf.location) {
            (globalSelf as { location?: { href: string } }).location = {
              href: import.meta.url,
            };
          }
          if (
            typeof self === 'undefined' &&
            typeof globalThis !== 'undefined'
          ) {
            (globalThis as { self?: typeof globalThis }).self = globalThis;
          }

          return await moduleFactory({
            noInitialRun: true,
            wasmBinary,
          });
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(
            `[WebP Worker] Failed to load dec WASM from ${wasmPath}, trying next path...`
          );
        }
      }
      throw (
        lastError ||
        new Error(
          'Could not load dec WASM binary from any of the attempted paths'
        )
      );
    };

    cachedDecModule = await initDecModuleWithBinary(
      moduleFactory,
      wasmPathsToTry
    );
    console.log('[WebP Worker] WebP dec module initialized successfully.');
    return cachedDecModule;
  } catch (err) {
    console.error(
      '[WebP Worker] CRITICAL: Failed to load WebP dec module',
      err
    );
    throw err;
  }
}

/**
 * Client-mode WebP decoder (exported for direct use)
 */
export async function webpDecodeClient(
  data: BufferSource,
  signal?: AbortSignal
): Promise<ImageData> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const module = await loadWebPDecModule();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const result = module.decode(data);

  if (!result) {
    throw new Error('WebP decoding failed');
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

    if (data?.type === 'webp:encode') {
      const request = data as WorkerRequest<{
        image: ImageInput;
        options?: EncodeInputOptions;
      }>;

      const response: WorkerResponse<Uint8Array> = {
        id: request.id,
        ok: false,
      };

      try {
        const { image, options } = request.payload;
        const result = await webpEncodeClient(image, options);
        response.ok = true;
        response.data = result;
        self.postMessage(response);
      } catch (error) {
        response.error = error instanceof Error ? error.message : String(error);
        self.postMessage(response);
      }
      return;
    }

    if (data?.type === 'webp:decode') {
      const request = data as WorkerRequest<{ data: BufferSource }>;

      const response: WorkerResponse<ImageData> = {
        id: request.id,
        ok: false,
      };

      try {
        const result = await webpDecodeClient(request.payload.data);
        response.ok = true;
        response.data = result;
        self.postMessage(response);
      } catch (error) {
        response.error = error instanceof Error ? error.message : String(error);
        self.postMessage(response);
      }
      return;
    }

    // Unknown message type
    const request = data as WorkerRequest<unknown>;
    const response: WorkerResponse<never> = {
      id: request.id,
      ok: false,
      error: `Unknown message type: ${data?.type}`,
    };
    self.postMessage(response);
  };
}
