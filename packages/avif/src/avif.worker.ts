/**
 * AVIF encoder/decoder - single-source worker/client implementation
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
} from '@squoosh-kit/runtime';
import { validateAvifOptions } from './validators';
import type { AVIFModule } from '../wasm/avif-enc/avif_enc';

// AVIFTune is a const enum — define values manually to avoid runtime import issues
const AVIFTune = { auto: 0, psnr: 1, ssim: 2 } as const;
import type { AVIFModule as AVIFDecModule } from '../wasm/avif-dec/avif_dec';
import type { AvifEncodeOptions, EncodeOptions } from './types';

let cachedEncModule: AVIFModule | null = null;
let cachedDecModule: AVIFDecModule | null = null;
let loadEncModulePromise: Promise<AVIFModule> | null = null;
let loadDecModulePromise: Promise<AVIFDecModule> | null = null;

async function loadAvifEncModule(): Promise<AVIFModule> {
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
    // Node/Bun: use node-specific encoder; Browser: use standard single-threaded encoder
    const modulePath = useNode
      ? 'avif-enc/avif_node_enc.js'
      : 'avif-enc/avif_enc.js';

    try {
      console.log('[AVIF Worker] Initializing encoder. Node/Bun:', useNode);
      console.log(
        `[AVIF Worker] Attempting to import encoder module from path: ${modulePath}`
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
            `[AVIF Worker] Successfully loaded encoder module from: ${importPath}`
          );
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(
            `[AVIF Worker] Failed to load encoder from ${importPath}, trying next path...`
          );
        }
      }

      if (!moduleFactory) {
        throw (
          lastError ||
          new Error('Could not load AVIF encoder module from any path')
        );
      }

      console.log('[AVIF Worker] Encoder module factory loaded successfully.');

      const wasmFileName = useNode ? 'avif_node_enc.wasm' : 'avif_enc.wasm';
      const wasmPathsToTry = isSource
        ? [
            `../wasm/avif-enc/${wasmFileName}`,
            `./wasm/avif-enc/${wasmFileName}`,
          ]
        : [
            `./wasm/avif-enc/${wasmFileName}`,
            `../wasm/avif-enc/${wasmFileName}`,
          ];

      console.log(
        `[AVIF Worker] Preparing to load encoder WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
      );

      const initModuleWithBinary = async (
        factory: (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<AVIFModule>,
        wasmPaths: string[]
      ): Promise<AVIFModule> => {
        const workerBaseUrl = new URL('.', import.meta.url);
        let lastErr: Error | null = null;
        for (const wasmPath of wasmPaths) {
          try {
            console.log(
              `[AVIF Worker] Calling loadWasmBinary with path: ${wasmPath}`
            );
            const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
            console.log(
              `[AVIF Worker] Successfully fetched encoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
            );

            // Ensure self.location exists right before calling moduleFactory
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
              `[AVIF Worker] Failed to load encoder WASM from ${wasmPath}, trying next path...`
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
        '[AVIF Worker] AVIF encoder module initialized successfully.'
      );
      return cachedEncModule;
    } catch (err) {
      console.error(
        `[AVIF Worker] CRITICAL: Failed to load AVIF encoder module from path: ${modulePath}`,
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

async function loadAvifDecModule(): Promise<AVIFDecModule> {
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

    const useNode = isBun() || isNode();
    const modulePath = useNode
      ? 'avif-dec/avif_node_dec.js'
      : 'avif-dec/avif_dec.js';

    try {
      console.log('[AVIF Worker] Initializing decoder. Node/Bun:', useNode);
      console.log(
        `[AVIF Worker] Attempting to import decoder module from path: ${modulePath}`
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
            `[AVIF Worker] Successfully loaded decoder module from: ${importPath}`
          );
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(
            `[AVIF Worker] Failed to load decoder from ${importPath}, trying next path...`
          );
        }
      }

      if (!moduleFactory) {
        throw (
          lastError ||
          new Error('Could not load AVIF decoder module from any path')
        );
      }

      console.log('[AVIF Worker] Decoder module factory loaded successfully.');

      const wasmFileName = useNode ? 'avif_node_dec.wasm' : 'avif_dec.wasm';
      const wasmPathsToTry = isSource
        ? [
            `../wasm/avif-dec/${wasmFileName}`,
            `./wasm/avif-dec/${wasmFileName}`,
          ]
        : [
            `./wasm/avif-dec/${wasmFileName}`,
            `../wasm/avif-dec/${wasmFileName}`,
          ];

      console.log(
        `[AVIF Worker] Preparing to load decoder WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
      );

      const initModuleWithBinary = async (
        factory: (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<AVIFDecModule>,
        wasmPaths: string[]
      ): Promise<AVIFDecModule> => {
        const workerBaseUrl = new URL('.', import.meta.url);
        let lastErr: Error | null = null;
        for (const wasmPath of wasmPaths) {
          try {
            console.log(
              `[AVIF Worker] Calling loadWasmBinary with path: ${wasmPath}`
            );
            const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
            console.log(
              `[AVIF Worker] Successfully fetched decoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
            );

            // Ensure self.location exists right before calling moduleFactory
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
              `[AVIF Worker] Failed to load decoder WASM from ${wasmPath}, trying next path...`
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

      cachedDecModule = await initModuleWithBinary(
        moduleFactory,
        wasmPathsToTry
      );
      console.log(
        '[AVIF Worker] AVIF decoder module initialized successfully.'
      );
      return cachedDecModule;
    } catch (err) {
      console.error(
        `[AVIF Worker] CRITICAL: Failed to load AVIF decoder module from path: ${modulePath}`,
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
function createEncodeOptions(
  options?: AvifEncodeOptions
): EncodeOptions & { enableSharpDownsampling?: boolean } {
  return {
    quality: options?.quality ?? 50,
    qualityAlpha: options?.qualityAlpha ?? -1,
    denoiseLevel: options?.denoiseLevel ?? 0,
    tileRowsLog2: options?.tileRowsLog2 ?? 0,
    tileColsLog2: options?.tileColsLog2 ?? 0,
    speed: options?.speed ?? 6,
    subsample: options?.subsample ?? 1,
    chromaDeltaQ: options?.chromaDeltaQ ?? false,
    sharpness: options?.sharpness ?? 0,
    enableSharpYUV: options?.enableSharpYUV ?? false,
    // enableSharpDownsampling is present in the WASM binary but not in the d.ts
    enableSharpDownsampling: false,
    tune: options?.tune ?? AVIFTune.auto,
  };
}

/**
 * Client-mode AVIF encoder (exported for direct use)
 */
