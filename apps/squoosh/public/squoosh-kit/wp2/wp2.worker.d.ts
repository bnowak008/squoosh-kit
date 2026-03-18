/**
 * WP2 encoder/decoder - single-source worker/client implementation
 */
import { type ImageInput } from '@squoosh-kit/runtime';
import type { Wp2EncodeOptions } from './types';
/**
 * Client-mode WP2 encoder (exported for direct use)
 */
export declare function wp2EncodeClient(image: ImageInput, options?: Wp2EncodeOptions, signal?: AbortSignal): Promise<Uint8Array>;
/**
 * Client-mode WP2 decoder (exported for direct use)
 */
export declare function wp2DecodeClient(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
//# sourceMappingURL=wp2.worker.d.ts.map