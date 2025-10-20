/**
 * WebP encoder - single-source worker/client implementation
 */

import { isWorker } from '../../runtime/env.ts';
import type { WorkerRequest, WorkerResponse } from '../../runtime/worker-call.ts';
import type { ImageInput, WebpOptions } from '../../runtime/worker-bridge.ts';

const WEBP_WASM_URL = new URL('../../../../wasm/webp/libwebp.wasm', import.meta.url);

interface WebPModule {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  free(ptr: number): number;
  encode(
    dataPtr: number,
    width: number,
    height: number,
    quality: number,
    lossless: number,
    outPtr: number,
    outSizePtr: number
  ): number;
}

let cachedModule: WebPModule | null = null;

async function loadWebPModule(): Promise<WebPModule> {
  if (cachedModule) {
    return cachedModule;
  }

  try {
    // Try to load the encoder.js glue if it exists
    try {
      const glueUrl = new URL('../../../../wasm/webp/encoder.js', import.meta.url);
      const glueModule = await import(glueUrl.href);
      if (typeof glueModule.encode === 'function') {
        console.log('Using WebP encoder glue from encoder.js');
        // Wrap the glue in our expected interface
        cachedModule = glueModule as unknown as WebPModule;
        return cachedModule;
      }
    } catch {
      // Glue not found or doesn't export encode, fall through to raw WASM
    }

    // Load raw WASM
    const response = await fetch(WEBP_WASM_URL.href);
    if (!response.ok) {
      throw new Error(`Failed to fetch WebP WASM from ${WEBP_WASM_URL.href}: ${response.statusText}`);
    }

    const wasmBytes = await response.arrayBuffer();
    const wasmModule = await WebAssembly.instantiate(wasmBytes, {});
    const instance = wasmModule.instance;

    // Validate exports
    const exports = instance.exports as any;
    const requiredExports = ['memory', 'malloc', 'free'];
    const missing = requiredExports.filter(name => !(name in exports));
    
    if (missing.length > 0) {
      const available = Object.keys(exports).join(', ');
      throw new Error(
        `WebP WASM missing required exports: ${missing.join(', ')}. Available: ${available}`
      );
    }

    cachedModule = exports as WebPModule;
    return cachedModule;
  } catch (error) {
    throw new Error(`Failed to load WebP module: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Client-mode WebP encoder (exported for direct use)
 */
export async function webpEncodeClient(
  signal: AbortSignal,
  image: ImageInput,
  options?: WebpOptions
): Promise<Uint8Array> {
  // Check abort before starting
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const quality = Math.max(0, Math.min(100, options?.quality ?? 82));
  const lossless = options?.lossless ?? false;

  // Normalize image input
  const width = image.width;
  const height = image.height;
  const data = image.data;

  if (!(data instanceof Uint8Array)) {
    throw new Error('Image data must be Uint8Array');
  }

  const module = await loadWebPModule();

  // Check abort after async operation
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // If we have a glue module with encode function, use it
  if ('encode' in module && typeof (module as any).encode === 'function' && !('memory' in module)) {
    // This is likely the glue module
    const result = await (module as any).encode(data, width, height, { quality, lossless });
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    return result;
  }

  // Otherwise use raw WASM interface
  const dataSize = width * height * 4;

  // Allocate input buffer in WASM memory
  const dataPtr = module.malloc(dataSize);
  if (!dataPtr) {
    throw new Error('Failed to allocate WASM memory for input data');
  }

  try {
    // Copy input data to WASM memory
    const memoryView = new Uint8Array(module.memory.buffer);
    memoryView.set(data, dataPtr);

    // Allocate output pointers
    const outPtr = module.malloc(4); // pointer to output data pointer
    const outSizePtr = module.malloc(4); // pointer to output size

    if (!outPtr || !outSizePtr) {
      throw new Error('Failed to allocate WASM memory for output pointers');
    }

    try {
      // Call encode
      const result = module.encode(
        dataPtr,
        width,
        height,
        quality,
        lossless ? 1 : 0,
        outPtr,
        outSizePtr
      );

      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      if (result === 0) {
        throw new Error('WebP encoding failed');
      }

      // Read output pointer and size
      const memView32 = new Uint32Array(module.memory.buffer);
      const outputDataPtr = memView32[outPtr / 4];
      const outputSize = memView32[outSizePtr / 4];

      if (!outputDataPtr || !outputSize) {
        throw new Error('WebP encoding produced invalid output');
      }

      // Copy output data
      const outputData = new Uint8Array(module.memory.buffer, outputDataPtr, outputSize);
      const outputCopy = new Uint8Array(outputData);

      // Free output buffer
      module.free(outputDataPtr);

      return outputCopy;
    } finally {
      module.free(outPtr);
      module.free(outSizePtr);
    }
  } finally {
    module.free(dataPtr);
  }
}

/**
 * Worker message handler
 */
if (isWorker()) {
  self.onmessage = async (event: MessageEvent) => {
    const request = event.data as WorkerRequest<{
      image: ImageInput;
      options?: WebpOptions;
    }>;

    const response: WorkerResponse<Uint8Array> = {
      id: request.id,
      ok: false,
    };

    try {
      if (request.type === 'webp:encode') {
        const { image, options } = request.payload;
        
        // Create an AbortController for this request
        const controller = new AbortController();
        
        const result = await webpEncodeClient(controller.signal, image, options);
        
        response.ok = true;
        response.data = result;

        // Transfer the result buffer back
        self.postMessage(response, [result.buffer]);
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
