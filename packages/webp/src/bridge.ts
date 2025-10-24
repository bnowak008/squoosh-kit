/**
 * Bridge implementation for the WebP package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateArrayBuffer, validateImageInput } from '@squoosh-kit/runtime';
import { webpEncodeClient } from './webp.worker.js';
import type { EncodeOptions } from './types';


interface WebPBridge {
  encode(
    image: ImageInput,
    options?: EncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array>;
  terminate(): Promise<void>;
}

class WebpClientBridge implements WebPBridge {
  async encode(
    image: ImageInput,
    options?: EncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
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
    options?: EncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();

    // Validate and normalize image - ensure all required properties exist
    if (!image || typeof image !== 'object') {
      throw new TypeError('image must be an object');
    }

    const imageRecord = image as Record<string, unknown>;
    if (!imageRecord.data) {
      throw new TypeError('image.data is required');
    }
    if (imageRecord.width === undefined || imageRecord.height === undefined) {
      throw new TypeError('image.width and image.height are required');
    }

    const normalizedImage: ImageInput = {
      data: imageRecord.data as Uint8Array | Uint8ClampedArray,
      width: imageRecord.width as number,
      height: imageRecord.height as number,
    };

    validateImageInput(normalizedImage);
    const buffer = normalizedImage.data.buffer;
    validateArrayBuffer(buffer);
    return callWorker(
      worker,
      'webp:encode',
      { image: normalizedImage, options },
      signal,
      [buffer]
    );
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
