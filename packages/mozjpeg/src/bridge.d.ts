/**
 * Bridge implementation for the MozJPEG package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { MozjpegEncodeOptions } from './types';
export type BridgeOptions = {
    assetPath?: string;
};
interface MozjpegBridge {
    encode(image: ImageInput, options?: MozjpegEncodeOptions, signal?: AbortSignal): Promise<Uint8Array>;
    decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client', options?: BridgeOptions): MozjpegBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map