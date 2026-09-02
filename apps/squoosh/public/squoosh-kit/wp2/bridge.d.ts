/**
 * Bridge implementation for the WP2 package, handling worker and client modes.
 */
import { type ImageInput, type BridgeMode } from '@squoosh-kit/runtime';
import type { Wp2EncodeOptions } from './types';
export type BridgeOptions = {
    /**
     * Public URL prefix for worker and WASM files.
     * Defaults to `/squoosh-kit` in the browser.
     */
    assetPath?: string;
};
interface WP2Bridge {
    encode(image: ImageInput, options?: Wp2EncodeOptions, signal?: AbortSignal): Promise<Uint8Array>;
    decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode?: BridgeMode, options?: BridgeOptions): WP2Bridge;
export {};
//# sourceMappingURL=bridge.d.ts.map