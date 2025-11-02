/**
 * @squoosh-kit/avif public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge } from './bridge';
import type { AvifEncodeInputOptions } from './types';

export type { ImageInput, AvifEncodeInputOptions };

let globalClientBridge: ReturnType<typeof createBridge> | null = null;

/**
 * An AVIF image encoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type AvifEncoderFactory = ((
  imageData: ImageInput,
  options?: AvifEncodeInputOptions,
  signal?: AbortSignal
) => Promise<Uint8Array>) & {
  /**
   * Terminates the encoder and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   */
  terminate(): Promise<void>;
};

/**
 * An AVIF image decoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type AvifDecoderFactory = ((
  buffer: BufferSource,
  signal?: AbortSignal
) => Promise<ImageData>) & {
  /**
   * Terminates the decoder and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   */
  terminate(): Promise<void>;
};

/**
 * Encodes an image to AVIF format. Uses worker mode for UI responsiveness.
 *
 * @param imageData - The image data to encode.
 * @param options - AVIF encoding options.
 * @param signal - (Optional) AbortSignal to cancel the encoding operation.
 * @returns A Promise resolving to the encoded AVIF data as a Uint8Array.
 */
export async function encode(
  imageData: ImageInput,
  options?: AvifEncodeInputOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (!globalClientBridge) {
    globalClientBridge = createBridge('worker');
  }
  return globalClientBridge.encode(imageData, options, signal);
}

/**
 * Decodes AVIF data to image data. Uses worker mode for UI responsiveness.
 *
 * @param buffer - The AVIF file data to decode.
 * @param signal - (Optional) AbortSignal to cancel the decoding operation.
 * @returns A Promise resolving to the decoded image data.
 */
export async function decode(
  buffer: BufferSource,
  signal?: AbortSignal
): Promise<ImageData> {
  if (!globalClientBridge) {
    globalClientBridge = createBridge('worker');
  }
  return globalClientBridge.decode(buffer, signal);
}

/**
 * Creates a reusable AVIF encoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @returns A function that encodes an image to AVIF format with optional AbortSignal.
 */
export function createAvifEncoder(
  mode: 'worker' | 'client' = 'worker'
): AvifEncoderFactory {
  const bridge = createBridge(mode);

  return Object.assign(
    (
      imageData: ImageInput,
      options?: AvifEncodeInputOptions,
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

/**
 * Creates a reusable AVIF decoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @returns A function that decodes AVIF data with optional AbortSignal.
 */
export function createAvifDecoder(
  mode: 'worker' | 'client' = 'worker'
): AvifDecoderFactory {
  const bridge = createBridge(mode);

  return Object.assign(
    (buffer: BufferSource, signal?: AbortSignal) => {
      return bridge.decode(buffer, signal);
    },
    {
      terminate: async () => {
        await bridge.terminate();
      },
    }
  );
}
