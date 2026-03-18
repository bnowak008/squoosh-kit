/**
 * @squoosh-kit/wp2 public API
 */
import type { ImageInput } from '@squoosh-kit/runtime';
import { type BridgeOptions } from './bridge';
import type { Wp2EncodeOptions } from './types';
export type { ImageInput, Wp2EncodeOptions };
export declare const UVMode: {
    readonly UVModeAdapt: 0;
    readonly UVMode420: 1;
    readonly UVMode444: 2;
    readonly UVModeAuto: 3;
};
export declare const Csp: {
    readonly kYCoCg: 0;
    readonly kYCbCr: 1;
    readonly kCustom: 2;
    readonly kYIQ: 3;
};
/**
 * A WP2 image encoder that can be reused for multiple operations.
 * Can be terminated to clean up associated resources (especially workers).
 */
export type Wp2EncoderFactory = ((imageData: ImageInput, options?: Wp2EncodeOptions, signal?: AbortSignal) => Promise<Uint8Array>) & {
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
export type Wp2DecoderFactory = ((data: BufferSource, signal?: AbortSignal) => Promise<ImageData>) & {
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
export declare function encode(imageData: ImageInput, options?: Wp2EncodeOptions, signal?: AbortSignal): Promise<Uint8Array>;
/**
 * Decodes a WP2 image to raw ImageData. Uses worker mode for UI responsiveness.
 *
 * @param data - The WP2 data to decode.
 * @param signal - (Optional) AbortSignal to cancel the decoding operation.
 * @returns A Promise resolving to an ImageData object with the decoded pixel data.
 */
export declare function decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
/**
 * Creates a reusable WP2 encoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that encodes an image to WP2 format with optional AbortSignal.
 */
export declare function createWp2Encoder(mode?: 'worker' | 'client', options?: BridgeOptions): Wp2EncoderFactory;
/**
 * Creates a reusable WP2 decoder function for a specific execution mode.
 *
 * @param mode - The execution mode, either 'worker' or 'client'.
 * @param options - Optional bridge options.
 * @returns A function that decodes WP2 data to ImageData with optional AbortSignal.
 */
export declare function createWp2Decoder(mode?: 'worker' | 'client', options?: BridgeOptions): Wp2DecoderFactory;
//# sourceMappingURL=index.d.ts.map