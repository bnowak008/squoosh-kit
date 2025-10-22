/**
 * @squoosh-kit/webp public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge } from './bridge';
import type { WebpOptions } from './types';

export type { ImageInput, WebpOptions };

/**
 * Encodes an image to WebP format. Defaults to 'worker' mode.
 *
 * @param signal - An AbortSignal to cancel the encoding operation.
 * @param imageData - The image data to encode.
 * @param options - WebP encoding options.
 * @returns A Promise resolving to the encoded WebP data as a Uint8Array.
 */
export async function encode(
  signal: AbortSignal,
  imageData: ImageInput,
  options?: WebpOptions
): Promise<Uint8Array> {
  // Always use a worker for a single, one-off call for best performance.
  const bridge = createBridge('worker');
  return bridge.encode(signal, imageData, options);
}

/**
 * Creates a reusable WebP encoder function for a specific execution mode.
 * This is useful for processing multiple images without the overhead of
 * creating a new worker or client instance each time.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @returns A function that encodes an image to WebP format.
 */
export function createWebpEncoder(mode: 'worker' | 'client' = 'worker') {
  const bridge = createBridge(mode);

  const test = bridge.encode.bind(bridge);
  return test;
}

// Export the client-side implementation for direct use by the bridge.
// This is not intended for public consumption.
export { webpEncodeClient } from './webp.worker';
