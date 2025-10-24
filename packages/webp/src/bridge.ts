/**
 * Bridge implementation for the WebP package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateArrayBuffer, validateImageInput } from '@squoosh-kit/runtime';
import type { EncodeInputOptions } from './types';

interface WebPBridge {
  encode(
    image: ImageInput,
    options?: EncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array>;
  terminate(): Promise<void>;
}

class WebpClientBridge implements WebPBridge {
  async encode(
    image: ImageInput,
    options?: EncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    // Dynamically import the client encoder to avoid module loading issues in Vite
    const module = await import('./webp.worker.js');
    const webpEncodeClient = module.webpEncodeClient as (
      image: ImageInput,
      options?: EncodeInputOptions,
      signal?: AbortSignal
    ) => Promise<Uint8Array>;
    return webpEncodeClient(image, options, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class WebpWorkerBridge implements WebPBridge {
  private worker: Worker | null = null;
  private workerReady: Promise<Worker> | null = null;

  private async getWorker(): Promise<Worker> {
    if (!this.worker) {
      if (!this.workerReady) {
        this.workerReady = this.createWorker();
      }
      this.worker = await this.workerReady;
    }
    return this.worker;
  }

  private async createWorker(): Promise<Worker> {
    // Use the centralized worker helper for robust path resolution
    return createReadyWorker('webp.worker');
  }

  async encode(
    image: ImageInput,
    options?: EncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();

    validateImageInput(image);
    const buffer = image.data.buffer;
    validateArrayBuffer(buffer);
    return callWorker(worker, 'webp:encode', { image, options }, signal, [
      buffer,
    ]);
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = null;
    }
  }
}

export function createBridge(mode: 'worker' | 'client'): WebPBridge {
  return mode === 'client' ? new WebpClientBridge() : new WebpWorkerBridge();
}
