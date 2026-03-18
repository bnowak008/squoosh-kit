/**
 * Bridge implementation for the ImageQuant package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { ImagequantOptions } from './types';
export type BridgeOptions = {
    assetPath?: string;
};
interface ImagequantBridge {
    quantize(image: ImageInput, options?: ImagequantOptions, signal?: AbortSignal): Promise<{
        data: Uint8ClampedArray;
        width: number;
        height: number;
    }>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client', options?: BridgeOptions): ImagequantBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map