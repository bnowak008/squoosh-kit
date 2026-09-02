/**
 * Bridge implementation for the WebP package, handling worker and client modes.
 */
import { type ImageInput, type BridgeMode } from '@squoosh-kit/runtime';
import type { EncodeInputOptions } from './types';
export type BridgeOptions = {
    /**
     * Public URL prefix for worker and WASM files.
     * Defaults to `/squoosh-kit` in the browser.
     */
    assetPath?: string;
};
interface WebPBridge {
    encode(image: ImageInput, options?: EncodeInputOptions, signal?: AbortSignal): Promise<Uint8Array>;
    decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode?: BridgeMode, options?: BridgeOptions): WebPBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map