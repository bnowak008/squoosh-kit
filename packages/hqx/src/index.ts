/**
 * @squoosh-kit/hqx public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge, type BridgeOptions } from './bridge';
import type { HqxOptions } from './types';

export type { ImageInput, HqxOptions };

// Global bridge instance for reuse
let globalBridge: ReturnType<typeof createBridge> | null = null;

/**
 * A reusable HQX upscaler function.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type HqxUpscalerFactory = ((
  image: ImageInput,
  options?: HqxOptions,
  signal?: AbortSignal
) => Promise<ImageInput>) & {
  /**
   * Terminates the upscaler and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   *
   * @example
   * const upscaler = createHqxUpscaler('worker');
   * try {
   *   const result = await upscaler(image, { factor: 2 });
   * } finally {
   *   await upscaler.terminate();
   * }
   */
  terminate(): Promise<void>;
};

/**
 * Upscales an image using the HQX algorithm. Uses worker mode for UI responsiveness.
 *
 * @param image - The image data to upscale.
 * @param options - HQX upscale options (factor: 2, 3, or 4).
 * @param signal - (Optional) AbortSignal to cancel the operation.
 * @returns A Promise resolving to the upscaled image.
 *
 * @example
 * const result = await upscale(image, { factor: 2 });
 */
export async function upscale(
  image: ImageInput,
  options?: HqxOptions,
  signal?: AbortSignal
): Promise<ImageInput> {
  if (!globalBridge) {
    globalBridge = createBridge('worker');
  }
  return globalBridge.upscale(image, options, signal);
}

/**
 * Creates a reusable HQX upscaler function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that upscales images using the HQX algorithm.
 *
 * @example
 * const upscaler = createHqxUpscaler('client');
 * const result = await upscaler(image, { factor: 4 });
 * await upscaler.terminate();
 */
export function createHqxUpscaler(
  mode: 'worker' | 'client' = 'worker',
  options?: BridgeOptions
): HqxUpscalerFactory {
  const bridge = createBridge(mode, options);

  return Object.assign(
    (image: ImageInput, opts?: HqxOptions, signal?: AbortSignal) => {
      return bridge.upscale(image, opts, signal);
    },
    {
      terminate: async () => {
        await bridge.terminate();
      },
    }
  );
}
