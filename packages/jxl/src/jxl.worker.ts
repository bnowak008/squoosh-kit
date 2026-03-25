/**
 * JXL encoder/decoder - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
  polyfillImageData,
} from '@squoosh-kit/runtime';
import { validateJxlOptions } from './validators';
import type { JXLModule, EncodeOptions } from './types';
import type { JXLModule as JXLDecModule } from '../wasm/jxl-dec/jxl_dec';

let cachedEncModule: JXLModule | null = null;
let cachedDecModule: JXLDecModule | null = null;
let loadEncModulePromise: Promise<JXLModule> | null = null;
let loadDecModulePromise: Promise<JXLDecModule> | null = null;

/**
 * Determine if we are running in a Node/Bun environment
 */
function isNodeOrBun(): boolean {
  return (
    typeof process !== 'undefined' &&
    (process.versions?.bun !== undefined ||
      process.versions?.node !== undefined)
  );
}

async function loadJxlEncModule(): Promise<JXLModule> {
  if (cachedEncModule) return cachedEncModule;
  if (loadEncModulePromise) return loadEncModulePromise;
  loadEncModulePromise = (async () => {
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

    const useNode = isNodeOrBun();
    // Node/Bun: use jxl_node_enc.js; Browser: use jxl_enc.js (single-threaded)
    const modulePath = useNode
      ? 'jxl-enc/jxl_node_enc.js'
      : 'jxl-enc/jxl_enc.js';

    try {
      console.log('[JXL Worker] Initializing encoder. Node/Bun:', useNode);
      console.log(
        `[JXL Worker] Attempting to import encoder module from path: ${modulePath}`
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
            `[JXL Worker] Successfully loaded encoder module from: ${importPath}`
          );
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(
            `[JXL Worker] Failed to load encoder from ${importPath}, trying next path...`
          );
        }
      }

      if (!moduleFactory) {
        throw (
          lastError ||
          new Error('Could not load JXL encoder module from any path')
        );
      }

      console.log('[JXL Worker] Encoder module factory loaded successfully.');

      const wasmFile = useNode ? 'jxl_node_enc.wasm' : 'jxl_enc.wasm';
      const wasmPathsToTry = isSource
        ? [`../wasm/jxl-enc/${wasmFile}`, `./wasm/jxl-enc/${wasmFile}`]
        : [`./wasm/jxl-enc/${wasmFile}`, `../wasm/jxl-enc/${wasmFile}`];

      console.log(
        `[JXL Worker] Preparing to load encoder WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
      );

      const initModuleWithBinary = async (
        factory: (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<JXLModule>,
        wasmPaths: string[]
      ): Promise<JXLModule> => {
        const workerBaseUrl = new URL('.', import.meta.url);
        let lastError: Error | null = null;
        for (const wasmPath of wasmPaths) {
          try {
            console.log(
              `[JXL Worker] Calling loadWasmBinary with path: ${wasmPath}`
            );
            const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
            console.log(
              `[JXL Worker] Successfully fetched encoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
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

            return await factory({
              noInitialRun: true,
              wasmBinary,
            });
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.warn(
              `[JXL Worker] Failed to load encoder WASM from ${wasmPath}, trying next path...`
            );
          }
        }
        throw (
          lastError ||
          new Error(
            'Could not load encoder WASM binary from any of the attempted paths'
          )
        );
      };

      cachedEncModule = await initModuleWithBinary(
        moduleFactory,
        wasmPathsToTry
      );
      console.log('[JXL Worker] JXL encoder module initialized successfully.');
      return cachedEncModule;
    } catch (err) {
      console.error(
        `[JXL Worker] CRITICAL: Failed to load JXL encoder module from path: ${modulePath}`,
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

async function loadJxlDecModule(): Promise<JXLDecModule> {
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

    const useNode = isNodeOrBun();
    // Node/Bun: use jxl_node_dec.js; Browser: use jxl_dec.js
    const modulePath = useNode
      ? 'jxl-dec/jxl_node_dec.js'
      : 'jxl-dec/jxl_dec.js';

    try {
      console.log('[JXL Worker] Initializing decoder. Node/Bun:', useNode);
      console.log(
        `[JXL Worker] Attempting to import decoder module from path: ${modulePath}`
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
            `[JXL Worker] Successfully loaded decoder module from: ${importPath}`
          );
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(
            `[JXL Worker] Failed to load decoder from ${importPath}, trying next path...`
          );
        }
      }

      if (!moduleFactory) {
        throw (
          lastError ||
          new Error('Could not load JXL decoder module from any path')
        );
      }

      console.log('[JXL Worker] Decoder module factory loaded successfully.');

      const wasmFile = useNode ? 'jxl_node_dec.wasm' : 'jxl_dec.wasm';
      const wasmPathsToTry = isSource
        ? [`../wasm/jxl-dec/${wasmFile}`, `./wasm/jxl-dec/${wasmFile}`]
        : [`./wasm/jxl-dec/${wasmFile}`, `../wasm/jxl-dec/${wasmFile}`];

      console.log(
        `[JXL Worker] Preparing to load decoder WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
      );

      const initModuleWithBinary = async (
        factory: (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<JXLDecModule>,
        wasmPaths: string[]
      ): Promise<JXLDecModule> => {
        const workerBaseUrl = new URL('.', import.meta.url);
        let lastError: Error | null = null;
        for (const wasmPath of wasmPaths) {
          try {
            console.log(
              `[JXL Worker] Calling loadWasmBinary with path: ${wasmPath}`
            );
            const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
            console.log(
              `[JXL Worker] Successfully fetched decoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
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

            return await factory({
              noInitialRun: true,
              wasmBinary,
            });
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.warn(
              `[JXL Worker] Failed to load decoder WASM from ${wasmPath}, trying next path...`
            );
          }
        }
        throw (
          lastError ||
          new Error(
            'Could not load decoder WASM binary from any of the attempted paths'
          )
        );
      };

      cachedDecModule = await initModuleWithBinary(
        moduleFactory,
        wasmPathsToTry
      );
      console.log('[JXL Worker] JXL decoder module initialized successfully.');
      return cachedDecModule;
    } catch (err) {
      console.error(
        `[JXL Worker] CRITICAL: Failed to load JXL decoder module from path: ${modulePath}`,
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
 * Build full EncodeOptions from partial user options using Squoosh defaults
 */
function createEncodeOptions(options?: Partial<EncodeOptions>): EncodeOptions {
  return {
    effort: options?.effort ?? 7,
    quality: options?.quality ?? 75,
    progressive: options?.progressive ?? false,
    epf: options?.epf ?? -1,
    lossyPalette: options?.lossyPalette ?? false,
    decodingSpeedTier: options?.decodingSpeedTier ?? 0,
    photonNoiseIso: options?.photonNoiseIso ?? 0,
    lossyModular: options?.lossyModular ?? false,
  };
}

/**
 * Client-mode JXL encoder (exported for direct use)
 */
export async function jxlEncodeClient(
  image: ImageInput,
  options?: Partial<EncodeOptions>,
  signal?: AbortSignal
): Promise<Uint8Array> {
  validateImageInput(image);
  validateJxlOptions(options);

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const width = image.width;
  const height = image.height;
  const data = image.data;

  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error('Image data must be Uint8Array or Uint8ClampedArray');
  }

  const module = await loadJxlEncModule();

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
    throw new Error('JXL encoding failed');
  }

  return result;
}

