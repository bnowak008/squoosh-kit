/**
 * WebP encoder - single-source worker/client implementation
 */

import { isWorker } from '@squoosh-lite/core';
import type {
  WorkerRequest,
  WorkerResponse,
} from '@squoosh-lite/core';
import type { ImageInput } from './index.ts';
import type { WebpOptions } from './index.ts';

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

async function loadWebPModule(): Promise<WebPModule> {
  if (cachedModule) {
    return cachedModule;
  }

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

    // Dynamically import the WebP encoder module
    // Path is relative to this file (packages/webp/src/)
    const modulePath = new URL(
      '../../core/wasm/webp/webp_enc.js',
      import.meta.url
    ).href;
    const moduleFactory = await import(modulePath);

    // Initialize the WebP module with locateFile to properly resolve the WASM
    // The glue file expects to load webp_enc.wasm from the same directory
    const wasmPath = new URL('../../core/wasm/webp/', import.meta.url).href;
    const module = await moduleFactory.default({
      locateFile: (path: string) => {
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
    throw new Error(
      `Failed to load WebP module: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Convert our simplified options to full EncodeOptions
 */
function createEncodeOptions(options?: WebpOptions): EncodeOptions {
  const quality = Math.max(0, Math.min(100, options?.quality ?? 82));
  const lossless = options?.lossless ?? false;
  const nearLossless = options?.nearLossless ?? false;

  // Default encode options from Squoosh
  return {
    quality,
    target_size: 0,
    target_PSNR: 0,
    method: 4,
    sns_strength: 50,
    filter_strength: 60,
    filter_sharpness: 0,
    filter_type: 1,
    partitions: 0,
    segments: 4,
    pass: 1,
    show_compressed: 0,
    preprocessing: 0,
    autofilter: 0,
    partition_limit: 0,
    alpha_compression: 1,
    alpha_filtering: 1,
    alpha_quality: 100,
    lossless: lossless ? 1 : 0,
    exact: 0,
    image_hint: 0,
    emulate_jpeg_size: 0,
    thread_level: 0,
    low_memory: 0,
    near_lossless: nearLossless ? quality : 100,
    use_delta_palette: 0,
    use_sharp_yuv: 0,
  };
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

  // Normalize image input
  const width = image.width;
  const height = image.height;
  const data = image.data;

  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error('Image data must be Uint8Array or Uint8ClampedArray');
  }

  const module = await loadWebPModule();

  // Check abort after async operation
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const encodeOptions = createEncodeOptions(options);

  // Call the encode function
  // Convert Uint8ClampedArray to Uint8Array if needed for BufferSource compatibility
  const dataArray =
    data instanceof Uint8ClampedArray ? new Uint8Array(data) : data;
  // Create a new Uint8Array with a proper ArrayBuffer to satisfy BufferSource
  const buffer = new Uint8Array(dataArray);
  const result = module.encode(buffer, width, height, encodeOptions);

  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!result) {
    throw new Error('WebP encoding failed');
  }

  return result;
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

        const result = await webpEncodeClient(
          controller.signal,
          image,
          options
        );

        response.ok = true;
        response.data = result;

        // Transfer the result buffer back
        const resultBuffer: ArrayBuffer = result.buffer as ArrayBuffer;
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
