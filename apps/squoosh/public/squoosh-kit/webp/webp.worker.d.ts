/**
 * WebP encoder/decoder - single-source worker/client implementation
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { EncodeInputOptions } from './types';
/**
 * Client-mode WebP encoder (exported for direct use)
 */
export declare function webpEncodeClient(image: ImageInput, options?: EncodeInputOptions, signal?: AbortSignal): Promise<Uint8Array>;
/**
 * Client-mode WebP decoder (exported for direct use)
 */
export declare function webpDecodeClient(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
//# sourceMappingURL=webp.worker.d.ts.map