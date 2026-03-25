/**
 * @squoosh-kit/webp public API
 */
import type { ImageInput } from '@squoosh-kit/runtime';
import { type BridgeOptions } from './bridge';
import type { EncodeInputOptions } from './types';
export type { ImageInput, EncodeInputOptions };
/**
 * A WebP image encoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type WebpEncoderFactory = ((imageData: ImageInput, options?: EncodeInputOptions, signal?: AbortSignal) => Promise<Uint8Array>) & {
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
 * A WebP image decoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type WebpDecoderFactory = ((data: BufferSource, signal?: AbortSignal) => Promise<ImageData>) & {
    /**
     * Terminates the decoder and cleans up resources.
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
export declare function encode(imageData: ImageInput, options?: EncodeInputOptions, signal?: AbortSignal): Promise<Uint8Array>;
/**
 * Decodes a WebP image to raw ImageData. Uses worker mode for UI responsiveness.
 *
 * @param data - The WebP data to decode.
 * @param signal - (Optional) AbortSignal to cancel the decoding operation.
 * @returns A Promise resolving to an ImageData object with the decoded pixel data.
 */
export declare function decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
/**
 * Creates a reusable WebP encoder function for a specific execution mode.
 * This is useful for processing multiple images without the overhead of
 * creating a new worker or client instance each time.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @returns A function that encodes an image to WebP format with optional AbortSignal.
 */
export declare function createWebpEncoder(mode?: 'worker' | 'client', options?: BridgeOptions): WebpEncoderFactory;
/**
 * Creates a reusable WebP decoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @returns A function that decodes WebP data to ImageData with optional AbortSignal.
 */
export declare function createWebpDecoder(mode?: 'worker' | 'client', options?: BridgeOptions): WebpDecoderFactory;
//# sourceMappingURL=index.d.ts.map