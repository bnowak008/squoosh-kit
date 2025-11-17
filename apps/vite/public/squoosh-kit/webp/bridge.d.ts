/**
 * Bridge implementation for the WebP package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { EncodeInputOptions } from './types';
export type BridgeOptions = {
    assetPath?: string;
};
interface WebPBridge {
    encode(image: ImageInput, options?: EncodeInputOptions, signal?: AbortSignal): Promise<Uint8Array>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client', options?: BridgeOptions): WebPBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map