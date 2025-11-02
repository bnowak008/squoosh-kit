/**
 * JXL encoder/decoder with SIMD and multi-threaded support
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
  detectSimd,
} from '@squoosh-kit/runtime';
import { validateJxlEncodeOptions } from './validators';
import jxl_enc, { type JXLModule as EncodeModule } from '../wasm/jxl/jxl_enc';
import jxl_dec, {
  type JXLModule as DecodeModule,
} from '../wasm/jxl-dec/jxl_dec';
import type { JxlEncodeInputOptions } from './types';

let cachedEncodeModule: EncodeModule | null = null;
let cachedDecodeModule: DecodeModule | null = null;
let encodeModuleLoadingPromise: Promise<EncodeModule> | null = null;
let decodeModuleLoadingPromise: Promise<DecodeModule> | null = null;

async function loadJxlEncodeModule(): Promise<EncodeModule> {
  if (cachedEncodeModule) return cachedEncodeModule;
  if (encodeModuleLoadingPromise) return encodeModuleLoadingPromise;

  encodeModuleLoadingPromise = (async (): Promise<EncodeModule> => {
    // Polyfills
    if (typeof self === 'undefined') (global as any).self = global;
    if (typeof self !== 'undefined' && !self.location)
      (self as any).location = { href: import.meta.url };
    if (
      typeof SharedArrayBuffer === 'undefined' &&
      typeof window === 'undefined'
    )
      (globalThis as any).SharedArrayBuffer = ArrayBuffer;

    const initModuleWithBinary = async (
      moduleFactory: any,
      wasmPath: string
    ) => {
      try {
        const wasmBuffer = await loadWasmBinary(wasmPath);
        return moduleFactory({ noInitialRun: true, wasmBinary: wasmBuffer });
      } catch {
        return moduleFactory({ noInitialRun: true });
      }
    };

    const simdSupported = await detectSimd();

    // Try SIMD+MT first
    if (simdSupported) {
      try {
        const simdMt = await import(
          /* @vite-ignore */ '../wasm/jxl/jxl_enc_mt_simd.js'
        );
        cachedEncodeModule = (await initModuleWithBinary(
          simdMt.default,
          new URL(
            '../wasm/jxl/jxl_enc_mt_simd.wasm',
            import.meta.url
          ).toString()
        )) as EncodeModule;
        return cachedEncodeModule;
      } catch {}
    }

    // Try MT
    try {
      const mt = await import(/* @vite-ignore */ '../wasm/jxl/jxl_enc_mt.js');
      cachedEncodeModule = (await initModuleWithBinary(
        mt.default,
        new URL('../wasm/jxl/jxl_enc_mt.wasm', import.meta.url).toString()
      )) as EncodeModule;
      return cachedEncodeModule;
    } catch {}

    // Fall back to standard
    cachedEncodeModule = (await initModuleWithBinary(
      jxl_enc,
      new URL('../wasm/jxl/jxl_enc.wasm', import.meta.url).toString()
    )) as EncodeModule;
    return cachedEncodeModule;
  })();

  return encodeModuleLoadingPromise;
}

async function loadJxlDecodeModule(): Promise<DecodeModule> {
  if (cachedDecodeModule) return cachedDecodeModule;
  if (decodeModuleLoadingPromise) return decodeModuleLoadingPromise;

  decodeModuleLoadingPromise = (async (): Promise<DecodeModule> => {
    if (typeof self === 'undefined') (global as any).self = global;
    if (typeof self !== 'undefined' && !self.location)
      (self as any).location = { href: import.meta.url };
    if (
      typeof SharedArrayBuffer === 'undefined' &&
      typeof window === 'undefined'
    )
      (globalThis as any).SharedArrayBuffer = ArrayBuffer;

    const initModuleWithBinary = async (
      moduleFactory: any,
      wasmPath: string
    ) => {
      try {
        const wasmBuffer = await loadWasmBinary(wasmPath);
        return moduleFactory({ noInitialRun: true, wasmBinary: wasmBuffer });
      } catch {
        return moduleFactory({ noInitialRun: true });
      }
    };

    cachedDecodeModule = (await initModuleWithBinary(
      jxl_dec,
      new URL('../wasm/jxl-dec/jxl_dec.wasm', import.meta.url).toString()
    )) as DecodeModule;
    return cachedDecodeModule;
  })();

  return decodeModuleLoadingPromise;
}

export async function jxlEncodeClient(
  image: ImageInput,
  options?: JxlEncodeInputOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  validateImageInput(image);
  validateJxlEncodeOptions(options);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const module = await loadJxlEncodeModule();
  const { data, width, height } = image;
  const uint8Data = new Uint8Array(
    data.buffer as ArrayBuffer,
    data.byteOffset,
    data.length
  );

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const mergedOptions = {
    effort: 7,
    quality: 75,
    progressive: false,
    epf: -1,
    lossyPalette: false,
    decodingSpeedTier: 0,
    photonNoiseIso: 0,
    lossyModular: false,
    ...options,
  };

  const result = module.encode(uint8Data, width, height, mergedOptions);
  if (!result) throw new Error('JXL encoding failed');
  return result;
}

export async function jxlDecodeClient(
  buffer: BufferSource,
  signal?: AbortSignal
): Promise<ImageData> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const module = await loadJxlDecodeModule();
  const uint8Data = ArrayBuffer.isView(buffer)
    ? new Uint8Array(
        buffer.buffer as ArrayBuffer,
        buffer.byteOffset,
        buffer.byteLength
      )
    : new Uint8Array(buffer as ArrayBuffer);

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const result = module.decode(uint8Data);
  if (!result) throw new Error('JXL decoding failed');
  return result;
}

if (typeof self !== 'undefined') {
  self.onmessage = async (event: MessageEvent) => {
    const data = event.data;
    if (data?.type === 'worker:ping') {
      self.postMessage({ type: 'worker:ready' });
      return;
    }

    if (data.type === 'jxl:encode') {
      const request = data as WorkerRequest<{
        image: ImageInput;
        options?: JxlEncodeInputOptions;
      }>;
      const response: WorkerResponse<Uint8Array> = {
        id: request.id,
        ok: false,
      };
      try {
        const { image, options } = request.payload;
        response.ok = true;
        response.data = await jxlEncodeClient(image, options);
      } catch (error) {
        response.error =
          error instanceof Error ? error.message : 'Unknown error';
      }
      self.postMessage(response);
    } else if (data.type === 'jxl:decode') {
      const request = data as WorkerRequest<{ buffer: BufferSource }>;
      const response: WorkerResponse<ImageData> = { id: request.id, ok: false };
      try {
        const { buffer } = request.payload;
        response.ok = true;
        response.data = await jxlDecodeClient(buffer);
      } catch (error) {
        response.error =
          error instanceof Error ? error.message : 'Unknown error';
      }
      self.postMessage(response);
    } else {
      self.postMessage({
        id: data.id,
        ok: false,
        error: `Unknown type: ${data.type}`,
      });
    }
  };
}
