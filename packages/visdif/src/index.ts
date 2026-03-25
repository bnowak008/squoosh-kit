/**
 * @squoosh-kit/visdif public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge, type BridgeOptions } from './bridge';

export type { ImageInput };
export type { VisDifModule } from './types';

// Global bridge instance for reuse
let globalBridge: ReturnType<typeof createBridge> | null = null;

/**
 * A reusable VisDif comparison function.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type VisDifFactory = ((
  image1: ImageInput,
  image2: ImageInput,
  signal?: AbortSignal
) => Promise<number>) & {
  /**
   * Terminates the VisDif instance and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   *
   * @example
   * const visdif = createVisDiff('worker');
   * try {
   *   const distance = await visdif(image1, image2);
   * } finally {
   *   await visdif.terminate();
   * }
   */
  terminate(): Promise<void>;
};

/**
 * Computes the Butteraugli perceptual distance between two images.
 * Uses worker mode for UI responsiveness.
 *
 * @param image1 - The reference image.
 * @param image2 - The image to compare against the reference.
 * @param signal - (Optional) AbortSignal to cancel the operation.
 * @returns A Promise resolving to the Butteraugli distance (0 = identical).
 *
 * @example
 * const distance = await compare(referenceImage, comparedImage);
 * console.log(`Butteraugli distance: ${distance}`);
 */
export async function compare(
  image1: ImageInput,
  image2: ImageInput,
  signal?: AbortSignal
): Promise<number> {
  if (!globalBridge) {
    globalBridge = createBridge('worker');
  }
  return globalBridge.compare(image1, image2, signal);
}

/**
 * Creates a reusable VisDif comparison function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that computes Butteraugli distance between two images.
 *
 * @example
 * const visdiff = createVisDiff('client');
 * const distance = await visdiff(image1, image2);
 * console.log(`Butteraugli distance: ${distance}`);
 * await visdiff.terminate();
 */
export function createVisDiff(
  mode: 'worker' | 'client' = 'worker',
  options?: BridgeOptions
): VisDifFactory {
  const bridge = createBridge(mode, options);

  return Object.assign(
    (image1: ImageInput, image2: ImageInput, signal?: AbortSignal) => {
      return bridge.compare(image1, image2, signal);
    },
    {
      terminate: async () => {
        await bridge.terminate();
      },
    }
  );
}
