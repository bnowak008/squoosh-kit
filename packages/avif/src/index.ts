/**
 * @squoosh-kit/avif public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge, type BridgeOptions } from './bridge';
import type { AvifEncodeOptions } from './types';
// AVIFTune is a const enum — export as a regular object for runtime use
export const AVIFTune = { auto: 0, psnr: 1, ssim: 2 } as const;
export type AVIFTune = (typeof AVIFTune)[keyof typeof AVIFTune];

export type { ImageInput, AvifEncodeOptions };

// Global bridge instance for reuse
let globalClientBridge: ReturnType<typeof createBridge> | null = null;

/**
 * A reusable AVIF encoder that can be terminated to clean up resources.
 */
export type AvifEncoderFactory = ((
  imageData: ImageInput,
  options?: AvifEncodeOptions,
  signal?: AbortSignal
) => Promise<Uint8Array>) & {
  /**
   * Terminates the encoder and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   *
   * @example
   * const encoder = createAvifEncoder('worker');
   * try {
   *   const result = await encoder(imageData, options);
   * } finally {
   *   await encoder.terminate();
   * }
   */
  terminate(): Promise<void>;
};

/**
 * A reusable AVIF decoder that can be terminated to clean up resources.
 */
export type AvifDecoderFactory = ((
  data: BufferSource,
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
 *
 * @example
 * const controller = new AbortController();
 * const result = await encode(imageData, { quality: 60 }, controller.signal);
 */
export async function encode(
  imageData: ImageInput,
  options?: AvifEncodeOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  // Use worker mode for UI responsiveness - prevents blocking the main thread
  if (!globalClientBridge) {
    globalClientBridge = createBridge('worker');
  }

  return globalClientBridge.encode(imageData, options, signal);
}

/**
 * Decodes AVIF data to ImageData. Uses worker mode for UI responsiveness.
 *
 * @param data - The AVIF binary data to decode.
 * @param signal - (Optional) AbortSignal to cancel the decoding operation.
 * @returns A Promise resolving to the decoded ImageData.
 */
export async function decode(
  data: BufferSource,
  signal?: AbortSignal
): Promise<ImageData> {
  if (!globalClientBridge) {
    globalClientBridge = createBridge('worker');
  }

  return globalClientBridge.decode(data, signal);
}

/**
 * Creates a reusable AVIF encoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge configuration options.
 * @returns A function that encodes an image to AVIF format with optional AbortSignal.
 */
export function createAvifEncoder(
  mode: 'worker' | 'client' = 'worker',
  options?: BridgeOptions
): AvifEncoderFactory {
  const bridge = createBridge(mode, options);

  return Object.assign(
    (
      imageData: ImageInput,
      encodeOptions?: AvifEncodeOptions,
      signal?: AbortSignal
    ) => {
      return bridge.encode(imageData, encodeOptions, signal);
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
 * @param options - Optional bridge configuration options.
 * @returns A function that decodes AVIF data to ImageData with optional AbortSignal.
 */
export function createAvifDecoder(
  mode: 'worker' | 'client' = 'worker',
  options?: BridgeOptions
): AvifDecoderFactory {
  const bridge = createBridge(mode, options);

  return Object.assign(
    (data: BufferSource, signal?: AbortSignal) => {
      return bridge.decode(data, signal);
    },
    {
      terminate: async () => {
        await bridge.terminate();
      },
    }
  );
}
