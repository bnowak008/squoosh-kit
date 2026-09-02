/**
 * Bridge implementation for the JXL package, handling worker and client modes.
 */
import { type ImageInput, type BridgeMode } from '@squoosh-kit/runtime';
import type { JxlEncodeOptions } from './types';
export type BridgeOptions = {
    /**
     * Public URL prefix for worker and WASM files.
     * Defaults to `/squoosh-kit` in the browser.
     */
    assetPath?: string;
};
interface JxlBridge {
    encode(image: ImageInput, options?: JxlEncodeOptions, signal?: AbortSignal): Promise<Uint8Array>;
    decode(data: Uint8Array, signal?: AbortSignal): Promise<ImageData>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode?: BridgeMode, options?: BridgeOptions): JxlBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map