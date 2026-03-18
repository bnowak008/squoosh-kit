/**
 * QOI encoder/decoder - single-source worker/client implementation
 */
import { type ImageInput } from '@squoosh-kit/runtime';
/**
 * Client-mode QOI encoder (exported for direct use)
 */
export declare function qoiEncodeClient(image: ImageInput, signal?: AbortSignal): Promise<Uint8Array>;
/**
 * Client-mode QOI decoder (exported for direct use)
 */
export declare function qoiDecodeClient(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
//# sourceMappingURL=qoi.worker.d.ts.map