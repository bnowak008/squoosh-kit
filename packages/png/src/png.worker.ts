/**
 * PNG processor - single-source worker/client implementation
 */

import type {
  WorkerRequest,
  WorkerResponse,
  ImageInput,
} from '@squoosh-kit/runtime';
import { loadWasmBinary, polyfillImageData } from '@squoosh-kit/runtime';

type EncodeFn = (data: Uint8Array, width: number, height: number) => Uint8Array;

type DecodeFn = (data: Uint8Array) => ImageData;

let encodeFn: EncodeFn | null = null;
let decodeFn: DecodeFn | null = null;
let initPromise: Promise<void> | null = null;

async function initPNG(): Promise<void> {
  if (encodeFn && decodeFn) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      // Polyfill ImageData for Node/Bun environments
      polyfillImageData();

      const workerBaseUrl = new URL('.', import.meta.url);
      const isSource = import.meta.url.includes('/src/');
      const wasmPaths = isSource
        ? ['../wasm/png/squoosh_png_bg.wasm', './wasm/png/squoosh_png_bg.wasm']
        : ['./wasm/png/squoosh_png_bg.wasm', '../wasm/png/squoosh_png_bg.wasm'];

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
          lastError || new Error('Could not load PNG WASM binary from any path')
        );
      }

      const jsPaths = isSource
        ? ['../wasm/png/squoosh_png.js', './wasm/png/squoosh_png.js']
        : ['./wasm/png/squoosh_png.js', '../wasm/png/squoosh_png.js'];

      type PNGModule = {
        default: (buf: ArrayBuffer) => Promise<unknown>;
        encode: EncodeFn;
        decode: DecodeFn;
      };

      let pngModule: PNGModule | null = null;
      let jsLastError: Error | null = null;
      for (const jsPath of jsPaths) {
        try {
          pngModule = (await import(/* @vite-ignore */ jsPath)) as PNGModule;
          break;
        } catch (error) {
          jsLastError =
            error instanceof Error ? error : new Error(String(error));
        }
      }

      if (!pngModule) {
        throw (
          jsLastError || new Error('Could not load PNG JS module from any path')
        );
      }

      await pngModule.default(wasmBuffer);
      encodeFn = pngModule.encode;
      decodeFn = pngModule.decode;
    } catch (error) {
      initPromise = null;
      throw new Error(
        `Failed to initialize PNG WASM module: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  })();

  return initPromise;
}

export async function pngEncodeClient(
  image: ImageInput,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  await initPNG();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!encodeFn) {
    throw new Error('PNG module not initialized');
  }

  const { data, width, height } = image;

  // PNG encode takes Uint8Array, convert from Uint8ClampedArray if needed
  const uint8Data =
    data instanceof Uint8Array
      ? data
      : new Uint8Array(
          data.buffer as ArrayBuffer,
          data.byteOffset,
          data.length
        );

  const result = encodeFn(uint8Data, width, height);
  if (!result) {
    throw new Error('PNG encoding failed');
  }
  return result;
}

export async function pngDecodeClient(
  data: Uint8Array,
  signal?: AbortSignal
): Promise<ImageData> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  await initPNG();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!decodeFn) {
    throw new Error('PNG module not initialized');
  }

  // decode throws on error per the WASM binding contract
  return decodeFn(data);
}

/**
 * Worker message handler
 */
if (typeof self !== 'undefined') {
  self.onmessage = async (event: MessageEvent) => {
    const msgData = event.data;

    if (msgData?.type === 'worker:ping') {
      self.postMessage({ type: 'worker:ready' });
      return;
    }

    if (msgData?.type === 'png:encode') {
      const request = msgData as WorkerRequest<{ image: ImageInput }>;
      const response: WorkerResponse<Uint8Array> = {
        id: request.id,
        ok: false,
      };
      try {
        const result = await pngEncodeClient(request.payload.image);
        response.ok = true;
        response.data = result;
        self.postMessage(response);
      } catch (error) {
        response.error = error instanceof Error ? error.message : String(error);
        self.postMessage(response);
      }
      return;
    }

    if (msgData?.type === 'png:decode') {
      const request = msgData as WorkerRequest<{ data: Uint8Array }>;
      const response: WorkerResponse<ImageData> = {
        id: request.id,
        ok: false,
      };
      try {
        const result = await pngDecodeClient(request.payload.data);
        response.ok = true;
        response.data = result;
        self.postMessage(response);
      } catch (error) {
        response.error = error instanceof Error ? error.message : String(error);
        self.postMessage(response);
      }
      return;
    }

    const request = msgData as WorkerRequest<unknown>;
    const response: WorkerResponse<never> = {
      id: request.id,
      ok: false,
      error: `Unknown message type: ${request.type}`,
    };
    self.postMessage(response);
  };
}
