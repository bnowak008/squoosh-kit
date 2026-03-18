/**
 * HQX upscaler - single-source worker/client implementation
 */

import { loadWasmBinary } from '@squoosh-kit/runtime';
import type {
  WorkerRequest,
  WorkerResponse,
  ImageInput,
} from '@squoosh-kit/runtime';
import type { HqxOptions } from './types';

let resizeFn:
  | ((input: Uint32Array, w: number, h: number, factor: number) => Uint32Array)
  | null = null;
let initPromise: Promise<void> | null = null;

async function initHqx(): Promise<void> {
  if (resizeFn) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const workerBaseUrl = new URL('.', import.meta.url);
      const isSource = import.meta.url.includes('/src/');
      const wasmPaths = isSource
        ? ['../wasm/hqx/squooshhqx_bg.wasm', './wasm/hqx/squooshhqx_bg.wasm']
        : ['./wasm/hqx/squooshhqx_bg.wasm', '../wasm/hqx/squooshhqx_bg.wasm'];

      let wasmBuffer: ArrayBuffer | null = null;
      let lastWasmError: Error | null = null;
      for (const path of wasmPaths) {
        try {
          wasmBuffer = await loadWasmBinary(path, workerBaseUrl);
          break;
        } catch (error) {
          lastWasmError =
            error instanceof Error ? error : new Error(String(error));
        }
      }
      if (!wasmBuffer) {
        throw lastWasmError || new Error('Could not load HQX WASM');
      }

      const jsPaths = isSource
        ? ['../wasm/hqx/squooshhqx.js', './wasm/hqx/squooshhqx.js']
        : ['./wasm/hqx/squooshhqx.js', '../wasm/hqx/squooshhqx.js'];

      let hqxModule: {
        default: (buf: ArrayBuffer) => Promise<unknown>;
        resize:
          | ((
              input: Uint32Array,
              w: number,
              h: number,
              factor: number
            ) => Uint32Array)
          | undefined;
      } | null = null;
      let lastJsError: Error | null = null;
      for (const jsPath of jsPaths) {
        try {
          hqxModule = await import(/* @vite-ignore */ jsPath);
          break;
        } catch (error) {
          lastJsError =
            error instanceof Error ? error : new Error(String(error));
        }
      }
      if (!hqxModule) {
        throw lastJsError || new Error('Could not load HQX JS module');
      }

      await hqxModule.default(wasmBuffer);
      resizeFn = hqxModule.resize as (
        input: Uint32Array,
        w: number,
        h: number,
        factor: number
      ) => Uint32Array;
      initPromise = null;
    } catch (error) {
      initPromise = null;
      throw new Error(
        `Failed to initialize HQX WASM module: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  })();

  return initPromise;
}

export async function hqxUpscaleClient(
  image: ImageInput,
  options?: HqxOptions,
  signal?: AbortSignal
): Promise<ImageInput> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  await initHqx();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!resizeFn) {
    throw new Error('HQX module not initialized');
  }

  const factor = options?.factor ?? 2;
  const { data, width, height } = image;

  // Convert to Uint32Array view (RGBA packed as 32-bit)
  const buf =
    data instanceof Uint8ClampedArray
      ? (data.buffer as ArrayBuffer)
      : (data.buffer as ArrayBuffer);
  const uint32Input = new Uint32Array(buf, data.byteOffset, width * height);

  const uint32Output = resizeFn(uint32Input, width, height, factor);
  const outputData = new Uint8ClampedArray(uint32Output.buffer as ArrayBuffer);

  return { data: outputData, width: width * factor, height: height * factor };
}

/**
 * Worker message handler
 */
if (typeof self !== 'undefined') {
  self.onmessage = async (event: MessageEvent) => {
    const data = event.data;

    // Handle worker ping for initialization
    if (data?.type === 'worker:ping') {
      self.postMessage({ type: 'worker:ready' });
      return;
    }

    const request = data as WorkerRequest<{
      image: ImageInput;
      options?: HqxOptions;
    }>;
    const response: WorkerResponse<ImageInput> = { id: request.id, ok: false };

    try {
      if (request.type === 'hqx:upscale') {
        const result = await hqxUpscaleClient(
          request.payload.image,
          request.payload.options
        );
        response.ok = true;
        response.data = result;
        self.postMessage(response);
      } else {
        response.error = `Unknown message type: ${request.type}`;
        self.postMessage(response);
      }
    } catch (error) {
      response.error = error instanceof Error ? error.message : String(error);
      self.postMessage(response);
    }
  };
}
