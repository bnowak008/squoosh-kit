/**
 * Resize processor - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
  validateResizeOptions,
} from '@squoosh-kit/runtime';
import type { ResizeModule, ResizeOptions } from './types';
import squoosh_resize_module from '../wasm/squoosh_resize';

let cachedModule: ResizeModule | null = null;
let moduleLoadingPromise: Promise<ResizeModule> | null = null;

async function loadResizeModule(): Promise<ResizeModule> {
  if (cachedModule) {
    return cachedModule;
  }

  if (moduleLoadingPromise) {
    return moduleLoadingPromise;
  }

  moduleLoadingPromise = (async () => {
    try {
      // Environment polyfills for Emscripten-generated code
      // The WebP encoder WASM module expects browser-like globals (self, location)
      // These polyfills ensure compatibility when running in Bun/Node.js environments

      // Polyfill 'self' global for Emscripten compatibility
      if (typeof self === 'undefined') {
        (global as { self?: typeof globalThis }).self = global;
      }

      // Polyfill 'location' object for Emscripten module initialization
      if (typeof self !== 'undefined' && !self.location) {
        (self as { location?: { href: string } }).location = {
          href: import.meta.url,
        };
      }

      // Polyfill SharedArrayBuffer for worker contexts without COOP/COEP headers
      if (
        typeof SharedArrayBuffer === 'undefined' &&
        typeof window === 'undefined'
      ) {
        (
          globalThis as unknown as Record<string, typeof ArrayBuffer>
        ).SharedArrayBuffer = ArrayBuffer;
      }

      // Load WASM binary with robust fallback strategies
      // Try multiple paths to support both development (../wasm) and npm installed (./wasm) scenarios
      let wasmBuffer: ArrayBuffer | null = null;
      const pathsToTry = [
        new URL(
          /* @vite-ignore */ './wasm/squoosh_resize_bg.wasm',
          import.meta.url
        ).href,
        new URL(
          /* @vite-ignore */ '../wasm/squoosh_resize_bg.wasm',
          import.meta.url
        ).href,
      ];

      let lastError: Error | null = null;
      for (const path of pathsToTry) {
        try {
          wasmBuffer = await loadWasmBinary(path);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          // Continue to next path
        }
      }

      if (!wasmBuffer) {
        throw (
          lastError || new Error('Could not load WASM binary from any path')
        );
      }

      // Initialize WASM module by passing buffer as a Promise
      // The wasm-bindgen-compiled module expects either undefined or a Promise/URL that resolves to the buffer
      const module = await squoosh_resize_module(Promise.resolve(wasmBuffer));
      cachedModule = module as unknown as ResizeModule;

      if (!cachedModule) {
        throw new Error('Failed to load WASM module');
      }

      return cachedModule;
    } catch (error) {
      moduleLoadingPromise = null;
      throw new Error(
        `Failed to load WASM module: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  })();

  return moduleLoadingPromise;
}

export async function resizeClient(
  image: ImageInput,
  options: ResizeOptions,
  signal?: AbortSignal
): Promise<ImageInput> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  validateImageInput(image);
  validateResizeOptions(options);

  const module = await loadResizeModule();
  const { data, width: inputWidth, height: inputHeight } = image;

  let outputWidth = options.width ?? inputWidth;
  let outputHeight = options.height ?? inputHeight;

  if (options.width && !options.height) {
    outputHeight = Math.max(
      1,
      Math.round((inputHeight * options.width) / inputWidth)
    );
  } else if (options.height && !options.width) {
    outputWidth = Math.max(
      1,
      Math.round((inputWidth * options.height) / inputHeight)
    );
  }

  if (outputWidth < 1 || outputHeight < 1) {
    throw new RangeError(
      `Output dimensions must be at least 1x1, got ${outputWidth}x${outputHeight}`
    );
  }

  // Create a zero-copy Uint8Array view if needed
  // (don't copy the buffer - just create a view on the same memory)
  const dataArray =
    data instanceof Uint8ClampedArray
      ? new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.length)
      : new Uint8Array(
          data.buffer as ArrayBuffer,
          data.byteOffset,
          data.length
        );

  const result = module.resize(
    dataArray,
    inputWidth,
    inputHeight,
    outputWidth,
    outputHeight,
    getResizeMethod(options),
    options.premultiply ?? true,
    options.linearRGB ?? true
  );

  return {
    data: result,
    width: outputWidth,
    height: outputHeight,
  };
}

/**
 * Map ResizeOptions method to WASM typ_idx parameter
 * typ_idx values (from Squoosh):
 *   0: Triangular   - fastest, lowest quality
 *   1: Catrom       - medium quality and speed
 *   2: Mitchell     - good balance (default)
 *   3: Lanczos3     - highest quality, slowest
 */
function getResizeMethod(options?: ResizeOptions): number {
  const methodMap: Record<string, number> = {
    triangular: 0,
    catrom: 1,
    mitchell: 2,
    lanczos3: 3,
  };
  return methodMap[options?.method ?? 'mitchell'] ?? 2;
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

    const { id, type, payload } = data as WorkerRequest<{
      image: ImageInput;
      options: ResizeOptions;
    }>;

    const response: WorkerResponse<ImageInput> = { id, ok: false };

    try {
      if (type === 'resize:run') {
        const controller = new AbortController();
        const resultImage = await resizeClient(
          payload.image,
          payload.options,
          controller.signal
        );

        response.ok = true;
        response.data = resultImage;

        const transferable = resultImage.data.buffer;
        if (transferable) {
          self.postMessage(response, [transferable as ArrayBuffer]);
        } else {
          self.postMessage(response);
        }
      } else {
        response.error = `Unknown message type: ${type}`;
        self.postMessage(response);
      }
    } catch (error) {
      response.error = error instanceof Error ? error.message : String(error);
      self.postMessage(response);
    }
  };
}
