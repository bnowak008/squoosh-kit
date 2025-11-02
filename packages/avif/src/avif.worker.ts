/**
 * AVIF encoder/decoder - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
  detectSimd,
} from '@squoosh-kit/runtime';
import { validateAvifEncodeOptions } from './validators';
import avif_enc, {
  type AVIFModule as EncodeModule,
} from '../wasm/avif/avif_enc';
import avif_dec, {
  type AVIFModule as DecodeModule,
} from '../wasm/avif-dec/avif_dec';
import type { AvifEncodeInputOptions } from './types';

let cachedEncodeModule: EncodeModule | null = null;
let cachedDecodeModule: DecodeModule | null = null;
let encodeModuleLoadingPromise: Promise<EncodeModule> | null = null;
let decodeModuleLoadingPromise: Promise<DecodeModule> | null = null;

async function loadAvifEncodeModule(): Promise<EncodeModule> {
  if (cachedEncodeModule) {
    return cachedEncodeModule;
  }

  if (encodeModuleLoadingPromise) {
    return encodeModuleLoadingPromise;
  }

  encodeModuleLoadingPromise = (async (): Promise<EncodeModule> => {
    try {
      // Environment polyfills for Emscripten-generated code
      if (typeof self === 'undefined') {
        (global as { self?: typeof globalThis }).self = global;
      }

      if (typeof self !== 'undefined' && !self.location) {
        (self as { location?: { href: string } }).location = {
          href: import.meta.url,
        };
      }

      if (
        typeof SharedArrayBuffer === 'undefined' &&
        typeof window === 'undefined'
      ) {
        (
          globalThis as unknown as Record<string, typeof ArrayBuffer>
        ).SharedArrayBuffer = ArrayBuffer;
      }

      const initModuleWithBinary = async (
        moduleFactory: (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<EncodeModule>,
        wasmPath: string
      ): Promise<EncodeModule> => {
        try {
          const wasmBuffer = await loadWasmBinary(wasmPath);
          if (typeof console !== 'undefined' && console.log) {
            console.log(
              `[AVIF] Loaded WASM binary from ${wasmPath} (${(wasmBuffer.byteLength / 1024).toFixed(1)}KB)`
            );
          }
          return moduleFactory({ noInitialRun: true, wasmBinary: wasmBuffer });
        } catch (error) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn(
              '[AVIF] Failed to load WASM binary explicitly, trying module initialization without it:',
              error
            );
          }
          return moduleFactory({ noInitialRun: true });
        }
      };

      // Try to load multi-threaded encoder first
      try {
        const mtModuleFactory = await import(
          /* @vite-ignore */ '../wasm/avif/avif_enc_mt.js'
        );
        if (typeof console !== 'undefined' && console.log) {
          console.log('[AVIF] Multi-threaded encoder available, loading...');
        }
        cachedEncodeModule = await initModuleWithBinary(
          mtModuleFactory.default as (config: {
            noInitialRun: boolean;
            wasmBinary?: ArrayBuffer;
          }) => Promise<EncodeModule>,
          new URL('../wasm/avif/avif_enc_mt.wasm', import.meta.url).toString()
        );
        return cachedEncodeModule;
      } catch (error) {
        if (typeof console !== 'undefined' && console.log) {
          console.log(
            '[AVIF] Multi-threaded encoder not available, falling back to standard encoder',
            error
          );
        }
      }

      // Fallback to standard encoder
      cachedEncodeModule = await initModuleWithBinary(
        avif_enc as (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<EncodeModule>,
        new URL('../wasm/avif/avif_enc.wasm', import.meta.url).toString()
      );
      return cachedEncodeModule;
    } catch (error) {
      console.error('[AVIF] Failed to load encode module:', error);
      throw error;
    }
  })();

  return encodeModuleLoadingPromise;
}

