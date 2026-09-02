/**
 * Bridge implementation for the visdif package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
export type BridgeOptions = {
    /**
     * Public URL prefix for worker and WASM files.
     * Defaults to `/squoosh-kit` in the browser.
     */
    assetPath?: string;
};
interface VisDifBridge {
    compare(image1: ImageInput, image2: ImageInput, signal?: AbortSignal): Promise<number>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client', options?: BridgeOptions): VisDifBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map