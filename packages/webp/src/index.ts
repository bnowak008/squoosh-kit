/**
 * @squoosh-kit/webp public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge } from './bridge';
import type { WebpOptions } from './types';

export type { ImageInput, WebpOptions };

// Global bridge instance for reuse
let globalClientBridge: ReturnType<typeof createBridge> | null = null;

/**
 * A WebP image encoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type WebpEncoderFactory = ((
  imageData: ImageInput,
  options?: WebpOptions,
  signal?: AbortSignal
) => Promise<Uint8Array>) & {
  /**
   * Terminates the encoder and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   *
   * @example
   * const encoder = createWebpEncoder('worker');
   * try {
   *   const result = await encoder(imageData, options);
   * } finally {
   *   await encoder.terminate();
   * }
   */
  terminate(): Promise<void>;
};

/**
 * Encodes an image to WebP format. Uses worker mode for UI responsiveness.
 *
 * @param imageData - The image data to encode.
 * @param options - WebP encoding options.
 * @param signal - (Optional) AbortSignal to cancel the encoding operation.
 *                 If provided, you can cancel the operation by calling
 *                 `controller.abort()` on the associated AbortController.
 *                 If not provided, the operation cannot be cancelled.
 * @returns A Promise resolving to the encoded WebP data as a Uint8Array.
 *
 * @example
 * // With cancellation support
 * const controller = new AbortController();
 * const result = await encode(imageData, { quality: 85 }, controller.signal);
 * setTimeout(() => controller.abort(), 5000);
 *
 * @example
 * // Without cancellation (operation cannot be stopped)
 * const result = await encode(imageData, { quality: 85 });
 */
export async function encode(
  imageData: ImageInput,
  options?: WebpOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  // Use worker mode for UI responsiveness - prevents blocking the main thread
  if (!globalClientBridge) {
    globalClientBridge = createBridge('worker');
  }

  return globalClientBridge.encode(imageData, options, signal);
}

/**
 * Creates a reusable WebP encoder function for a specific execution mode.
 * This is useful for processing multiple images without the overhead of
 * creating a new worker or client instance each time.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @returns A function that encodes an image to WebP format with optional AbortSignal.
 */
export function createWebpEncoder(
  mode: 'worker' | 'client' = 'worker'
): WebpEncoderFactory {
  const bridge = createBridge(mode);

  const encoder = (
    imageData: ImageInput,
    options?: WebpOptions,
    signal?: AbortSignal
  ) => {
    return bridge.encode(imageData, options, signal);
  };

  encoder.terminate = async () => {
    await bridge.terminate();
  };

  return encoder as WebpEncoderFactory;
}
