/**
 * Bridge implementation for the Resize package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateArrayBuffer, validateImageInput } from '@squoosh-kit/runtime';
import { resizeClient } from './resize.worker.ts';
import type { ResizeOptions } from './types.ts';

interface ResizeBridge {
  resize(
    image: ImageInput,
    options: ResizeOptions,
    signal?: AbortSignal
  ): Promise<ImageInput>;
  terminate(): Promise<void>;
}

class ResizeClientBridge implements ResizeBridge {
  async resize(
    image: ImageInput,
    options: ResizeOptions,
    signal?: AbortSignal
  ): Promise<ImageInput> {
    return resizeClient(image, options, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class ResizeWorkerBridge implements ResizeBridge {
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
    return createReadyWorker('resize.worker');
  }

  async resize(
    image: ImageInput,
    options: ResizeOptions,
    signal?: AbortSignal
  ): Promise<ImageInput> {
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

    try {
      const result = await callWorker<
        { image: ImageInput; options: ResizeOptions },
        ImageInput
      >(worker, 'resize:run', { image: normalizedImage, options }, signal, [
        buffer,
      ]);

      return result;
    } catch (error) {
      console.error('Resize error:', error);
      throw error;
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = null;
    }
  }
}

export function createBridge(mode: 'worker' | 'client'): ResizeBridge {
  return mode === 'client'
    ? new ResizeClientBridge()
    : new ResizeWorkerBridge();
}
