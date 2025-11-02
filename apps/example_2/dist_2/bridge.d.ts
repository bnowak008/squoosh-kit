/**
 * Bridge implementation for the AVIF package, handling worker and client modes.
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { AvifEncodeInputOptions } from './types';
interface AvifBridge {
    encode(image: ImageInput, options?: AvifEncodeInputOptions, signal?: AbortSignal): Promise<Uint8Array>;
    decode(buffer: BufferSource, signal?: AbortSignal): Promise<ImageData>;
    terminate(): Promise<void>;
}
export declare function createBridge(mode: 'worker' | 'client'): AvifBridge;
export {};
//# sourceMappingURL=bridge.d.ts.map