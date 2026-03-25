/**
 * Rotate processor - raw WASM instantiation (no JS glue)
 */

import { loadWasmBinary } from '@squoosh-kit/runtime';
import type {
  WorkerRequest,
  WorkerResponse,
  ImageInput,
} from '@squoosh-kit/runtime';
import type { RotateOptions } from './types';

let wasmInstance: WebAssembly.Instance | null = null;
let initPromise: Promise<void> | null = null;

async function initRotate(): Promise<void> {
  if (wasmInstance) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const workerBaseUrl = new URL('.', import.meta.url);
      const isSource = import.meta.url.includes('/src/');
      const wasmPaths = isSource
        ? ['../wasm/rotate/rotate.wasm', './wasm/rotate/rotate.wasm']
        : ['./wasm/rotate/rotate.wasm', '../wasm/rotate/rotate.wasm'];

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
        throw lastError || new Error('Could not load rotate WASM');
      }

      const { instance } = await WebAssembly.instantiate(wasmBuffer);
      wasmInstance = instance;
      initPromise = null;
    } catch (error) {
      initPromise = null;
      throw new Error(
        `Failed to initialize rotate WASM module: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  })();

  return initPromise;
}

export async function rotateClient(
  image: ImageInput,
  options?: RotateOptions,
  signal?: AbortSignal
): Promise<ImageInput> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  await initRotate();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!wasmInstance) {
    throw new Error('Rotate module not initialized');
  }

  const degrees = options?.rotate ?? 0;
  const { data, width, height } = image;
  const n = width * height;

  // Calculate output dimensions
  const outW = degrees === 90 || degrees === 270 ? height : width;
  const outH = degrees === 90 || degrees === 270 ? width : height;

  const memory = wasmInstance.exports.memory as WebAssembly.Memory;
  const rotate = wasmInstance.exports.rotate as (
    width: number,
    height: number,
    degrees: number
  ) => void;

  // Ensure enough memory: need n*4*2 bytes (input + output) + some buffer
  const needed = n * 4 * 2 + 65536;
  while (memory.buffer.byteLength < needed) {
    memory.grow(1);
  }

  // Write input pixels at offset 0
  const uint32Input = new Uint32Array(
    data instanceof Uint8ClampedArray
      ? (data.buffer as ArrayBuffer)
      : (data.buffer as ArrayBuffer),
    data.byteOffset,
    n
  );
  new Uint32Array(memory.buffer).set(uint32Input, 0);

  // Execute rotation
  rotate(width, height, degrees);

  // Read output starting at offset n*4 (bytes)
  const outputData = new Uint8ClampedArray(
    memory.buffer.slice(n * 4, n * 4 + outW * outH * 4)
  );

  return { data: outputData, width: outW, height: outH };
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
      options?: RotateOptions;
    }>;
    const response: WorkerResponse<ImageInput> = { id: request.id, ok: false };

    try {
      if (request.type === 'rotate:run') {
        const result = await rotateClient(
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
