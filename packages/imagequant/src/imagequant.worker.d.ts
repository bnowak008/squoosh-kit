/**
 * ImageQuant quantizer - single-source worker/client implementation
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { ImagequantOptions } from './types';
/**
 * Client-mode ImageQuant quantizer (exported for direct use)
 */
export declare function imagequantQuantizeClient(image: ImageInput, options?: ImagequantOptions, signal?: AbortSignal): Promise<{
    data: Uint8ClampedArray;
    width: number;
    height: number;
}>;
//# sourceMappingURL=imagequant.worker.d.ts.map