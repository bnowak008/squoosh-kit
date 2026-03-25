/**
 * AVIF encoder/decoder - single-source worker/client implementation
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { AvifEncodeOptions } from './types';
/**
 * Client-mode AVIF encoder (exported for direct use)
 */
export declare function avifEncodeClient(image: ImageInput, options?: AvifEncodeOptions, signal?: AbortSignal): Promise<Uint8Array>;
/**
 * Client-mode AVIF decoder (exported for direct use)
 */
export declare function avifDecodeClient(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
//# sourceMappingURL=avif.worker.d.ts.map