/**
 * Client-mode JXL decoder (exported for direct use)
 */
export async function jxlDecodeClient(
  data: Uint8Array,
  signal?: AbortSignal
): Promise<ImageData> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const module = await loadJxlDecModule();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const result = module.decode(data);

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!result) {
    throw new Error('JXL decoding failed');
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
      await loadJxlEncModule();
      self.postMessage({ type: 'worker:ready' });
      return;
    }

    if (data?.type === 'jxl:encode') {
      const request = data as WorkerRequest<{
        image: ImageInput;
        options?: Partial<EncodeOptions>;
      }>;

      const response: WorkerResponse<Uint8Array> = {
        id: request.id,
        ok: false,
      };

      try {
        const { image, options } = request.payload;
        const result = await jxlEncodeClient(image, options);
        response.ok = true;
        response.data = result;
        self.postMessage(response, [result.buffer]);
      } catch (error) {
        response.error = error instanceof Error ? error.message : String(error);
        self.postMessage(response);
      }
    } else if (data?.type === 'jxl:decode') {
      const request = data as WorkerRequest<{ data: Uint8Array }>;

      const response: WorkerResponse<ImageData> = {
        id: request.id,
        ok: false,
      };

      try {
        const result = await jxlDecodeClient(request.payload.data);
        response.ok = true;
        response.data = result;
        self.postMessage(response, [result.data.buffer]);
      } catch (error) {
        response.error = error instanceof Error ? error.message : String(error);
        self.postMessage(response);
      }
    } else {
      const request = data as WorkerRequest<unknown>;
      const response: WorkerResponse<never> = {
        id: request.id,
        ok: false,
        error: `Unknown message type: ${data?.type}`,
      };
      self.postMessage(response);
    }
  };
}
