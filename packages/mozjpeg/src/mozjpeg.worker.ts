/**
 * MozJPEG encoder/decoder - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
} from '@squoosh-kit/runtime';
import { validateMozjpegEncodeOptions } from './validators';
import mozjpeg_enc, {
  type MozJPEGModule as EncodeModule,
} from '../wasm/mozjpeg/mozjpeg_enc';
import type { MozjpegEncodeInputOptions } from './types';

let cachedEncodeModule: EncodeModule | null = null;
let encodeModuleLoadingPromise: Promise<EncodeModule> | null = null;

async function loadMozjpegEncodeModule(): Promise<EncodeModule> {
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
              `[MozJPEG] Loaded WASM binary from ${wasmPath} (${(wasmBuffer.byteLength / 1024).toFixed(1)}KB)`
            );
          }
          return moduleFactory({ noInitialRun: true, wasmBinary: wasmBuffer });
        } catch (error) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn(
              '[MozJPEG] Failed to load WASM binary explicitly, trying module initialization without it:',
              error
            );
          }
          return moduleFactory({ noInitialRun: true });
        }
      };

      cachedEncodeModule = await initModuleWithBinary(
        mozjpeg_enc as (config: {
          noInitialRun: boolean;
          wasmBinary?: ArrayBuffer;
        }) => Promise<EncodeModule>,
        new URL('../wasm/mozjpeg/mozjpeg_enc.wasm', import.meta.url).toString()
      );
      return cachedEncodeModule;
    } catch (error) {
      console.error('[MozJPEG] Failed to load encode module:', error);
      throw error;
    }
  })();

  return encodeModuleLoadingPromise;
}

export async function mozjpegEncodeClient(
  image: ImageInput,
  options?: MozjpegEncodeInputOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  validateImageInput(image);
  validateMozjpegEncodeOptions(options);

  if (signal?.aborted) {
    throw new DOMException('Encoding was aborted', 'AbortError');
  }

  const module = await loadMozjpegEncodeModule();
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
    quality: 75,
    baseline: false,
    arithmetic: false,
    progressive: true,
    optimize_coding: true,
    smoothing: 0,
    color_space: 3,
    quant_table: 3,
    trellis_multipass: false,
    trellis_opt_zero: false,
    trellis_opt_table: false,
    trellis_loops: 0,
    auto_subsample: true,
    chroma_subsample: 2,
    separate_chroma_quality: false,
    chroma_quality: 75,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const result = module.encode(uint8Data, width, height, mergedOptions);

  if (!result) {
    throw new Error('MozJPEG encoding failed');
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

    if (data.type === 'mozjpeg:encode') {
      const request = data as WorkerRequest<{
        image: ImageInput;
        options?: MozjpegEncodeInputOptions;
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
