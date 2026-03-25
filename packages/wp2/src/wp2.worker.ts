/**
 * WP2 encoder/decoder - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
  polyfillImageData,
} from '@squoosh-kit/runtime';
import { validateWp2Options } from './validators';
import type { WP2Module, EncodeOptions } from '../wasm/wp2-enc/wp2_enc';
import type { WP2Module as WP2DecModule } from '../wasm/wp2-dec/wp2_dec';
import type { Wp2EncodeOptions } from './types';

// UVMode and Csp numeric values matching the const enums in wp2_enc.d.ts
const UVModeAuto = 3;
const kYCoCg = 0;

let cachedModule: WP2Module | null = null;

async function loadWp2Module(): Promise<WP2Module> {
  if (cachedModule) {
    return cachedModule;
  }

  // Determine the module path based on environment
  const isNodeOrBun =
    typeof process !== 'undefined' &&
    (process.versions?.bun !== undefined ||
      process.versions?.node !== undefined);

  const modulePath = isNodeOrBun
    ? 'wp2-enc/wp2_node_enc.js'
    : 'wp2-enc/wp2_enc.js';

  try {
    console.log(
      '[WP2 Worker] Initializing. Environment:',
      isNodeOrBun ? 'Node/Bun' : 'Browser'
    );
    console.log(
      `[WP2 Worker] Attempting to import module from path: ${modulePath}`
    );

    // Mock self.location for test environments where it doesn't exist
    // Emscripten code tries to access self.location.href during initialization
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
          `[WP2 Worker] Successfully loaded module from: ${importPath}`
        );
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `[WP2 Worker] Failed to load from ${importPath}, trying next path...`
        );
      }
    }

    if (!moduleFactory) {
      throw lastError || new Error('Could not load WP2 module from any path');
    }

    console.log('[WP2 Worker] Module factory loaded successfully.');

    // Determine WASM binary path
    const wasmFile = isNodeOrBun ? 'wp2_node_enc.wasm' : 'wp2_enc.wasm';
    const wasmPathsToTry = isSource
      ? [`../wasm/wp2-enc/${wasmFile}`, `./wasm/wp2-enc/${wasmFile}`]
      : [`./wasm/wp2-enc/${wasmFile}`, `../wasm/wp2-enc/${wasmFile}`];

    console.log(
      `[WP2 Worker] Preparing to load WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
    );

    const initModuleWithBinary = async (
      moduleFactory: (config: {
        noInitialRun: boolean;
        wasmBinary?: ArrayBuffer;
      }) => Promise<WP2Module>,
      wasmPaths: string[]
    ): Promise<WP2Module> => {
      const workerBaseUrl = new URL('.', import.meta.url);
      let lastError: Error | null = null;
      for (const wasmPath of wasmPaths) {
        try {
          console.log(
            `[WP2 Worker] Calling loadWasmBinary with path: ${wasmPath}`
          );
          const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
          console.log(
            `[WP2 Worker] Successfully fetched WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
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

          return await moduleFactory({
            noInitialRun: true,
            wasmBinary,
          });
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(
            `[WP2 Worker] Failed to load WASM from ${wasmPath}, trying next path...`
          );
        }
      }
      throw (
        lastError ||
        new Error('Could not load WASM binary from any of the attempted paths')
      );
    };

    cachedModule = await initModuleWithBinary(moduleFactory, wasmPathsToTry);
    console.log('[WP2 Worker] WP2 module initialized successfully.');
    return cachedModule;
  } catch (err) {
    console.error(
      `[WP2 Worker] CRITICAL: Failed to load WP2 module from path: ${modulePath}`,
      err
    );
    throw err;
  }
}

/**
 * Convert partial options to full EncodeOptions with Squoosh defaults
 */
function createEncodeOptions(options?: Wp2EncodeOptions): EncodeOptions {
  return {
    quality: options?.quality ?? 75,
    alpha_quality: options?.alpha_quality ?? 75,
    effort: options?.effort ?? 5,
    pass: options?.pass ?? 1,
    sns: options?.sns ?? 50,
    uv_mode: options?.uv_mode ?? UVModeAuto,
    csp_type: options?.csp_type ?? kYCoCg,
    error_diffusion: options?.error_diffusion ?? 0,
    use_random_matrix: options?.use_random_matrix ?? false,
  };
}

