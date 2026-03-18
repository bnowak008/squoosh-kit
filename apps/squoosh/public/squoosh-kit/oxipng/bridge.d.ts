/**
 * Bridge implementation for the OxiPNG package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { OxipngOptions } from './types';
export type BridgeOptions = {
    assetPath?: string;
};
interface OxipngBridge {
    optimize(image: ImageInput, options?: OxipngOptions, signal?: AbortSignal): Promise<Uint8Array>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client', options?: BridgeOptions): OxipngBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map