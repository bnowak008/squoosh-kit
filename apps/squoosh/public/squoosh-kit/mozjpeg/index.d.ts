/**
 * @squoosh-kit/mozjpeg public API
 */
import type { ImageInput } from '@squoosh-kit/runtime';
import { type BridgeOptions } from './bridge';
import type { MozjpegEncodeOptions } from './types';
export type { ImageInput, MozjpegEncodeOptions };
/**
 * A MozJPEG image encoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type MozjpegEncoderFactory = ((imageData: ImageInput, options?: MozjpegEncodeOptions, signal?: AbortSignal) => Promise<Uint8Array>) & {
    /**
     * Terminates the encoder and cleans up resources.
     * Important for worker mode to prevent memory leaks.
     */
    terminate(): Promise<void>;
};
/**
 * A MozJPEG image decoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 * Note: Only available in Bun/Node environments.
 */
export type MozjpegDecoderFactory = ((data: BufferSource, signal?: AbortSignal) => Promise<ImageData>) & {
    /**
     * Terminates the decoder and cleans up resources.
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
export declare function encode(imageData: ImageInput, options?: MozjpegEncodeOptions, signal?: AbortSignal): Promise<Uint8Array>;
/**
 * Decodes a JPEG image to raw ImageData.
 * Note: Only available in Bun/Node environments.
 *
 * @param data - The JPEG data to decode.
 * @param signal - (Optional) AbortSignal to cancel the decoding operation.
 * @returns A Promise resolving to an ImageData object with the decoded pixel data.
 */
export declare function decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
/**
 * Creates a reusable MozJPEG encoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @returns A function that encodes an image to JPEG format with optional AbortSignal.
 */
export declare function createMozjpegEncoder(mode?: 'worker' | 'client', options?: BridgeOptions): MozjpegEncoderFactory;
/**
 * Creates a reusable MozJPEG decoder function for a specific execution mode.
 * Note: Only available in Bun/Node environments.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @returns A function that decodes JPEG data to ImageData with optional AbortSignal.
 */
export declare function createMozjpegDecoder(mode?: 'worker' | 'client', options?: BridgeOptions): MozjpegDecoderFactory;
//# sourceMappingURL=index.d.ts.map