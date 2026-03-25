/**
 * ImageQuant quantizer - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
} from '@squoosh-kit/runtime';
import { validateImagequantOptions } from './validators';
import type { QuantizerModule, ImagequantOptions } from './types';

let cachedModule: QuantizerModule | null = null;

async function loadImagequantModule(): Promise<QuantizerModule> {
  if (cachedModule) {
    return cachedModule;
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

  const isNode =
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;

  // In Node/Bun use node variant; in browser use standard variant
  const modulePath = isNode
    ? 'imagequant/imagequant_node.js'
    : 'imagequant/imagequant.js';

  console.log('[ImageQuant Worker] Loading module. Node mode:', isNode);
  console.log(
    `[ImageQuant Worker] Attempting to import module from path: ${modulePath}`
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
        `[ImageQuant Worker] Successfully loaded module from: ${importPath}`
      );
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[ImageQuant Worker] Failed to load from ${importPath}, trying next path...`
      );
    }
  }

  if (!moduleFactory) {
    throw (
      lastError || new Error('Could not load ImageQuant module from any path')
    );
  }

  console.log('[ImageQuant Worker] Module factory loaded successfully.');

  const wasmFile = isNode
    ? 'imagequant/imagequant_node.wasm'
    : 'imagequant/imagequant.wasm';

  const wasmPathsToTry = isSource
    ? ['../wasm/' + wasmFile, './wasm/' + wasmFile]
    : ['./wasm/' + wasmFile, '../wasm/' + wasmFile];

  console.log(
    `[ImageQuant Worker] Preparing to load WASM binary. Will try paths: ${wasmPathsToTry.join(', ')}`
  );

  const workerBaseUrl = new URL('.', import.meta.url);
  let wasmLastError: Error | null = null;

  for (const wasmPath of wasmPathsToTry) {
    try {
      console.log(
        `[ImageQuant Worker] Calling loadWasmBinary with path: ${wasmPath}`
      );
      const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
      console.log(
        `[ImageQuant Worker] Successfully fetched WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`
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

      cachedModule = await (
        moduleFactory as (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<QuantizerModule>
      )({
        noInitialRun: true,
        wasmBinary,
      });
      console.log(
        '[ImageQuant Worker] ImageQuant module initialized successfully.'
      );
      return cachedModule;
    } catch (err) {
      wasmLastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[ImageQuant Worker] Failed to load WASM from ${wasmPath}, trying next path...`
      );
    }
  }

  throw (
    wasmLastError ||
    new Error('Could not load WASM binary from any of the attempted paths')
  );
}

/**
 * Client-mode ImageQuant quantizer (exported for direct use)
 */
export async function imagequantQuantizeClient(
  image: ImageInput,
  options?: ImagequantOptions,
  signal?: AbortSignal
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  validateImageInput(image);
  validateImagequantOptions(options);

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const width = image.width;
  const height = image.height;
  const data = image.data;

  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error('Image data must be Uint8Array or Uint8ClampedArray');
  }

  const module = await loadImagequantModule();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const numColors = options?.numColors ?? 256;
  const dither = options?.dither ?? 1.0;
  const zx = options?.zx ?? false;

  const dataBuffer =
    data instanceof Uint8ClampedArray
      ? new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.length)
      : new Uint8Array(
          data.buffer as ArrayBuffer,
          data.byteOffset,
          data.length
        );

  const result = zx
    ? module.zx_quantize(dataBuffer, width, height, dither)
    : module.quantize(dataBuffer, width, height, numColors, dither);

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!result) {
    throw new Error('ImageQuant quantization failed');
  }

  return { data: result, width, height };
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

    if (data?.type === 'imagequant:quantize') {
      const request = data as WorkerRequest<{
        image: ImageInput;
        options?: ImagequantOptions;
      }>;

      const response: WorkerResponse<{
        data: Uint8ClampedArray;
        width: number;
        height: number;
      }> = {
        id: request.id,
        ok: false,
      };

      try {
        const { image, options } = request.payload;
        const result = await imagequantQuantizeClient(image, options);
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
