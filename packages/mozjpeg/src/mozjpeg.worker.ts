/**
 * MozJPEG encoder/decoder - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
  polyfillImageData,
  isBun,
  isNode,
  isBrowser,
} from '@squoosh-kit/runtime';
import { validateMozjpegOptions } from './validators';
import type { MozJPEGModule } from '../wasm/mozjpeg-enc/mozjpeg_enc';

// MozJpegColorSpace is a const enum — define values manually to avoid runtime import issues
const MozJpegColorSpace = { GRAYSCALE: 1, RGB: 2, YCbCr: 3 } as const;
import type { MozjpegEncodeOptions, MozJPEGDecModule } from './types';

let cachedEncModule: MozJPEGModule | null = null;
let cachedDecModule: MozJPEGDecModule | null = null;
let loadEncModulePromise: Promise<MozJPEGModule> | null = null;
let loadDecModulePromise: Promise<MozJPEGDecModule> | null = null;

async function loadMozjpegModule(): Promise<MozJPEGModule> {
  if (cachedEncModule) return cachedEncModule;
  if (loadEncModulePromise) return loadEncModulePromise;
  loadEncModulePromise = (async () => {
    // Emscripten polyfills - required before any module loading
    const globalSelf = typeof self !== 'undefined' ? self : globalThis;
    if (!globalSelf.location) {
      (globalSelf as { location?: { href: string } }).location = {
        href: import.meta.url,
      };
    }
    if (typeof self === 'undefined' && typeof globalThis !== 'undefined') {
      (globalThis as { self?: typeof globalThis }).self = globalThis;
    }

    const useNode = isBun() || isNode();
    // Node/Bun: use node-specific encoder; Browser: use standard encoder
    const modulePath = useNode
      ? 'mozjpeg-enc/mozjpeg_node_enc.js'
      : 'mozjpeg-enc/mozjpeg_enc.js';

    try {
      console.log('[MozJPEG Worker] Initializing encoder. Node/Bun:', useNode);
      console.log(
        `[MozJPEG Worker] Attempting to import encoder module from path: ${modulePath}`
      );

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
            `[MozJPEG Worker] Successfully loaded encoder module from: ${importPath}`
          );
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(
            `[MozJPEG Worker] Failed to load encoder from ${importPath}, trying next path...`
          );
        }
      }

      if (!moduleFactory) {
        throw (
          lastError ||
          new Error('Could not load MozJPEG encoder module from any path')
        );
      }

      console.log(
        '[MozJPEG Worker] Encoder module factory loaded successfully.'
      );

      const wasmFileName = useNode
        ? 'mozjpeg_node_enc.wasm'
        : 'mozjpeg_enc.wasm';
      const wasmPathsToTry = isSource
        ? [
            `../wasm/mozjpeg-enc/${wasmFileName}`,
            `./wasm/mozjpeg-enc/${wasmFileName}`,
          ]
        : [
            `./wasm/mozjpeg-enc/${wasmFileName}`,
            `../wasm/mozjpeg-enc/${wasmFileName}`,
          ];

      console.log(
        `[MozJPEG Worker] Preparing to load encoder WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
      );

      const initModuleWithBinary = async (
        factory: (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<MozJPEGModule>,
        wasmPaths: string[]
      ): Promise<MozJPEGModule> => {
        const workerBaseUrl = new URL('.', import.meta.url);
        let lastErr: Error | null = null;
        for (const wasmPath of wasmPaths) {
          try {
            console.log(
              `[MozJPEG Worker] Calling loadWasmBinary with path: ${wasmPath}`
            );
            const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
            console.log(
              `[MozJPEG Worker] Successfully fetched encoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
            );

            // Ensure self.location exists right before calling factory
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

            return await factory({
              noInitialRun: true,
              wasmBinary,
            });
          } catch (err) {
            lastErr = err instanceof Error ? err : new Error(String(err));
            console.warn(
              `[MozJPEG Worker] Failed to load encoder WASM from ${wasmPath}, trying next path...`
            );
          }
        }
        throw (
          lastErr ||
          new Error(
            'Could not load encoder WASM binary from any of the attempted paths'
          )
        );
      };

      cachedEncModule = await initModuleWithBinary(
        moduleFactory,
        wasmPathsToTry
      );
      console.log(
        '[MozJPEG Worker] MozJPEG encoder module initialized successfully.'
      );
      return cachedEncModule;
    } catch (err) {
      console.error(
        `[MozJPEG Worker] CRITICAL: Failed to load MozJPEG encoder module from path: ${modulePath}`,
        err
      );
      throw err;
    }
  })().catch((err: unknown) => {
    loadEncModulePromise = null;
    throw err;
  });
  return loadEncModulePromise;
}

async function loadMozjpegNodeDecModule(): Promise<MozJPEGDecModule> {
  if (cachedDecModule) return cachedDecModule;
  if (loadDecModulePromise) return loadDecModulePromise;
  loadDecModulePromise = (async () => {
    // Emscripten polyfills
    const globalSelf = typeof self !== 'undefined' ? self : globalThis;
    if (!globalSelf.location) {
      (globalSelf as { location?: { href: string } }).location = {
        href: import.meta.url,
      };
    }
    if (typeof self === 'undefined' && typeof globalThis !== 'undefined') {
      (globalThis as { self?: typeof globalThis }).self = globalThis;
    }

    // Polyfill ImageData for Node/Bun environments
    polyfillImageData();

    // Only node/bun decoder is available
    const modulePath = 'mozjpeg-dec/mozjpeg_node_dec.js';

    try {
      console.log('[MozJPEG Worker] Initializing node decoder...');
      console.log(
        `[MozJPEG Worker] Attempting to import decoder module from path: ${modulePath}`
      );

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
            `[MozJPEG Worker] Successfully loaded decoder module from: ${importPath}`
          );
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(
            `[MozJPEG Worker] Failed to load decoder from ${importPath}, trying next path...`
          );
        }
      }

      if (!moduleFactory) {
        throw (
          lastError ||
          new Error('Could not load MozJPEG decoder module from any path')
        );
      }

      console.log(
        '[MozJPEG Worker] Decoder module factory loaded successfully.'
      );

      const wasmPathsToTry = isSource
        ? [
            '../wasm/mozjpeg-dec/mozjpeg_node_dec.wasm',
            './wasm/mozjpeg-dec/mozjpeg_node_dec.wasm',
          ]
        : [
            './wasm/mozjpeg-dec/mozjpeg_node_dec.wasm',
            '../wasm/mozjpeg-dec/mozjpeg_node_dec.wasm',
          ];

      console.log(
        `[MozJPEG Worker] Preparing to load decoder WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
      );

      const initDecModuleWithBinary = async (
        factory: (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<MozJPEGDecModule>,
        wasmPaths: string[]
      ): Promise<MozJPEGDecModule> => {
        const workerBaseUrl = new URL('.', import.meta.url);
        let lastErr: Error | null = null;
        for (const wasmPath of wasmPaths) {
          try {
            console.log(
              `[MozJPEG Worker] Calling loadWasmBinary with path: ${wasmPath}`
            );
            const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
            console.log(
              `[MozJPEG Worker] Successfully fetched decoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
            );

            // Ensure self.location exists right before calling factory
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

            return await factory({
              noInitialRun: true,
              wasmBinary,
            });
          } catch (err) {
            lastErr = err instanceof Error ? err : new Error(String(err));
            console.warn(
              `[MozJPEG Worker] Failed to load decoder WASM from ${wasmPath}, trying next path...`
            );
          }
        }
        throw (
          lastErr ||
          new Error(
            'Could not load decoder WASM binary from any of the attempted paths'
          )
        );
      };

      cachedDecModule = await initDecModuleWithBinary(
        moduleFactory,
        wasmPathsToTry
      );
      console.log(
        '[MozJPEG Worker] MozJPEG decoder module initialized successfully.'
      );
      return cachedDecModule;
    } catch (err) {
      console.error(
        '[MozJPEG Worker] CRITICAL: Failed to load MozJPEG decoder module',
        err
      );
      throw err;
    }
  })().catch((err: unknown) => {
    loadDecModulePromise = null;
    throw err;
  });
  return loadDecModulePromise;
}

/**
 * Convert partial options to full EncodeOptions with Squoosh defaults
 */
