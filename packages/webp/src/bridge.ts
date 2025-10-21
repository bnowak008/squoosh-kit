/**
 * Bridge implementation for the WebP package, handling worker and client modes.
 */

import { callWorker, type ImageInput } from '@squoosh-kit/runtime';
import { webpEncodeClient } from './webp.worker.js';
import type { WebpOptions } from './types.js';

interface WebPBridge {
  encode(
    signal: AbortSignal,
    image: ImageInput,
    options?: WebpOptions
  ): Promise<Uint8Array>;
}

class WebpClientBridge implements WebPBridge {
  async encode(
    signal: AbortSignal,
    image: ImageInput,
    options?: WebpOptions
  ): Promise<Uint8Array> {
    return webpEncodeClient(signal, image, options);
  }
}

class WebpWorkerBridge implements WebPBridge {
  private worker: Worker | null = null;
  private async getWorker(): Promise<Worker> {
    if (!this.worker) {
      const workerUrl = await import.meta.resolve(
        '@squoosh-kit/webp/webp.worker.js'
      );
      this.worker = new Worker(workerUrl, { type: 'module' });
    }
    return this.worker;
  }
  async encode(
    signal: AbortSignal,
    image: ImageInput,
    options?: WebpOptions
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();
    const buffer = image.data.buffer;
    return callWorker(worker, 'webp:encode', { image, options }, signal, [
      buffer as ArrayBuffer,
    ]);
  }
}

export function createBridge(mode: 'worker' | 'client'): WebPBridge {
  return mode === 'client' ? new WebpClientBridge() : new WebpWorkerBridge();
}
