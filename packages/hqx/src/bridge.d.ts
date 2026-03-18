/**
 * Bridge implementation for the HQX package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { HqxOptions } from './types';
export type BridgeOptions = {
    assetPath?: string;
};
interface HqxBridge {
    upscale(image: ImageInput, options?: HqxOptions, signal?: AbortSignal): Promise<ImageInput>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client', options?: BridgeOptions): HqxBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map