function createEncodeOptions(options?: MozjpegEncodeOptions) {
  return {
    quality: options?.quality ?? 75,
    baseline: options?.baseline ?? false,
    arithmetic: options?.arithmetic ?? false,
    progressive: options?.progressive ?? true,
    optimize_coding: options?.optimize_coding ?? true,
    smoothing: options?.smoothing ?? 0,
    color_space: options?.color_space ?? MozJpegColorSpace.YCbCr,
    quant_table: options?.quant_table ?? 3,
    trellis_multipass: options?.trellis_multipass ?? false,
    trellis_opt_zero: options?.trellis_opt_zero ?? false,
    trellis_opt_table: options?.trellis_opt_table ?? false,
    trellis_loops: options?.trellis_loops ?? 1,
    auto_subsample: options?.auto_subsample ?? true,
    chroma_subsample: options?.chroma_subsample ?? 2,
    separate_chroma_quality: options?.separate_chroma_quality ?? false,
    chroma_quality: options?.chroma_quality ?? 75,
  };
}

/**
 * Client-mode MozJPEG encoder (exported for direct use)
 */
export async function mozjpegEncodeClient(
  image: ImageInput,
  options?: MozjpegEncodeOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  // Validate inputs before starting
  validateImageInput(image);
  validateMozjpegOptions(options);

  // Check abort before starting
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const width = image.width;
  const height = image.height;
  const data = image.data;

  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error('Image data must be Uint8Array or Uint8ClampedArray');
  }

  const module = await loadMozjpegModule();

  // Check abort after async operation
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const encodeOptions = createEncodeOptions(options);

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
    throw new Error('MozJPEG encoding failed');
  }

  return result;
}

