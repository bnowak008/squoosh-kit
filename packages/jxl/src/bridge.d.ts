/**
 * Bridge implementation for the JXL package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { JxlEncodeOptions } from './types';
export type BridgeOptions = {
    assetPath?: string;
};
interface JxlBridge {
    encode(image: ImageInput, options?: JxlEncodeOptions, signal?: AbortSignal): Promise<Uint8Array>;
    decode(data: Uint8Array, signal?: AbortSignal): Promise<ImageData>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client', options?: BridgeOptions): JxlBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map