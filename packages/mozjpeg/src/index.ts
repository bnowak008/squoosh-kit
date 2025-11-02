/**
 * @squoosh-kit/mozjpeg public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge } from './bridge';
import type { MozjpegEncodeInputOptions } from './types';

export type { ImageInput, MozjpegEncodeInputOptions };

let globalClientBridge: ReturnType<typeof createBridge> | null = null;

/**
 * A MozJPEG image encoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type MozjpegEncoderFactory = ((
  imageData: ImageInput,
  options?: MozjpegEncodeInputOptions,
  signal?: AbortSignal
) => Promise<Uint8Array>) & {
  /**
   * Terminates the encoder and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   */
  terminate(): Promise<void>;
};

/**
 * Encodes an image to JPEG format using MozJPEG. Uses worker mode for UI responsiveness.
 *
 * @param imageData - The image data to encode.
 * @param options - MozJPEG encoding options.
 * @param signal - (Optional) AbortSignal to cancel the encoding operation.
 * @returns A Promise resolving to the encoded JPEG data as a Uint8Array.
 */
export async function encode(
  imageData: ImageInput,
  options?: MozjpegEncodeInputOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (!globalClientBridge) {
    globalClientBridge = createBridge('worker');
  }
  return globalClientBridge.encode(imageData, options, signal);
}

/**
 * Creates a reusable MozJPEG encoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @returns A function that encodes an image to JPEG format with optional AbortSignal.
 */
export function createMozjpegEncoder(
  mode: 'worker' | 'client' = 'worker'
): MozjpegEncoderFactory {
  const bridge = createBridge(mode);

  return Object.assign(
    (
      imageData: ImageInput,
      options?: MozjpegEncodeInputOptions,
      signal?: AbortSignal
    ) => {
      return bridge.encode(imageData, options, signal);
    },
    {
      terminate: async () => {
        await bridge.terminate();
      },
    }
  );
}
