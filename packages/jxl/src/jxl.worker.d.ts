/**
 * JXL encoder/decoder - single-source worker/client implementation
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { EncodeOptions } from './types';
/**
 * Client-mode JXL encoder (exported for direct use)
 */
export declare function jxlEncodeClient(image: ImageInput, options?: Partial<EncodeOptions>, signal?: AbortSignal): Promise<Uint8Array>;
/**
 * Client-mode JXL decoder (exported for direct use)
 */
export declare function jxlDecodeClient(data: Uint8Array, signal?: AbortSignal): Promise<ImageData>;
//# sourceMappingURL=jxl.worker.d.ts.map