/**
 * Client-mode WP2 encoder (exported for direct use)
 */
export async function wp2EncodeClient(
  image: ImageInput,
  options?: Wp2EncodeOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  // Validate inputs before starting
  validateImageInput(image);
  validateWp2Options(options);

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

  const module = await loadWp2Module();

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
    throw new Error('WP2 encoding failed');
  }

  return result;
}

let cachedDecModule: WP2DecModule | null = null;

async function loadWp2DecModule(): Promise<WP2DecModule> {
  if (cachedDecModule) {
    return cachedDecModule;
  }

  const isNodeOrBun =
    typeof process !== 'undefined' &&
    (process.versions?.bun !== undefined ||
      process.versions?.node !== undefined);

  const modulePath = isNodeOrBun
    ? 'wp2-dec/wp2_node_dec.js'
    : 'wp2-dec/wp2_dec.js';

  try {
    console.log(
      '[WP2 Worker] Initializing dec. Environment:',
      isNodeOrBun ? 'Node/Bun' : 'Browser'
    );
    console.log(
      `[WP2 Worker] Attempting to import dec module from path: ${modulePath}`
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

    // Polyfill ImageData for Node/Bun environments
    polyfillImageData();

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
          `[WP2 Worker] Successfully loaded dec module from: ${importPath}`
        );
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `[WP2 Worker] Failed to load dec from ${importPath}, trying next path...`
        );
      }
    }

    if (!moduleFactory) {
      throw (
        lastError || new Error('Could not load WP2 dec module from any path')
      );
    }

    console.log('[WP2 Worker] Dec module factory loaded successfully.');

    const wasmFile = isNodeOrBun ? 'wp2_node_dec.wasm' : 'wp2_dec.wasm';
    const wasmPathsToTry = isSource
      ? [`../wasm/wp2-dec/${wasmFile}`, `./wasm/wp2-dec/${wasmFile}`]
      : [`./wasm/wp2-dec/${wasmFile}`, `../wasm/wp2-dec/${wasmFile}`];

    console.log(
      `[WP2 Worker] Preparing to load dec WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
    );

    const initDecModuleWithBinary = async (
      moduleFactory: (config: {
        noInitialRun: boolean;
        wasmBinary?: ArrayBuffer;
      }) => Promise<WP2DecModule>,
      wasmPaths: string[]
    ): Promise<WP2DecModule> => {
      const workerBaseUrl = new URL('.', import.meta.url);
      let lastError: Error | null = null;
      for (const wasmPath of wasmPaths) {
        try {
          console.log(
            `[WP2 Worker] Calling loadWasmBinary with dec path: ${wasmPath}`
          );
          const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
          console.log(
            `[WP2 Worker] Successfully fetched dec WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
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
            `[WP2 Worker] Failed to load dec WASM from ${wasmPath}, trying next path...`
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
    console.log('[WP2 Worker] WP2 dec module initialized successfully.');
    return cachedDecModule;
  } catch (err) {
    console.error(
      `[WP2 Worker] CRITICAL: Failed to load WP2 dec module from path: ${modulePath}`,
      err
    );
    throw err;
  }
}

/**
 * Client-mode WP2 decoder (exported for direct use)
 */
export async function wp2DecodeClient(
  data: BufferSource,
  signal?: AbortSignal
): Promise<ImageData> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const module = await loadWp2DecModule();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const result = module.decode(data);

  if (!result) {
    throw new Error('WP2 decoding failed');
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

    if (data?.type === 'wp2:encode') {
      const request = data as WorkerRequest<{
        image: ImageInput;
        options?: Wp2EncodeOptions;
      }>;

      const response: WorkerResponse<Uint8Array> = {
        id: request.id,
        ok: false,
      };

      try {
        const { image, options } = request.payload;
        const result = await wp2EncodeClient(image, options);
        response.ok = true;
        response.data = result;
        self.postMessage(response);
      } catch (error) {
        response.error = error instanceof Error ? error.message : String(error);
        self.postMessage(response);
      }
      return;
    }

    if (data?.type === 'wp2:decode') {
      const request = data as WorkerRequest<{ data: BufferSource }>;

      const response: WorkerResponse<ImageData> = {
        id: request.id,
        ok: false,
      };

      try {
        const result = await wp2DecodeClient(request.payload.data);
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
