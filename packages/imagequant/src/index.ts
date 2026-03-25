/**
 * @squoosh-kit/imagequant public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge, type BridgeOptions } from './bridge';
import type { ImagequantOptions } from './types';

export type { ImageInput, ImagequantOptions };

// Global bridge instance for reuse
let globalClientBridge: ReturnType<typeof createBridge> | null = null;

/**
 * A reusable ImageQuant quantizer function.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type ImagequantQuantizerFactory = ((
  image: ImageInput,
  options?: ImagequantOptions,
  signal?: AbortSignal
) => Promise<{ data: Uint8ClampedArray; width: number; height: number }>) & {
  /**
   * Terminates the quantizer and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   *
   * @example
   * const quantizer = createImagequantQuantizer('worker');
   * try {
   *   const result = await quantizer(imageData, options);
   * } finally {
   *   await quantizer.terminate();
   * }
   */
  terminate(): Promise<void>;
};

/**
 * Quantizes an image using ImageQuant. Uses worker mode for UI responsiveness.
 *
 * @param image - The image data to quantize.
 * @param options - ImageQuant options (numColors, dither, zx).
 * @param signal - (Optional) AbortSignal to cancel the operation.
 * @returns A Promise resolving to quantized image data with width and height.
 *
 * @example
 * const result = await quantize(imageData, { numColors: 256, dither: 1.0 });
 */
export async function quantize(
  image: ImageInput,
  options?: ImagequantOptions,
  signal?: AbortSignal
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  if (!globalClientBridge) {
    globalClientBridge = createBridge('worker');
  }

  return globalClientBridge.quantize(image, options, signal);
}

/**
 * Creates a reusable ImageQuant quantizer function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that quantizes an image with optional AbortSignal.
 */
export function createImagequantQuantizer(
  mode: 'worker' | 'client' = 'worker',
  options?: BridgeOptions
): ImagequantQuantizerFactory {
  const bridge = createBridge(mode, options);

  return Object.assign(
    (image: ImageInput, opts?: ImagequantOptions, signal?: AbortSignal) => {
      return bridge.quantize(image, opts, signal);
    },
    {
      terminate: async () => {
        await bridge.terminate();
      },
    }
  );
}
