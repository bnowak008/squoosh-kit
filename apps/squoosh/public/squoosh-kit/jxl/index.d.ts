/**
 * @squoosh-kit/jxl public API
 */
import type { ImageInput } from '@squoosh-kit/runtime';
import { type BridgeOptions } from './bridge';
import type { JxlEncodeOptions } from './types';
export type { ImageInput, JxlEncodeOptions };
/**
 * A JXL image encoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type JxlEncoderFactory = ((imageData: ImageInput, options?: JxlEncodeOptions, signal?: AbortSignal) => Promise<Uint8Array>) & {
    /**
     * Terminates the encoder and cleans up resources.
     * Important for worker mode to prevent memory leaks.
     *
     * @example
     * const encoder = createJxlEncoder('worker');
     * try {
     *   const result = await encoder(imageData, options);
     * } finally {
     *   await encoder.terminate();
     * }
     */
    terminate(): Promise<void>;
};
/**
 * A JXL image decoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type JxlDecoderFactory = ((data: Uint8Array, signal?: AbortSignal) => Promise<ImageData>) & {
    /**
     * Terminates the decoder and cleans up resources.
     * Important for worker mode to prevent memory leaks.
     */
    terminate(): Promise<void>;
};
/**
 * Encodes an image to JPEG XL format. Uses worker mode for UI responsiveness.
 *
 * @param imageData - The image data to encode.
 * @param options - JXL encoding options.
 * @param signal - (Optional) AbortSignal to cancel the encoding operation.
 * @returns A Promise resolving to the encoded JXL data as a Uint8Array.
 *
 * @example
 * const controller = new AbortController();
 * const result = await encode(imageData, { quality: 85 }, controller.signal);
 */
export declare function encode(imageData: ImageInput, options?: JxlEncodeOptions, signal?: AbortSignal): Promise<Uint8Array>;
/**
 * Decodes a JPEG XL image. Uses worker mode for UI responsiveness.
 *
 * @param data - The JXL-encoded data to decode.
 * @param signal - (Optional) AbortSignal to cancel the decoding operation.
 * @returns A Promise resolving to an ImageData-like object.
 *
 * @example
 * const imageData = await decode(jxlBuffer);
 */
export declare function decode(data: Uint8Array, signal?: AbortSignal): Promise<ImageData>;
/**
 * Creates a reusable JXL encoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that encodes an image to JXL format with optional AbortSignal.
 */
export declare function createJxlEncoder(mode?: 'worker' | 'client', options?: BridgeOptions): JxlEncoderFactory;
/**
 * Creates a reusable JXL decoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that decodes JXL data with optional AbortSignal.
 */
export declare function createJxlDecoder(mode?: 'worker' | 'client', options?: BridgeOptions): JxlDecoderFactory;
//# sourceMappingURL=index.d.ts.map