/**
 * Resize processor - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
} from '@squoosh-kit/runtime';
import { validateResizeOptions } from './validators';
import type { ResizeOptions } from './types';
import * as squoosh_resize_module from '../wasm/squoosh_resize';

// Define the type locally to avoid module resolution issues with the linter
type SquooshWasmResize = (
  input_image: Uint8Array,
  input_width: number,
  input_height: number,
  output_width: number,
  output_height: number,
  typ_idx: number,
  premultiply: boolean,
  color_space_conversion: boolean
) => Uint8ClampedArray;

let wasmResize: SquooshWasmResize | null = null;
let initPromise: Promise<void> | null = null;

async function init(): Promise<void> {
  if (wasmResize) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
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

      // Initialize WASM module with the binary buffer
      try {
        await squoosh_resize_module.default(wasmBuffer);
      } catch (initError: unknown) {
        // If initialization fails due to SharedArrayBuffer issues, try with polyfill
        if (
          initError instanceof Error &&
          (initError.message.includes('SharedArrayBuffer') ||
            initError.message.includes('first argument must be'))
        ) {
          // Apply polyfill and retry
          if (typeof SharedArrayBuffer === 'undefined') {
            (
              globalThis as unknown as Record<string, typeof ArrayBuffer>
            ).SharedArrayBuffer = ArrayBuffer;
          }
          // Reload the module with polyfill in place
          try {
            await squoosh_resize_module.default(wasmBuffer);
          } catch (retryError) {
            throw new Error(
              `WASM module initialization failed even with polyfill: ${retryError instanceof Error ? retryError.message : String(retryError)}`
            );
          }
        } else {
          throw initError;
        }
      }
      // After initialization, the module's exported resize function is ready to use
      wasmResize = squoosh_resize_module.resize as unknown as SquooshWasmResize;
    } catch (error) {
      initPromise = null;
      throw new Error(
        `Failed to initialize resize WASM module: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  })();

  return initPromise;
}

async function _resizeCore(
  image: ImageInput,
  options: ResizeOptions
): Promise<ImageInput> {
  validateImageInput(image);
  validateResizeOptions(options);

  await init();
  if (!wasmResize) {
    throw new Error('Resize module not initialized');
  }

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

  const result = wasmResize(
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

export async function resizeClient(
  image: ImageInput,
  options: ResizeOptions,
  signal?: AbortSignal
): Promise<ImageInput> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  return _resizeCore(image, options);
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
  return methodMap[options?.method ?? 'lanczos3'] ?? 3;
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
      if (type !== 'resize:run') {
        throw new Error(`Unknown message type: ${type}`);
      }

      const resultImage = await _resizeCore(payload.image, payload.options);

      response.ok = true;
      response.data = resultImage;

      // Post the response without transferring - the ImageInput with data will be cloned
      // Transfer is only used for incoming requests (image.data buffer from client)
      self.postMessage(response);
    } catch (error) {
      response.error = error instanceof Error ? error.message : String(error);
      self.postMessage(response);
    }
  };
}
