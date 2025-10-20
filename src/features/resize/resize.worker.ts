/**
 * Resize processor - single-source worker/client implementation
 */

import { isWorker, hasImageData } from '../../runtime/env.ts';
import type { WorkerRequest, WorkerResponse } from '../../runtime/worker-call.ts';
import type { ImageInput, ResizeOptions } from '../../runtime/worker-bridge.ts';

const RESIZE_WASM_URL = new URL('../../../../wasm/resize/resize.wasm', import.meta.url);

interface ResizeModule {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  free(ptr: number): number;
  resize(
    inputPtr: number,
    inputWidth: number,
    inputHeight: number,
    outputWidth: number,
    outputHeight: number,
    outputPtr: number,
    premultiply: number,
    linearRGB: number
  ): number;
}

let cachedModule: ResizeModule | null = null;

async function loadResizeModule(): Promise<ResizeModule> {
  if (cachedModule) {
    return cachedModule;
  }

  try {
    // Try to load the resize.js glue if it exists
    try {
      const glueUrl = new URL('../../../../wasm/resize/resize.js', import.meta.url);
      const glueModule = await import(glueUrl.href);
      if (typeof glueModule.resize === 'function') {
        console.log('Using resize glue from resize.js');
        // Wrap the glue in our expected interface
        cachedModule = glueModule as unknown as ResizeModule;
        return cachedModule;
      }
    } catch {
      // Glue not found or doesn't export resize, fall through to raw WASM
    }

    // Load raw WASM
    const response = await fetch(RESIZE_WASM_URL.href);
    if (!response.ok) {
      throw new Error(`Failed to fetch Resize WASM from ${RESIZE_WASM_URL.href}: ${response.statusText}`);
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
        `Resize WASM missing required exports: ${missing.join(', ')}. Available: ${available}`
      );
    }

    cachedModule = exports as ResizeModule;
    return cachedModule;
  } catch (error) {
    throw new Error(`Failed to load Resize module: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Client-mode resize processor (exported for direct use)
 */
export async function resizeClient(
  signal: AbortSignal,
  image: ImageInput,
  options: ResizeOptions
): Promise<ImageInput> {
  // Check abort before starting
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Calculate output dimensions
  const inputWidth = image.width;
  const inputHeight = image.height;

  let outputWidth = options.width ?? inputWidth;
  let outputHeight = options.height ?? inputHeight;

  // If only one dimension is specified, maintain aspect ratio
  if (options.width && !options.height) {
    outputHeight = Math.round((inputHeight * options.width) / inputWidth);
  } else if (options.height && !options.width) {
    outputWidth = Math.round((inputWidth * options.height) / inputHeight);
  }

  // Validate dimensions
  if (outputWidth <= 0 || outputHeight <= 0) {
    throw new Error('Invalid output dimensions');
  }

  const data = image.data;
  if (!(data instanceof Uint8Array)) {
    throw new Error('Image data must be Uint8Array');
  }

  const module = await loadResizeModule();

  // Check abort after async operation
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // If we have a glue module with resize function, use it
  if ('resize' in module && typeof (module as any).resize === 'function' && !('memory' in module)) {
    // This is likely the glue module
    const result = await (module as any).resize(data, inputWidth, inputHeight, outputWidth, outputHeight, {
      premultiply: options.premultiply ?? false,
      linearRGB: options.linearRGB ?? false,
    });
    
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Return in appropriate format
    if (hasImageData() && typeof ImageData !== 'undefined') {
      return new ImageData(new Uint8ClampedArray(result), outputWidth, outputHeight);
    }
    return { data: new Uint8Array(result), width: outputWidth, height: outputHeight };
  }

  // Otherwise use raw WASM interface
  const inputSize = inputWidth * inputHeight * 4;
  const outputSize = outputWidth * outputHeight * 4;

  // Allocate input buffer in WASM memory
  const inputPtr = module.malloc(inputSize);
  if (!inputPtr) {
    throw new Error('Failed to allocate WASM memory for input data');
  }

  try {
    // Copy input data to WASM memory
    const memoryView = new Uint8Array(module.memory.buffer);
    memoryView.set(data, inputPtr);

    // Allocate output buffer
    const outputPtr = module.malloc(outputSize);
    if (!outputPtr) {
      throw new Error('Failed to allocate WASM memory for output data');
    }

    try {
      // Call resize
      const result = module.resize(
        inputPtr,
        inputWidth,
        inputHeight,
        outputWidth,
        outputHeight,
        outputPtr,
        options.premultiply ? 1 : 0,
        options.linearRGB ? 1 : 0
      );

      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      if (result === 0) {
        throw new Error('Resize operation failed');
      }

      // Copy output data
      const outputData = new Uint8Array(module.memory.buffer, outputPtr, outputSize);
      const outputCopy = new Uint8Array(outputData);

      // Return in appropriate format
      if (hasImageData() && typeof ImageData !== 'undefined') {
        return new ImageData(new Uint8ClampedArray(outputCopy), outputWidth, outputHeight);
      }
      
      return { data: outputCopy, width: outputWidth, height: outputHeight };
    } finally {
      module.free(outputPtr);
    }
  } finally {
    module.free(inputPtr);
  }
}

/**
 * Worker message handler
 */
if (isWorker()) {
  self.onmessage = async (event: MessageEvent) => {
    const request = event.data as WorkerRequest<{
      image: ImageInput;
      options: ResizeOptions;
    }>;

    const response: WorkerResponse<ImageInput> = {
      id: request.id,
      ok: false,
    };

    try {
      if (request.type === 'resize:run') {
        const { image, options } = request.payload;
        
        // Create an AbortController for this request
        const controller = new AbortController();
        
        const result = await resizeClient(controller.signal, image, options);
        
        response.ok = true;
        response.data = result;

        // Transfer the result buffer back
        self.postMessage(response, [result.data.buffer]);
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
