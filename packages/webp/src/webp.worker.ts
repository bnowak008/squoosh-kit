/**
 * WebP encoder - single-source worker/client implementation
 */

import { createWorkerListener, type ImageInput } from '@squoosh-kit/runtime';
import type { WebpOptions } from './types';

// Apply browser polyfills immediately when the worker loads
if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
  (globalThis as any).self = {
    location: {
      href: 'file:///worker'
    }
  };
}

// Import the WebP WASM module directly
import init from '../dist/wasm/webp/webp_enc.js';

let wasmInitialized = false;
let wasmModule: any = null;

// Polyfill for browser APIs in Node.js/Bun environment
function setupBrowserPolyfills() {
  if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
    // Create a minimal self object for WASM modules that expect browser APIs
    (globalThis as any).self = {
      location: {
        href: 'file:///worker'
      }
    };
  }
}

async function initializeWasm() {
  if (!wasmInitialized) {
    setupBrowserPolyfills();
    wasmModule = await init();
    wasmInitialized = true;
  }
}

export async function webpEncodeClient(
  signal: AbortSignal,
  image: ImageInput,
  options?: WebpOptions
): Promise<Uint8Array> {
  await initializeWasm();
  
  // Check if the operation was aborted
  if (signal.aborted) {
    throw new DOMException('Operation was aborted', 'AbortError');
  }

  // Convert ImageInput to the format expected by the WASM module
  const { data, width, height } = image;
  
  // Set default options for the WASM module
  const webpOptions = {
    quality: options?.quality ?? 80,
    target_size: 0,
    target_PSNR: 0,
    method: 6,
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
    lossless: options?.lossless ? 1 : 0,
    exact: 0,
    image_hint: 0,
    emulate_jpeg_size: 0,
    thread_level: 0,
    low_memory: 0,
    near_lossless: options?.nearLossless ? 1 : 0,
    use_delta_palette: 0,
    use_sharp_yuv: 0,
  };

  // Call the WASM encode function
  const result = wasmModule.encode(data, width, height, webpOptions);
  
  if (!result) {
    throw new Error('WebP encoding failed');
  }
  
  return result;
}

createWorkerListener({
  'webp:encode': (payload: {
    signal: AbortSignal;
    image: ImageInput;
    options?: WebpOptions;
  }) => webpEncodeClient(payload.signal, payload.image, payload.options),
} as const);
