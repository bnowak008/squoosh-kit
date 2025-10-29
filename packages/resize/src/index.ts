/**
 * @squoosh-kit/resize public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge } from './bridge';
import type { ResizeOptions } from './types';

export type { ImageInput, ResizeOptions };

// Global bridge instance for reuse
let globalClientBridge: ReturnType<typeof createBridge> | null = null;

/**
 * A resizable image processor that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type ResizerFactory = ((
  imageData: ImageInput,
  options: ResizeOptions,
  signal?: AbortSignal
) => Promise<ImageInput>) & {
  /**
   * Terminates the resizer and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   *
   * @example
   * const resizer = createResizer('worker');
   * try {
   *   const result = await resizer(imageData, options);
   * } finally {
   *   await resizer.terminate();
   * }
   */
  terminate(): Promise<void>;
};

/**
 * Resizes an image. Uses worker mode for UI responsiveness.
 *
 * @param imageData - The image data to resize.
 * @param options - Resize options.
 * @param signal - (Optional) AbortSignal to cancel the resizing operation.
 *                 If provided, you can cancel the operation by calling
 *                 `controller.abort()` on the associated AbortController.
 *                 If not provided, the operation cannot be cancelled.
 * @returns A Promise resolving to the resized image data.
 *
 * @example
 * // With cancellation support
 * const controller = new AbortController();
 * const result = await resize(imageData, { width: 800 }, controller.signal);
 * setTimeout(() => controller.abort(), 5000);
 *
 * @example
 * // Without cancellation (operation cannot be stopped)
 * const result = await resize(imageData, { width: 800 });
 */
export async function resize(
  imageData: ImageInput,
  options: ResizeOptions,
  signal?: AbortSignal
): Promise<ImageInput> {
  // Use worker mode for UI responsiveness - prevents blocking the main thread
  if (!globalClientBridge) {
    globalClientBridge = createBridge('worker');
  }

  return globalClientBridge.resize(imageData, options, signal);
}

/**
 * Creates a reusable resizer function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @returns A function that resizes an image with optional AbortSignal.
 */
export function createResizer(
  mode: 'worker' | 'client' = 'worker'
): ResizerFactory {
  const bridge = createBridge(mode);

  return Object.assign(
    (imageData: ImageInput, options: ResizeOptions, signal?: AbortSignal) => {
      return bridge.resize(imageData, options, signal);
    },
    {
      terminate: async () => {
        await bridge.terminate();
      },
    }
  );
}
