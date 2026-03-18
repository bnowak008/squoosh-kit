/**
 * MozJPEG encoder/decoder - single-source worker/client implementation
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { MozjpegEncodeOptions } from './types';
/**
 * Client-mode MozJPEG encoder (exported for direct use)
 */
export declare function mozjpegEncodeClient(image: ImageInput, options?: MozjpegEncodeOptions, signal?: AbortSignal): Promise<Uint8Array>;
/**
 * Client-mode MozJPEG decoder (exported for direct use)
 * Note: Only available in Bun/Node environments (no browser decoder available).
 */
export declare function mozjpegDecodeClient(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
//# sourceMappingURL=mozjpeg.worker.d.ts.map