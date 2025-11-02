/**
 * AVIF encoder/decoder - single-source worker/client implementation
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { AvifEncodeInputOptions } from './types';
export declare function avifEncodeClient(image: ImageInput, options?: AvifEncodeInputOptions, signal?: AbortSignal): Promise<Uint8Array>;
export declare function avifDecodeClient(buffer: BufferSource, signal?: AbortSignal): Promise<ImageData>;
//# sourceMappingURL=avif.worker.d.ts.map