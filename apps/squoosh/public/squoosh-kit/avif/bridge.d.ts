/**
 * Bridge implementation for the AVIF package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { AvifEncodeOptions } from './types';
export type BridgeOptions = {
    assetPath?: string;
};
interface AvifBridge {
    encode(image: ImageInput, options?: AvifEncodeOptions, signal?: AbortSignal): Promise<Uint8Array>;
    decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client', options?: BridgeOptions): AvifBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map