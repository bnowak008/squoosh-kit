/**
 * WebP encoder - single-source worker/client implementation
 */

import { isWorker } from '../../runtime/env.ts';
import type { WorkerRequest, WorkerResponse } from '../../runtime/worker-call.ts';
import type { ImageInput, WebpOptions } from '../../runtime/worker-bridge.ts';

// Import the WebP encoder module
import initWebPModule, { type WebPModule, type EncodeOptions } from '../../../../wasm/webp/webp_enc.js';

let cachedModule: WebPModule | null = null;

async function loadWebPModule(): Promise<WebPModule> {
  if (cachedModule) {
    return cachedModule;
  }

  try {
    // Initialize the WebP module (it will load the WASM file automatically)
    cachedModule = await initWebPModule();
    return cachedModule;
  } catch (error) {
    throw new Error(`Failed to load WebP module: ${error instanceof Error ? error.message : String(error)}`);
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

  if (!(data instanceof Uint8Array)) {
    throw new Error('Image data must be Uint8Array');
  }

  const module = await loadWebPModule();

  // Check abort after async operation
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const encodeOptions = createEncodeOptions(options);

  // Call the encode function
  const result = module.encode(data, width, height, encodeOptions);

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
