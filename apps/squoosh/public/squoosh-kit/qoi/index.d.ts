/**
 * @squoosh-kit/qoi public API
 */
import type { ImageInput } from '@squoosh-kit/runtime';
import { type BridgeOptions } from './bridge';
export type { ImageInput };
/**
 * A reusable QOI encoder function.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type QoiEncoderFactory = ((image: ImageInput, signal?: AbortSignal) => Promise<Uint8Array>) & {
    /**
     * Terminates the encoder and cleans up resources.
     * Important for worker mode to prevent memory leaks.
     *
     * @example
     * const encoder = createQoiEncoder('worker');
     * try {
     *   const result = await encoder(imageData);
     * } finally {
     *   await encoder.terminate();
     * }
     */
    terminate(): Promise<void>;
};
/**
 * A reusable QOI decoder function.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type QoiDecoderFactory = ((data: BufferSource, signal?: AbortSignal) => Promise<ImageData>) & {
    /**
     * Terminates the decoder and cleans up resources.
     */
    terminate(): Promise<void>;
};
/**
 * Encodes an image to QOI format. Uses worker mode for UI responsiveness.
 *
 * @param image - The image data to encode.
 * @param signal - (Optional) AbortSignal to cancel the operation.
 * @returns A Promise resolving to the encoded QOI data as a Uint8Array.
 *
 * @example
 * const result = await encode(imageData);
 */
export declare function encode(image: ImageInput, signal?: AbortSignal): Promise<Uint8Array>;
/**
 * Decodes a QOI image to raw ImageData. Uses worker mode for UI responsiveness.
 *
 * @param data - The QOI data to decode.
 * @param signal - (Optional) AbortSignal to cancel the operation.
 * @returns A Promise resolving to an ImageData object with the decoded pixel data.
 */
export declare function decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
/**
 * Creates a reusable QOI encoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that encodes an image to QOI format with optional AbortSignal.
 */
export declare function createQoiEncoder(mode?: 'worker' | 'client', options?: BridgeOptions): QoiEncoderFactory;
/**
 * Creates a reusable QOI decoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that decodes QOI data to ImageData with optional AbortSignal.
 */
export declare function createQoiDecoder(mode?: 'worker' | 'client', options?: BridgeOptions): QoiDecoderFactory;
//# sourceMappingURL=index.d.ts.map