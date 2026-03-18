/**
 * @squoosh-kit/oxipng public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge, type BridgeOptions } from './bridge';
import type { OxipngOptions } from './types';

export type { ImageInput, OxipngOptions };

// Global bridge instance for reuse
let globalWorkerBridge: ReturnType<typeof createBridge> | null = null;

/**
 * A reusable OxiPNG optimizer function that can be terminated to clean up resources.
 */
export type OxipngOptimizerFactory = ((
  imageData: ImageInput,
  options?: OxipngOptions,
  signal?: AbortSignal
) => Promise<Uint8Array>) & {
  /**
   * Terminates the optimizer and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   *
   * @example
   * const optimizer = createOxipngOptimizer('worker');
   * try {
   *   const result = await optimizer(imageData, { level: 3 });
   * } finally {
   *   await optimizer.terminate();
   * }
   */
  terminate(): Promise<void>;
};

/**
 * Optimizes a PNG image using OxiPNG. Uses worker mode for UI responsiveness.
 *
 * @param imageData - The raw RGBA image data to optimize.
 * @param options - OxiPNG optimization options.
 * @param signal - Optional AbortSignal to cancel the operation.
 * @returns A Promise resolving to the optimized PNG data as a Uint8Array.
 *
 * @example
 * const result = await optimize(imageData, { level: 3 });
 */
export async function optimize(
  imageData: ImageInput,
  options?: OxipngOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (!globalWorkerBridge) {
    globalWorkerBridge = createBridge('worker');
  }

  return globalWorkerBridge.optimize(imageData, options, signal);
}

/**
 * Creates a reusable OxiPNG optimizer for a specific execution mode.
 * Useful for processing multiple images without creating new workers each time.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge configuration options.
 * @returns A function that optimizes a PNG image with optional AbortSignal.
 */
export function createOxipngOptimizer(
  mode: 'worker' | 'client' = 'worker',
  options?: BridgeOptions
): OxipngOptimizerFactory {
  const bridge = createBridge(mode, options);

  return Object.assign(
    (
      imageData: ImageInput,
      optimizeOptions?: OxipngOptions,
      signal?: AbortSignal
    ) => {
      return bridge.optimize(imageData, optimizeOptions, signal);
    },
    {
      terminate: async () => {
        await bridge.terminate();
      },
    }
  );
}