/**
 * Client-mode MozJPEG decoder (exported for direct use)
 * Note: Only available in Bun/Node environments (no browser decoder available).
 */
export async function mozjpegDecodeClient(
  data: BufferSource,
  signal?: AbortSignal
): Promise<ImageData> {
  if (isBrowser()) {
    throw new Error(
      'MozJPEG decoding is not supported in browser environments. No browser decoder is available.'
    );
  }

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const module = await loadMozjpegNodeDecModule();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const result = module.decode(data);

  if (!result) {
    throw new Error('MozJPEG decoding failed');
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
      await loadMozjpegModule();
      self.postMessage({ type: 'worker:ready' });
      return;
    }

    if (data?.type === 'mozjpeg:encode') {
      const request = data as WorkerRequest<{
        image: ImageInput;
        options?: MozjpegEncodeOptions;
      }>;

      const response: WorkerResponse<Uint8Array> = {
        id: request.id,
        ok: false,
      };

      try {
        const { image, options } = request.payload;
        const result = await mozjpegEncodeClient(image, options);
        response.ok = true;
        response.data = result;
        self.postMessage(response, {
          transfer: [result.buffer as ArrayBuffer],
        });
      } catch (error) {
        response.error = error instanceof Error ? error.message : String(error);
        self.postMessage(response);
      }
      return;
    }

    if (data?.type === 'mozjpeg:decode') {
      const request = data as WorkerRequest<{ data: BufferSource }>;

      const response: WorkerResponse<ImageData> = {
        id: request.id,
        ok: false,
      };

      try {
        const result = await mozjpegDecodeClient(request.payload.data);
        response.ok = true;
        response.data = result;
        self.postMessage(response, {
          transfer: [result.data.buffer as ArrayBuffer],
        });
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
