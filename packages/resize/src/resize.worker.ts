/**
 * Resize processor - single-source worker/client implementation
 */

import { createWorkerListener, type ImageInput } from '@squoosh-kit/runtime';
import type { ResizeOptions } from './types';

// Apply browser polyfills immediately when the worker loads
if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
  (globalThis as any).self = {
    location: {
      href: 'file:///worker'
    }
  };
}

// Import the Resize WASM module directly
import init from '../dist/wasm/squoosh_resize.js';

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

export async function resizeClient(
  signal: AbortSignal,
  image: ImageInput,
  options: ResizeOptions
): Promise<ImageInput> {
  await initializeWasm();
  
  // Check if the operation was aborted
  if (signal.aborted) {
    throw new DOMException('Operation was aborted', 'AbortError');
  }

  // Convert ImageInput to the format expected by the WASM module
  const { data, width, height } = image;
  
  // Set default options for the WASM module
  const resizeOptions = {
    width: options.width,
    height: options.height,
    method: 'lanczos3', // Default resize method
    premultiply: options.premultiply ?? true,
    linearRGB: options.linearRGB ?? true,
  };

  // Call the WASM resize function
  const result = wasmModule.resize(data, width, height, resizeOptions);
  
  if (!result) {
    throw new Error('Resize operation failed');
  }
  
  return result;
}

createWorkerListener({
  'resize:run': ({
    signal,
    image,
    options,
  }: {
    signal: AbortSignal;
    image: ImageInput;
    options: ResizeOptions;
  }) => resizeClient(signal, image, options),
});