export async function avifEncodeClient(
  image: ImageInput,
  options?: AvifEncodeOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  // Validate inputs before starting
  validateImageInput(image);
  validateAvifOptions(options);

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

  const module = await loadAvifEncModule();

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
    throw new Error('AVIF encoding failed');
  }

  return result;
}

/**
 * Client-mode AVIF decoder (exported for direct use)
 */
export async function avifDecodeClient(
  data: BufferSource,
  signal?: AbortSignal
): Promise<ImageData> {
  // Check abort before starting
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const module = await loadAvifDecModule();

  // Check abort after async operation
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const result = module.decode(data);

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!result) {
    throw new Error('AVIF decoding failed');
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
      await loadAvifEncModule();
      self.postMessage({ type: 'worker:ready' });
      return;
    }

    if (data?.type === 'avif:encode') {
      const request = data as WorkerRequest<{
        image: ImageInput;
        options?: AvifEncodeOptions;
      }>;

      const response: WorkerResponse<Uint8Array> = {
        id: request.id,
        ok: false,
      };

      try {
        const { image, options } = request.payload;
        const result = await avifEncodeClient(image, options);
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

    if (data?.type === 'avif:decode') {
      const request = data as WorkerRequest<{
        data: BufferSource;
      }>;

      const response: WorkerResponse<ImageData> = {
        id: request.id,
        ok: false,
      };

      try {
        const result = await avifDecodeClient(request.payload.data);
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
      id: request?.id,
      ok: false,
      error: `Unknown message type: ${data?.type}`,
    };
    self.postMessage(response);
  };
}
