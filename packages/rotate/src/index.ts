/**
 * @squoosh-kit/rotate public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge, type BridgeOptions } from './bridge';
import type { RotateOptions } from './types';

export type { ImageInput, RotateOptions };

// Global bridge instance for reuse
let globalBridge: ReturnType<typeof createBridge> | null = null;

/**
 * A reusable image rotator function.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type RotatorFactory = ((
  image: ImageInput,
  options?: RotateOptions,
  signal?: AbortSignal
) => Promise<ImageInput>) & {
  /**
   * Terminates the rotator and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   *
   * @example
   * const rotator = createRotator('worker');
   * try {
   *   const result = await rotator(image, { rotate: 90 });
   * } finally {
   *   await rotator.terminate();
   * }
   */
  terminate(): Promise<void>;
};

/**
 * Rotates an image by the given number of degrees. Uses worker mode for UI responsiveness.
 *
 * @param image - The image data to rotate.
 * @param options - Rotate options (rotate: 0, 90, 180, or 270).
 * @param signal - (Optional) AbortSignal to cancel the operation.
 * @returns A Promise resolving to the rotated image.
 *
 * @example
 * const result = await rotate(image, { rotate: 90 });
 */
export async function rotate(
  image: ImageInput,
  options?: RotateOptions,
  signal?: AbortSignal
): Promise<ImageInput> {
  if (!globalBridge) {
    globalBridge = createBridge('worker');
  }
  return globalBridge.rotate(image, options, signal);
}

/**
 * Creates a reusable image rotator function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that rotates images with optional AbortSignal.
 *
 * @example
 * const rotator = createRotator('client');
 * const result = await rotator(image, { rotate: 180 });
 * await rotator.terminate();
 */
export function createRotator(
  mode: 'worker' | 'client' = 'worker',
  options?: BridgeOptions
): RotatorFactory {
  const bridge = createBridge(mode, options);

  return Object.assign(
    (image: ImageInput, opts?: RotateOptions, signal?: AbortSignal) => {
      return bridge.rotate(image, opts, signal);
    },
    {
      terminate: async () => {
        await bridge.terminate();
      },
    }
  );
}
