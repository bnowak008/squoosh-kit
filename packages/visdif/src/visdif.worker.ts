/**
 * VisDif Butteraugli comparison - Emscripten-based worker/client implementation
 */

import { loadWasmBinary } from '@squoosh-kit/runtime';
import type {
  WorkerRequest,
  WorkerResponse,
  ImageInput,
} from '@squoosh-kit/runtime';

type VisDifModuleInstance = {
  VisDiff: new (
    data: string,
    w: number,
    h: number
  ) => { distance: (d: string) => number };
};

let cachedModule: VisDifModuleInstance | null = null;

async function loadVisDifModule(): Promise<VisDifModuleInstance> {
  if (cachedModule) return cachedModule;

  // Apply Emscripten polyfills
  const globalSelf = typeof self !== 'undefined' ? self : globalThis;
  if (!globalSelf.location) {
    (globalSelf as { location?: { href: string } }).location = {
      href: import.meta.url,
    };
  }
  if (typeof self === 'undefined' && typeof globalThis !== 'undefined') {
    (globalThis as { self?: typeof globalThis }).self = globalThis;
  }

  const workerBaseUrl = new URL('.', import.meta.url);
  const isSource = import.meta.url.includes('/src/');
  const jsPaths = isSource
    ? ['../wasm/visdif/visdif.js', './wasm/visdif/visdif.js']
    : ['./wasm/visdif/visdif.js', '../wasm/visdif/visdif.js'];

  let moduleFactory:
    | ((config: Record<string, unknown>) => Promise<unknown>)
    | null = null;
  let lastJsError: Error | null = null;
  for (const jsPath of jsPaths) {
    try {
      moduleFactory = (await import(/* @vite-ignore */ jsPath)).default;
      break;
    } catch (error) {
      lastJsError = error instanceof Error ? error : new Error(String(error));
    }
  }
  if (!moduleFactory) {
    throw lastJsError || new Error('Could not load VisDif JS module');
  }

  const wasmPaths = isSource
    ? ['../wasm/visdif/visdif.wasm', './wasm/visdif/visdif.wasm']
    : ['./wasm/visdif/visdif.wasm', '../wasm/visdif/visdif.wasm'];

  let wasmBinary: ArrayBuffer | null = null;
  let lastWasmError: Error | null = null;
  for (const wasmPath of wasmPaths) {
    try {
      wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
      break;
    } catch (error) {
      lastWasmError = error instanceof Error ? error : new Error(String(error));
    }
  }
  if (!wasmBinary) {
    throw lastWasmError || new Error('Could not load VisDif WASM');
  }

  // Re-apply polyfills right before factory call (Emscripten checks during init)
  const globalSelf2 = typeof self !== 'undefined' ? self : globalThis;
  if (!globalSelf2.location) {
    (globalSelf2 as { location?: { href: string } }).location = {
      href: import.meta.url,
    };
  }
  if (typeof self === 'undefined' && typeof globalThis !== 'undefined') {
    (globalThis as { self?: typeof globalThis }).self = globalThis;
  }

  cachedModule = (await moduleFactory({
    noInitialRun: true,
    wasmBinary,
  })) as VisDifModuleInstance;
  return cachedModule;
}

function imageToString(image: ImageInput): string {
  // Convert RGBA pixel data to a string (Emscripten std::string format)
  const { data } = image;
  const bytes = new Uint8Array(
    data.buffer as ArrayBuffer,
    data.byteOffset,
    data.byteLength
  );

  // Build string from char codes
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}

export async function visdifCompareClient(
  image1: ImageInput,
  image2: ImageInput,
  signal?: AbortSignal
): Promise<number> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (image1.width !== image2.width || image1.height !== image2.height) {
    throw new Error('Images must have the same dimensions for comparison');
  }

  const module = await loadVisDifModule();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const data1 = imageToString(image1);
  const data2 = imageToString(image2);

  const visDiff = new module.VisDiff(data1, image1.width, image1.height);
  return visDiff.distance(data2);
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
      image1: ImageInput;
      image2: ImageInput;
    }>;
    const response: WorkerResponse<number> = { id: request.id, ok: false };

    try {
      if (request.type === 'visdif:compare') {
        const result = await visdifCompareClient(
          request.payload.image1,
          request.payload.image2
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
