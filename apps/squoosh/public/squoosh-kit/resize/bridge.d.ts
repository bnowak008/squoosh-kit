/**
 * Bridge implementation for the Resize package, handling worker and client modes.
 */
import { type ImageInput, type BridgeMode } from '@squoosh-kit/runtime';
import type { ResizeOptions } from './types.ts';
export type BridgeOptions = {
    /**
     * Public URL prefix for worker and WASM files.
     * Defaults to `/squoosh-kit` in the browser.
     */
    assetPath?: string;
};
interface ResizeBridge {
    resize(image: ImageInput, options: ResizeOptions, signal?: AbortSignal): Promise<ImageInput>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode?: BridgeMode, options?: BridgeOptions): ResizeBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map