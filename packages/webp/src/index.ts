/**
 * @squoosh-lite/webp - WebP encoding for Squoosh Lite
 */

import { callWorker } from '@squoosh-lite/core';
import type { ImageInput, BridgeMode } from '@squoosh-lite/core';

export type { ImageInput };

export interface WebpOptions {
  quality?: number;
  lossless?: boolean;
  nearLossless?: boolean;
}

/**
 * WebP encoder bridge interface
 */
export interface WebpBridge {
  encode(
    signal: AbortSignal,
    image: ImageInput,
    options?: WebpOptions
  ): Promise<Uint8Array>;
  terminate?: () => void;
}

/**
 * Worker-based WebP encoder implementation
 */
class WebpWorkerBridge implements WebpBridge {
  private worker: Worker | null = null;

  private getWorker(): Worker {
    if (!this.worker) {
      const workerUrl = new URL('./webp.worker.js', import.meta.url);
      this.worker = new Worker(workerUrl.href, { type: 'module' });
    }
    return this.worker;
  }

  async encode(
    signal: AbortSignal,
    image: ImageInput,
    options?: WebpOptions
  ): Promise<Uint8Array> {
    const worker = this.getWorker();
    const buffer = image.data.buffer;

    const result = await callWorker<
      { image: ImageInput; options?: WebpOptions },
      Uint8Array
    >(worker, 'webp:encode', { image, options }, signal, [buffer]);

    return result;
  }

  terminate() {
    this.worker?.terminate();
  }
}

/**
 * Client-mode WebP encoder implementation
 */
class WebpClientBridge implements WebpBridge {
  async encode(
    signal: AbortSignal,
    image: ImageInput,
    options?: WebpOptions
  ): Promise<Uint8Array> {
    const { webpEncodeClient } = await import('./webp.worker.ts');
    return webpEncodeClient(signal, image, options);
  }
}

/**
 * Create a WebP encoder bridge with the specified mode
 */
export function createWebpBridge(mode: BridgeMode = 'worker'): WebpBridge {
  if (mode === 'client') {
    return new WebpClientBridge();
  }
  return new WebpWorkerBridge();
}

/**
 * Primary WebP encode function
 *
 * @param signal - AbortSignal to cancel the operation
 * @param workerBridge - WebpBridge instance or null to use default worker mode
 * @param imageData - Image data to encode (ImageData or { data, width, height })
 * @param options - WebP encoding options
 * @returns Promise resolving to encoded WebP file data
 */
export async function encode(
  signal: AbortSignal,
  workerBridge: WebpBridge | null,
  imageData: ImageInput,
  options?: WebpOptions
): Promise<Uint8Array> {
  const bridge = workerBridge ?? createWebpBridge('worker');
  return bridge.encode(signal, imageData, options);
}

/**
 * Convenience factory: bind runtime once, then call with (signal, image, options)
 *
 * @param mode - Execution mode: 'worker' (default) or 'client'
 * @returns Encoder function bound to the specified mode
 */
export function createWebpEncoder(mode: BridgeMode = 'worker') {
  const bridge = createWebpBridge(mode);

  return (
    signal: AbortSignal,
    imageData: ImageInput,
    options?: WebpOptions
  ): Promise<Uint8Array> => {
    return bridge.encode(signal, imageData, options);
  };
}
