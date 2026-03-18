/**
 * @squoosh-kit/wp2 public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge, type BridgeOptions } from './bridge';
import type { Wp2EncodeOptions } from './types';

export type { ImageInput, Wp2EncodeOptions };

// Re-export UVMode and Csp enum values as plain objects for runtime use
// (const enums are erased at compile time; these runtime objects allow consumers to use them)
export const UVMode = {
  UVModeAdapt: 0,
  UVMode420: 1,
  UVMode444: 2,
  UVModeAuto: 3,
} as const;

export const Csp = {
  kYCoCg: 0,
  kYCbCr: 1,
  kCustom: 2,
  kYIQ: 3,
} as const;

// Global bridge instance for encode/decode reuse
let globalClientBridge: ReturnType<typeof createBridge> | null = null;

/**
 * A WP2 image encoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type Wp2EncoderFactory = ((
  imageData: ImageInput,
  options?: Wp2EncodeOptions,
  signal?: AbortSignal
) => Promise<Uint8Array>) & {
  /**
   * Terminates the encoder and cleans up resources.
   * Important for worker mode to prevent memory leaks.
   *
   * @example
   * const encoder = createWp2Encoder('worker');
   * try {
   *   const result = await encoder(imageData, options);
   * } finally {
   *   await encoder.terminate();
   * }
   */
  terminate(): Promise<void>;
};

/**
 * A WP2 image decoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type Wp2DecoderFactory = ((
  data: BufferSource,
  signal?: AbortSignal
) => Promise<ImageData>) & {
  /**
   * Terminates the decoder and cleans up resources.
   */
  terminate(): Promise<void>;
};

/**
 * Encodes an image to WP2 format. Uses worker mode for UI responsiveness.
 *
 * @param imageData - The image data to encode.
 * @param options - WP2 encoding options.
 * @param signal - (Optional) AbortSignal to cancel the encoding operation.
 * @returns A Promise resolving to the encoded WP2 data as a Uint8Array.
 *
 * @example
 * const controller = new AbortController();
 * const result = await encode(imageData, { quality: 85 }, controller.signal);
 */
export async function encode(
  imageData: ImageInput,
  options?: Wp2EncodeOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (!globalClientBridge) {
    globalClientBridge = createBridge('worker');
  }

  return globalClientBridge.encode(imageData, options, signal);
}

/**
 * Decodes a WP2 image to raw ImageData. Uses worker mode for UI responsiveness.
 *
 * @param data - The WP2 data to decode.
 * @param signal - (Optional) AbortSignal to cancel the decoding operation.
 * @returns A Promise resolving to an ImageData object with the decoded pixel data.
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
 * Creates a reusable WP2 encoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that encodes an image to WP2 format with optional AbortSignal.
 */
export function createWp2Encoder(
  mode: 'worker' | 'client' = 'worker',
  options?: BridgeOptions
): Wp2EncoderFactory {
  const bridge = createBridge(mode, options);

  return Object.assign(
    (
      imageData: ImageInput,
      options?: Wp2EncodeOptions,
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
 * Creates a reusable WP2 decoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that decodes WP2 data to ImageData with optional AbortSignal.
 */
export function createWp2Decoder(
  mode: 'worker' | 'client' = 'worker',
  options?: BridgeOptions
): Wp2DecoderFactory {
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
