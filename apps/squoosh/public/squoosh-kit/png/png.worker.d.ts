/**
 * PNG processor - single-source worker/client implementation
 */
import type { ImageInput } from '@squoosh-kit/runtime';
export declare function pngEncodeClient(image: ImageInput, signal?: AbortSignal): Promise<Uint8Array>;
export declare function pngDecodeClient(data: Uint8Array, signal?: AbortSignal): Promise<ImageData>;
//# sourceMappingURL=png.worker.d.ts.map