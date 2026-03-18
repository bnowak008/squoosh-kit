/**
 * Bridge implementation for the PNG package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
export type BridgeOptions = {
    assetPath?: string;
};
interface PngBridge {
    encode(image: ImageInput, signal?: AbortSignal): Promise<Uint8Array>;
    decode(data: Uint8Array, signal?: AbortSignal): Promise<ImageData>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client', options?: BridgeOptions): PngBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map