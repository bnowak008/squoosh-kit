/**
 * @squoosh-kit/resize public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge } from './bridge';
import type { ResizeOptions } from './types';

export type { ImageInput, ResizeOptions };

/**
 * Resizes an image. Defaults to 'worker' mode.
 *
 * @param signal - An AbortSignal to cancel the resizing operation.
 * @param imageData - The image data to resize.
 * @param options - Resize options.
 * @returns A Promise resolving to the resized image data.
 */
export async function resize(
  signal: AbortSignal,
  imageData: ImageInput,
  options: ResizeOptions
): Promise<ImageInput> {
  // Always use a worker for a single, one-off call for best performance.
  const bridge = createBridge('worker');
  return bridge.resize(signal, imageData, options);
}

/**
 * Creates a reusable resizer function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @returns A function that resizes an image.
 */
export function createResizer(mode: 'worker' | 'client' = 'worker') {
  const bridge = createBridge(mode);
  return {
    resize: bridge.resize.bind(bridge)
  };
}

// Export the client-side implementation for direct use by the bridge.
// This is not intended for public consumption.
export { resizeClient } from './resize.worker';
