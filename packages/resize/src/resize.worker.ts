/**
 * Resize processor - single-source worker/client implementation
 */

import {
  hasImageData,
  type WorkerRequest,
  type WorkerResponse,
  type ImageInput,
} from '@squoosh-kit/runtime';
import type { ResizeOptions } from './types.ts';

// Define the type locally to avoid module resolution issues with the linter
type SquooshWasmResize = (
  data: Uint8Array,
  input_width: number,
  input_height: number,
  output_width: number,
  output_height: number,
  typ_idx: number,
  premultiply: number,
  color_space_conversion: number,
) => Uint8Array;

let wasmResize: SquooshWasmResize | null = null;

async function init(): Promise<void> {
  if (wasmResize) {
    return;
  }

  const wasmDirectory = './wasm/resize';
  const modulePath = await import.meta.resolve(
    `${wasmDirectory}/squoosh_resize.js`,
  );
  const module = await import(modulePath);

  // Squoosh's WASM modules expect to be initialized with promises
  await module.default(
    fetch(new URL(`${wasmDirectory}/squoosh_resize_bg.wasm`, modulePath)),
  );
  wasmResize = module.resize;
}

async function _resizeCore(
  image: ImageInput,
  options: ResizeOptions,
): Promise<ImageInput> {
  await init();
  if (!wasmResize) {
    throw new Error('Resize module not initialized');
  }

  const { data, width: inputWidth, height: inputHeight } = image;

  let outputWidth = options.width ?? inputWidth;
  let outputHeight = options.height ?? inputHeight;

  if (options.width && !options.height) {
    outputHeight = Math.round((inputHeight * options.width) / inputWidth);
  } else if (options.height && !options.width) {
    outputWidth = Math.round((inputWidth * options.height) / inputHeight);
  }

  if (outputWidth <= 0 || outputHeight <= 0) {
    throw new Error('Invalid output dimensions');
  }

  const dataArray =
    data instanceof Uint8ClampedArray ? new Uint8Array(data) : data;

  const result = wasmResize(
    dataArray,
    inputWidth,
    inputHeight,
    outputWidth,
    outputHeight,
    getResizeMethod(),
    options.premultiply ? 1 : 0,
    options.linearRGB ? 1 : 0,
  );

  return {
    data: result,
    width: outputWidth,
    height: outputHeight,
  };
}

export async function resizeClient(
  signal: AbortSignal,
  image: ImageInput,
  options: ResizeOptions,
): Promise<ImageInput> {
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  return _resizeCore(image, options);
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
 * Worker message handler
 */
if (typeof self !== 'undefined') {
  self.onmessage = async (
    event: MessageEvent<
      WorkerRequest<{ image: ImageInput; options: ResizeOptions }>
    >,
  ) => {
    const { id, type, payload } = event.data;

    const response: WorkerResponse<ImageInput> = { id, ok: false };

    try {
      if (type !== 'resize:run') {
        throw new Error(`Unknown message type: ${type}`);
      }

      const resultImage = await _resizeCore(payload.image, payload.options);

      response.ok = true;
      response.data = resultImage;

      const transferable = resultImage.data.buffer;
      if (transferable) {
        self.postMessage(response, [transferable as ArrayBuffer]);
      } else {
        self.postMessage(response);
      }
    } catch (error) {
      response.error = error instanceof Error ? error.message : String(error);
      self.postMessage(response);
    }
  };
}
