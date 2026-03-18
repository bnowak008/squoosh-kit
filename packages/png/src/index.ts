/**
 * @squoosh-kit/png public API
 */

import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge, type BridgeOptions } from './bridge';

export type { ImageInput };

// Global bridge instance for reuse
let globalWorkerBridge: ReturnType<typeof createBridge> | null = null;

function getGlobalBridge(): ReturnType<typeof createBridge> {
  if (!globalWorkerBridge) {
    globalWorkerBridge = createBridge('worker');
  }
  return globalWorkerBridge;
}

/**
 * A reusable PNG encoder that can be terminated to clean up resources.
 */
export type PngEncoderFactory = ((
  imageData: ImageInput,
  signal?: AbortSignal
) => Promise<Uint8Array>) & {
  terminate(): Promise<void>;
};

/**
 * A reusable PNG decoder that can be terminated to clean up resources.
 */
export type PngDecoderFactory = ((
  data: Uint8Array,
  signal?: AbortSignal
) => Promise<ImageData>) & {
  terminate(): Promise<void>;
};

/**
 * Encodes raw RGBA image data to PNG format.
 *
 * @param imageData - The raw RGBA image data to encode.
 * @param signal - Optional AbortSignal to cancel the operation.
 * @returns A Promise resolving to the encoded PNG data as a Uint8Array.
 *
 * @example
 * const result = await encode(imageData);
 */
export async function encode(
  imageData: ImageInput,
  signal?: AbortSignal
): Promise<Uint8Array> {
  return getGlobalBridge().encode(imageData, signal);
}

/**
 * Decodes PNG data back to raw image data.
 *
 * @param data - The PNG-encoded data to decode.
 * @param signal - Optional AbortSignal to cancel the operation.
 * @returns A Promise resolving to an ImageData object.
 *
 * @example
 * const imageData = await decode(pngBuffer);
 */
export async function decode(
  data: Uint8Array,
  signal?: AbortSignal
): Promise<ImageData> {
  return getGlobalBridge().decode(data, signal);
}

/**
 * Creates a reusable PNG encoder for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge configuration options.
 * @returns A function that encodes image data to PNG.
 */
export function createPngEncoder(
  mode: 'worker' | 'client' = 'worker',
  options?: BridgeOptions
): PngEncoderFactory {
  const bridge = createBridge(mode, options);

  return Object.assign(
    (imageData: ImageInput, signal?: AbortSignal) => {
      return bridge.encode(imageData, signal);
    },
    {
      terminate: async () => {
        await bridge.terminate();
      },
    }
  );
}

/**
 * Creates a reusable PNG decoder for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge configuration options.
 * @returns A function that decodes PNG data to ImageData.
 */
export function createPngDecoder(
  mode: 'worker' | 'client' = 'worker',
  options?: BridgeOptions
): PngDecoderFactory {
  const bridge = createBridge(mode, options);

  return Object.assign(
    (data: Uint8Array, signal?: AbortSignal) => {
      return bridge.decode(data, signal);
    },
    {
      terminate: async () => {
        await bridge.terminate();
      },
    }
  );
}
