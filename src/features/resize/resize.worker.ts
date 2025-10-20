/**
 * Resize processor - single-source worker/client implementation
 */

import { isWorker, hasImageData } from '../../runtime/env.ts';
import type { WorkerRequest, WorkerResponse } from '../../runtime/worker-call.ts';
import type { ImageInput, ResizeOptions } from '../../runtime/worker-bridge.ts';

// Import the resize module
import initResize, { resize as resizeWasm } from '../../../../wasm/resize/squoosh_resize.js';

let initialized = false;

async function ensureResizeInitialized(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    // Initialize the resize module (it will load the WASM file automatically)
    await initResize();
    initialized = true;
  } catch (error) {
    throw new Error(`Failed to load Resize module: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Map ResizeOptions to the typ_idx parameter for the resize function
 * 0: Triangular, 1: Catrom, 2: Mitchell, 3: Lanczos3
 */
function getResizeMethod(): number {
  // Default to Lanczos3 (highest quality)
  return 3;
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

  await ensureResizeInitialized();

  // Check abort after async operation
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const typIdx = getResizeMethod();
  const premultiply = options.premultiply ?? false;
  const colorSpaceConversion = options.linearRGB ?? false;

  // Call the resize function
  const result = resizeWasm(
    data,
    inputWidth,
    inputHeight,
    outputWidth,
    outputHeight,
    typIdx,
    premultiply,
    colorSpaceConversion
  );

  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Return in appropriate format
  if (hasImageData() && typeof ImageData !== 'undefined') {
    return new ImageData(result, outputWidth, outputHeight);
  }
  
  return { data: new Uint8Array(result), width: outputWidth, height: outputHeight };
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
