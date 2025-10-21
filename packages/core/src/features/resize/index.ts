/**
 * Resize processor public API
 */

import {
  createWorkerBridge,
  type WorkerBridge,
  type ImageInput,
  type ResizeOptions,
} from '../../runtime/worker-bridge.ts';

export type { ResizeOptions, ImageInput };

/**
 * Primary resize function
 *
 * @param signal - AbortSignal to cancel the operation
 * @param workerBridge - WorkerBridge instance or null to use default worker mode
 * @param imageData - Image data to resize (ImageData or { data, width, height })
 * @param options - Resize options
 * @returns Promise resolving to resized image data
 */
export async function resize(
  signal: AbortSignal,
  workerBridge: WorkerBridge | null,
  imageData: ImageInput,
  options: ResizeOptions
): Promise<ImageInput> {
  const bridge = workerBridge ?? createWorkerBridge('worker');
  return bridge.resize(signal, imageData, options);
}

/**
 * Convenience factory: bind runtime once, then call with (signal, image, options)
 *
 * @param mode - Execution mode: 'worker' (default) or 'client'
 * @returns Resizer function bound to the specified mode
 */
export function createResizer(mode: 'worker' | 'client' = 'worker') {
  const bridge = createWorkerBridge(mode);

  return (
    signal: AbortSignal,
    imageData: ImageInput,
    options: ResizeOptions
  ): Promise<ImageInput> => {
    return bridge.resize(signal, imageData, options);
  };
}
