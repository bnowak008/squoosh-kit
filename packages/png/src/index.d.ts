/**
 * @squoosh-kit/png public API
 */
import type { ImageInput } from '@squoosh-kit/runtime';
import { type BridgeOptions } from './bridge';
export type { ImageInput };
/**
 * A reusable PNG encoder that can be terminated to clean up resources.
 */
export type PngEncoderFactory = ((imageData: ImageInput, signal?: AbortSignal) => Promise<Uint8Array>) & {
    terminate(): Promise<void>;
};
/**
 * A reusable PNG decoder that can be terminated to clean up resources.
 */
export type PngDecoderFactory = ((data: Uint8Array, signal?: AbortSignal) => Promise<ImageData>) & {
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
export declare function encode(imageData: ImageInput, signal?: AbortSignal): Promise<Uint8Array>;
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
export declare function decode(data: Uint8Array, signal?: AbortSignal): Promise<ImageData>;
/**
 * Creates a reusable PNG encoder for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge configuration options.
 * @returns A function that encodes image data to PNG.
 */
export declare function createPngEncoder(mode?: 'worker' | 'client', options?: BridgeOptions): PngEncoderFactory;
/**
 * Creates a reusable PNG decoder for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge configuration options.
 * @returns A function that decodes PNG data to ImageData.
 */
export declare function createPngDecoder(mode?: 'worker' | 'client', options?: BridgeOptions): PngDecoderFactory;
//# sourceMappingURL=index.d.ts.map