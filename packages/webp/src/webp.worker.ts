/**
 * WebP encoder - single-source worker/client implementation
 */

import {
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
  loadWasmBinary,
  validateImageInput,
  validateWebpOptions,
} from '@squoosh-kit/runtime';
import type { WebpOptions } from './types.js';

// Types from webp_enc.d.ts
interface EncodeOptions {
  quality: number;
  target_size: number;
  target_PSNR: number;
  method: number;
  sns_strength: number;
  filter_strength: number;
  filter_sharpness: number;
  filter_type: number;
  partitions: number;
  segments: number;
  pass: number;
  show_compressed: number;
  preprocessing: number;
  autofilter: number;
  partition_limit: number;
  alpha_compression: number;
  alpha_filtering: number;
  alpha_quality: number;
  lossless: number;
  exact: number;
  image_hint: number;
  emulate_jpeg_size: number;
  thread_level: number;
  low_memory: number;
  near_lossless: number;
  use_delta_palette: number;
  use_sharp_yuv: number;
}

interface WebPModule {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions
  ): Uint8Array | null;
}

let cachedModule: WebPModule | null = null;
let moduleLoadingPromise: Promise<WebPModule> | null = null;

async function loadWebPModule(): Promise<WebPModule> {
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
    if (typeof self === 'undefined') {
      // Polyfill 'self' global for Emscripten compatibility
      (global as { self?: typeof globalThis }).self = global;
    }
    if (typeof self !== 'undefined' && !self.location) {
      // Polyfill 'location' object for Emscripten module initialization
      (self as { location?: { href: string } }).location = {
        href: import.meta.url,
      };
    }

    // Try direct static import
    const wasmModulePath = './wasm/webp/webp_enc.js';
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const moduleFactory = await import(wasmModulePath);

    // Initialize the WebP module with locateFile to properly resolve the WASM
    const wasmPath = new URL('./wasm/webp/', import.meta.url).href;
    
    // Use locateFile callback to provide WASM binary path
    const module = await moduleFactory.default({
      locateFile: async (path: string) => {
        // Return the full URL to the WASM file
        if (path.endsWith('.wasm')) {
          return new URL(path, wasmPath).href;
        }
        return path;
      },
    });

      cachedModule = module;
      return module;
    } catch (error) {
      moduleLoadingPromise = null;
      throw new Error(
        `Failed to load WebP module: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  })();
  
  return moduleLoadingPromise;
}

/**
 * Convert our simplified options to full EncodeOptions
 * Ultra-optimized for maximum performance
 */
function createEncodeOptions(options?: WebpOptions): EncodeOptions {
  const quality = Math.max(0, Math.min(100, options?.quality ?? 82));
  const lossless = options?.lossless ?? false;
  const nearLossless = options?.nearLossless ?? false;

  // Ultra-optimized encode options for maximum speed
  return {
    quality,
    target_size: 0,
    target_PSNR: 0,
    method: 0, // Fastest method (0 = fastest, 6 = slowest)
    sns_strength: 0, // Disable spatial noise shaping
    filter_strength: 0, // Disable filtering
    filter_sharpness: 0,
    filter_type: 0, // No filtering
    partitions: 0, // No partitioning
    segments: 1, // Single segment
    pass: 1, // Single pass
    show_compressed: 0,
    preprocessing: 0, // No preprocessing
    autofilter: 0, // No auto filtering
    partition_limit: 0,
    alpha_compression: 0, // Disable alpha compression for speed
    alpha_filtering: 0, // Disable alpha filtering
    alpha_quality: 0, // Lowest alpha quality for speed
    lossless: lossless ? 1 : 0,
    exact: 0,
    image_hint: 0,
    emulate_jpeg_size: 0,
    thread_level: 0,
    low_memory: 1, // Enable low memory mode
    near_lossless: nearLossless ? quality : 100,
    use_delta_palette: 0,
    use_sharp_yuv: 0,
  };
}

/**
 * Client-mode WebP encoder (exported for direct use)
 */
export async function webpEncodeClient(
  image: ImageInput,
  options?: WebpOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  // Validate inputs before starting
  validateImageInput(image);
  validateWebpOptions(options);
  
  // Check abort before starting
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Normalize image input
  const width = image.width;
  const height = image.height;
  const data = image.data;

  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error('Image data must be Uint8Array or Uint8ClampedArray');
  }

  const module = await loadWebPModule();

  // Check abort after async operation
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const encodeOptions = createEncodeOptions(options);

  // Call the encode function with optimized data handling
  // Create a zero-copy Uint8Array view if needed (don't copy the buffer)
  const dataArray = data instanceof Uint8ClampedArray 
    ? new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.length) 
    : new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.length);
  
  const result = module.encode(dataArray, width, height, encodeOptions);

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!result) {
    throw new Error('WebP encoding failed');
  }

  return result;
}

/**
 * Worker message handler
 * Register the handler regardless of environment (for both worker context and tests)
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

        const result = await webpEncodeClient(
          image,
          options,
          controller.signal
        );

        response.ok = true;
        response.data = result;

        // Transfer the result buffer back directly from the response data
        const resultBuffer: ArrayBuffer = response.data.buffer as ArrayBuffer;
        self.postMessage(response, [resultBuffer]);
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
