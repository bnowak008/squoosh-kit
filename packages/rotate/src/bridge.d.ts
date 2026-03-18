/**
 * Bridge implementation for the rotate package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { RotateOptions } from './types';
export type BridgeOptions = {
    assetPath?: string;
};
interface RotateBridge {
    rotate(image: ImageInput, options?: RotateOptions, signal?: AbortSignal): Promise<ImageInput>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client', options?: BridgeOptions): RotateBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map