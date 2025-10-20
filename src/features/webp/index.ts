/**
 * WebP encoder public API
 */

import { createWorkerBridge, type WorkerBridge, type ImageInput, type WebpOptions } from '../../runtime/worker-bridge.ts';

export type { WebpOptions, ImageInput };

/**
 * Primary WebP encode function
 * 
 * @param signal - AbortSignal to cancel the operation
 * @param workerBridge - WorkerBridge instance or null to use default worker mode
 * @param imageData - Image data to encode (ImageData or { data, width, height })
 * @param options - WebP encoding options
 * @returns Promise resolving to encoded WebP file data
 */
export async function encode(
  signal: AbortSignal,
  workerBridge: WorkerBridge | null,
  imageData: ImageInput,
  options?: WebpOptions
): Promise<Uint8Array> {
  const bridge = workerBridge ?? createWorkerBridge('worker');
  return bridge.webpEncode(signal, imageData, options);
}

/**
 * Convenience factory: bind runtime once, then call with (signal, image, options)
 * 
 * @param mode - Execution mode: 'worker' (default) or 'client'
 * @returns Encoder function bound to the specified mode
 */
export function createWebpEncoder(mode: 'worker' | 'client' = 'worker') {
  const bridge = createWorkerBridge(mode);
  
  return (
    signal: AbortSignal,
    imageData: ImageInput,
    options?: WebpOptions
  ): Promise<Uint8Array> => {
    return bridge.webpEncode(signal, imageData, options);
  };
}
