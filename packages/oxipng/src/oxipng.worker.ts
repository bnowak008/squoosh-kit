/**
 * OxiPNG processor - single-source worker/client implementation
 */

import type {
  WorkerRequest,
  WorkerResponse,
  ImageInput,
} from '@squoosh-kit/runtime';
import { loadWasmBinary } from '@squoosh-kit/runtime';
import type { OxipngOptions } from './types';

type OptimiseFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  level: number,
  interlace: boolean
) => Uint8Array;

let optimiseFn: OptimiseFn | null = null;
let initPromise: Promise<void> | null = null;

async function initOxiPNG(): Promise<void> {
  if (optimiseFn) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const workerBaseUrl = new URL('.', import.meta.url);
      const isSource = import.meta.url.includes('/src/');
      const wasmPaths = isSource
        ? [
            '../wasm/oxipng/squoosh_oxipng_bg.wasm',
            './wasm/oxipng/squoosh_oxipng_bg.wasm',
          ]
        : [
            './wasm/oxipng/squoosh_oxipng_bg.wasm',
            '../wasm/oxipng/squoosh_oxipng_bg.wasm',
          ];

      let wasmBuffer: ArrayBuffer | null = null;
      let lastError: Error | null = null;
      for (const path of wasmPaths) {
        try {
          wasmBuffer = await loadWasmBinary(path, workerBaseUrl);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      }

      if (!wasmBuffer) {
        throw (
          lastError ||
          new Error('Could not load OxiPNG WASM binary from any path')
        );
      }

      const jsPaths = isSource
        ? [
            '../wasm/oxipng/squoosh_oxipng.js',
            './wasm/oxipng/squoosh_oxipng.js',
          ]
        : [
            './wasm/oxipng/squoosh_oxipng.js',
            '../wasm/oxipng/squoosh_oxipng.js',
          ];

      type OxiPNGModule = {
        default: (buf: ArrayBuffer) => Promise<unknown>;
        optimise: OptimiseFn;
      };

      let oxipngModule: OxiPNGModule | null = null;
      let jsLastError: Error | null = null;
      for (const jsPath of jsPaths) {
        try {
          oxipngModule = (await import(
            /* @vite-ignore */ jsPath
          )) as OxiPNGModule;
          break;
        } catch (error) {
          jsLastError =
            error instanceof Error ? error : new Error(String(error));
        }
      }

      if (!oxipngModule) {
        throw (
          jsLastError ||
          new Error('Could not load OxiPNG JS module from any path')
        );
      }

      await oxipngModule.default(wasmBuffer);
      optimiseFn = oxipngModule.optimise;
    } catch (error) {
      initPromise = null;
      throw new Error(
        `Failed to initialize OxiPNG WASM module: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  })();

  return initPromise;
}

export async function oxipngOptimizeClient(
  image: ImageInput,
  options?: OxipngOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  await initOxiPNG();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!optimiseFn) {
    throw new Error('OxiPNG module not initialized');
  }

  const { data, width, height } = image;
  const level = options?.level ?? 2;
  const interlace = options?.interlace ?? false;

  const clampedData =
    data instanceof Uint8ClampedArray
      ? data
      : new Uint8ClampedArray(
          data.buffer as ArrayBuffer,
          data.byteOffset,
          data.length
        );

  const result = optimiseFn(clampedData, width, height, level, interlace);
  if (!result) {
    throw new Error('OxiPNG optimization failed');
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

    const request = data as WorkerRequest<{
      image: ImageInput;
      options?: OxipngOptions;
    }>;

    const response: WorkerResponse<Uint8Array> = {
      id: request.id,
      ok: false,
    };

    try {
      if (request.type === 'oxipng:optimize') {
        const result = await oxipngOptimizeClient(
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