async function loadAvifDecodeModule(): Promise<DecodeModule> {
  if (cachedDecodeModule) {
    return cachedDecodeModule;
  }

  if (decodeModuleLoadingPromise) {
    return decodeModuleLoadingPromise;
  }

  decodeModuleLoadingPromise = (async (): Promise<DecodeModule> => {
    try {
      // Environment polyfills
      if (typeof self === 'undefined') {
        (global as { self?: typeof globalThis }).self = global;
      }

      if (typeof self !== 'undefined' && !self.location) {
        (self as { location?: { href: string } }).location = {
          href: import.meta.url,
        };
      }

      if (
        typeof SharedArrayBuffer === 'undefined' &&
        typeof window === 'undefined'
      ) {
        (
          globalThis as unknown as Record<string, typeof ArrayBuffer>
        ).SharedArrayBuffer = ArrayBuffer;
      }

      const initModuleWithBinary = async (
        moduleFactory: (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<DecodeModule>,
        wasmPath: string
      ): Promise<DecodeModule> => {
        try {
          const wasmBuffer = await loadWasmBinary(wasmPath);
          if (typeof console !== 'undefined' && console.log) {
            console.log(
              `[AVIF] Loaded decoder WASM binary from ${wasmPath} (${(wasmBuffer.byteLength / 1024).toFixed(1)}KB)`
            );
          }
          return moduleFactory({ noInitialRun: true, wasmBinary: wasmBuffer });
        } catch (error) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn(
              '[AVIF] Failed to load decoder WASM binary explicitly:',
              error
            );
          }
          return moduleFactory({ noInitialRun: true });
        }
      };

      cachedDecodeModule = await initModuleWithBinary(
        avif_dec as (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<DecodeModule>,
        new URL('../wasm/avif-dec/avif_dec.wasm', import.meta.url).toString()
      );
      return cachedDecodeModule;
    } catch (error) {
      console.error('[AVIF] Failed to load decode module:', error);
      throw error;
    }
  })();

  return decodeModuleLoadingPromise;
}

export async function avifEncodeClient(
  image: ImageInput,
  options?: AvifEncodeInputOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  validateImageInput(image);
  validateAvifEncodeOptions(options);

  if (signal?.aborted) {
    throw new DOMException('Encoding was aborted', 'AbortError');
  }

  const module = await loadAvifEncodeModule();
  const { data, width, height } = image;
  const uint8Data =
    data instanceof Uint8ClampedArray
      ? new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.length)
      : new Uint8Array(
          data.buffer as ArrayBuffer,
          data.byteOffset,
          data.length
        );

  if (signal?.aborted) {
    throw new DOMException('Encoding was aborted', 'AbortError');
  }

  const defaultOptions = {
    quality: 50,
    qualityAlpha: 50,
    denoiseLevel: 0,
    tileRowsLog2: 0,
    tileColsLog2: 0,
    speed: 6,
    subsample: 1,
    chromaDeltaQ: false,
    sharpness: 0,
    enableSharpYUV: false,
    tune: 0,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const result = module.encode(uint8Data, width, height, mergedOptions);

  if (!result) {
    throw new Error('AVIF encoding failed');
  }

  return result;
}

export async function avifDecodeClient(
  buffer: BufferSource,
  signal?: AbortSignal
): Promise<ImageData> {
  if (signal?.aborted) {
    throw new DOMException('Decoding was aborted', 'AbortError');
  }

  const module = await loadAvifDecodeModule();
  const uint8Data = ArrayBuffer.isView(buffer)
    ? new Uint8Array(
        buffer.buffer as ArrayBuffer,
        buffer.byteOffset,
        buffer.byteLength
      )
    : new Uint8Array(buffer as ArrayBuffer);

  if (signal?.aborted) {
    throw new DOMException('Decoding was aborted', 'AbortError');
  }

  const result = module.decode(uint8Data);

  if (!result) {
    throw new Error('AVIF decoding failed');
  }

  return result;
}

if (typeof self !== 'undefined') {
  self.onmessage = async (event: MessageEvent) => {
    const data = event.data;

    // Handle worker ping for initialization
    if (data?.type === 'worker:ping') {
      self.postMessage({ type: 'worker:ready' });
      return;
    }

    if (data.type === 'avif:encode') {
      const request = data as WorkerRequest<{
        image: ImageInput;
        options?: AvifEncodeInputOptions;
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
        self.postMessage(response);
      } catch (error) {
        response.error =
          error instanceof Error ? error.message : 'Unknown error';
        self.postMessage(response);
      }
    } else if (data.type === 'avif:decode') {
      const request = data as WorkerRequest<{ buffer: BufferSource }>;

      const response: WorkerResponse<ImageData> = {
        id: request.id,
        ok: false,
      };

      try {
        const { buffer } = request.payload;
        const result = await avifDecodeClient(buffer);
        response.ok = true;
        response.data = result;
        self.postMessage(response);
      } catch (error) {
        response.error =
          error instanceof Error ? error.message : 'Unknown error';
        self.postMessage(response);
      }
    } else {
      self.postMessage({
        id: data.id,
        ok: false,
        error: `Unknown message type: ${data.type}`,
      });
    }
  };
}
