/**
 * Bridge implementation for the OxiPNG package, handling worker and client modes.
 */
import { type ImageInput, type BridgeMode } from '@squoosh-kit/runtime';
import type { OxipngOptions } from './types';
export type BridgeOptions = {
    /**
     * Public URL prefix for worker and WASM files.
     * Defaults to `/squoosh-kit` in the browser.
     */
    assetPath?: string;
};
interface OxipngBridge {
    optimize(image: ImageInput, options?: OxipngOptions, signal?: AbortSignal): Promise<Uint8Array>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode?: BridgeMode, options?: BridgeOptions): OxipngBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map