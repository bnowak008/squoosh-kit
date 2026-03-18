/**
 * Bridge implementation for the QOI package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
export type BridgeOptions = {
    assetPath?: string;
};
interface QoiBridge {
    encode(image: ImageInput, signal?: AbortSignal): Promise<Uint8Array>;
    decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client', options?: BridgeOptions): QoiBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map