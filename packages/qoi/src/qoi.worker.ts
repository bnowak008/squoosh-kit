/**
 * QOI encoder/decoder - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
  polyfillImageData,
} from '@squoosh-kit/runtime';
import type { QoiModule, QOIModule, EncodeOptions } from './types';

let cachedEncModule: QoiModule | null = null;
let cachedDecModule: QOIModule | null = null;

async function loadQoiEncModule(): Promise<QoiModule> {
  if (cachedEncModule) {
    return cachedEncModule;
  }

  const globalSelf = typeof self !== 'undefined' ? self : globalThis;
  if (!globalSelf.location) {
    (globalSelf as { location?: { href: string } }).location = {
      href: import.meta.url,
    };
  }
  if (typeof self === 'undefined' && typeof globalThis !== 'undefined') {
    (globalThis as { self?: typeof globalThis }).self = globalThis;
  }

  const modulePath = 'qoi-enc/qoi_enc.js';

  console.log('[QOI Worker] Loading encoder module.');
  console.log(
    `[QOI Worker] Attempting to import encoder module from path: ${modulePath}`
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
        `[QOI Worker] Successfully loaded encoder module from: ${importPath}`
      );
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[QOI Worker] Failed to load encoder from ${importPath}, trying next path...`
      );
    }
  }

  if (!moduleFactory) {
    throw (
      lastError || new Error('Could not load QOI encoder module from any path')
    );
  }

  console.log('[QOI Worker] Encoder module factory loaded successfully.');

  const wasmFile = 'qoi-enc/qoi_enc.wasm';
  const wasmPathsToTry = isSource
    ? ['../wasm/' + wasmFile, './wasm/' + wasmFile]
    : ['./wasm/' + wasmFile, '../wasm/' + wasmFile];

  console.log(
    `[QOI Worker] Preparing to load encoder WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
  );

  const workerBaseUrl = new URL('.', import.meta.url);
  let wasmLastError: Error | null = null;

  for (const wasmPath of wasmPathsToTry) {
    try {
      console.log(`[QOI Worker] Calling loadWasmBinary with path: ${wasmPath}`);
      const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
      console.log(
        `[QOI Worker] Successfully fetched encoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
      );

      const globalSelf2 = typeof self !== 'undefined' ? self : globalThis;
      if (!globalSelf2.location) {
        (globalSelf2 as { location?: { href: string } }).location = {
          href: import.meta.url,
        };
      }
      if (typeof self === 'undefined' && typeof globalThis !== 'undefined') {
        (globalThis as { self?: typeof globalThis }).self = globalThis;
      }

      cachedEncModule = await (
        moduleFactory as (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<QoiModule>
      )({
        noInitialRun: true,
        wasmBinary,
      });
      console.log('[QOI Worker] QOI encoder module initialized successfully.');
      return cachedEncModule;
    } catch (err) {
      wasmLastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[QOI Worker] Failed to load encoder WASM from ${wasmPath}, trying next path...`
      );
    }
  }

  throw (
    wasmLastError ||
    new Error(
      'Could not load encoder WASM binary from any of the attempted paths'
    )
  );
}

async function loadQoiDecModule(): Promise<QOIModule> {
  if (cachedDecModule) {
    return cachedDecModule;
  }

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

  const modulePath = 'qoi-dec/qoi_dec.js';

  console.log('[QOI Worker] Loading decoder module.');
  console.log(
    `[QOI Worker] Attempting to import decoder module from path: ${modulePath}`
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
        `[QOI Worker] Successfully loaded decoder module from: ${importPath}`
      );
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[QOI Worker] Failed to load decoder from ${importPath}, trying next path...`
      );
    }
  }

  if (!moduleFactory) {
    throw (
      lastError || new Error('Could not load QOI decoder module from any path')
    );
  }

  console.log('[QOI Worker] Decoder module factory loaded successfully.');

  const wasmFile = 'qoi-dec/qoi_dec.wasm';
  const wasmPathsToTry = isSource
    ? ['../wasm/' + wasmFile, './wasm/' + wasmFile]
    : ['./wasm/' + wasmFile, '../wasm/' + wasmFile];

  console.log(
    `[QOI Worker] Preparing to load decoder WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
  );

  const workerBaseUrl = new URL('.', import.meta.url);
  let wasmLastError: Error | null = null;

  for (const wasmPath of wasmPathsToTry) {
    try {
      console.log(`[QOI Worker] Calling loadWasmBinary with path: ${wasmPath}`);
      const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
      console.log(
        `[QOI Worker] Successfully fetched decoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
      );

      const globalSelf2 = typeof self !== 'undefined' ? self : globalThis;
      if (!globalSelf2.location) {
        (globalSelf2 as { location?: { href: string } }).location = {
          href: import.meta.url,
        };
      }
      if (typeof self === 'undefined' && typeof globalThis !== 'undefined') {
        (globalThis as { self?: typeof globalThis }).self = globalThis;
      }

      cachedDecModule = await (
        moduleFactory as (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<QOIModule>
      )({
        noInitialRun: true,
        wasmBinary,
      });
      console.log('[QOI Worker] QOI decoder module initialized successfully.');
      return cachedDecModule;
    } catch (err) {
      wasmLastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[QOI Worker] Failed to load decoder WASM from ${wasmPath}, trying next path...`
      );
    }
  }

  throw (
    wasmLastError ||
    new Error(
      'Could not load decoder WASM binary from any of the attempted paths'
    )
  );
}

/**
 * Client-mode QOI encoder (exported for direct use)
 */
export async function qoiEncodeClient(
  image: ImageInput,
  signal?: AbortSignal
): Promise<Uint8Array> {
  validateImageInput(image);

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const width = image.width;
  const height = image.height;
  const data = image.data;

  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error('Image data must be Uint8Array or Uint8ClampedArray');
  }

  const module = await loadQoiEncModule();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const dataBuffer =
    data instanceof Uint8ClampedArray
      ? new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.length)
      : new Uint8Array(
          data.buffer as ArrayBuffer,
          data.byteOffset,
          data.length
        );

  const options: EncodeOptions = {};
  const result = module.encode(dataBuffer, width, height, options);

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!result) {
    throw new Error('QOI encoding failed');
  }

  return result;
}

/**
 * Client-mode QOI decoder (exported for direct use)
 */
export async function qoiDecodeClient(
  data: BufferSource,
  signal?: AbortSignal
): Promise<ImageData> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const module = await loadQoiDecModule();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const result = module.decode(data);

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!result) {
    throw new Error('QOI decoding failed');
  }

  return result;
}

/**
 * Worker message handler
 */
if (typeof self !== 'undefined') {
  self.onmessage = async (event: MessageEvent) => {
    const data = event.data;

    if (data?.type === 'worker:ping') {
      self.postMessage({ type: 'worker:ready' });
      return;
    }

    if (data?.type === 'qoi:encode') {
      const request = data as WorkerRequest<{ image: ImageInput }>;

      const response: WorkerResponse<Uint8Array> = {
        id: request.id,
        ok: false,
      };

      try {
        const { image } = request.payload;
        const result = await qoiEncodeClient(image);
        response.ok = true;
        response.data = result;
        self.postMessage(response);
      } catch (error) {
        response.error = error instanceof Error ? error.message : String(error);
        self.postMessage(response);
      }
      return;
    }

    if (data?.type === 'qoi:decode') {
      const request = data as WorkerRequest<{ data: BufferSource }>;

      const response: WorkerResponse<ImageData> = {
        id: request.id,
        ok: false,
      };

      try {
        const result = await qoiDecodeClient(request.payload.data);
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
