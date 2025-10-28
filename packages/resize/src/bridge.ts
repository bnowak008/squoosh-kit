/**
 * Bridge implementation for the Resize package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateImageInput } from '@squoosh-kit/runtime';
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
    // Dynamically import the client resizer to avoid module loading issues in Vite
    const module = await import('./resize.worker.ts');
    const resizeClient = module.resizeClient as (
      image: ImageInput,
      options: ResizeOptions,
      signal?: AbortSignal
    ) => Promise<ImageInput>;
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

    validateImageInput(image);

    try {
      const result = await callWorker<
        { image: ImageInput; options: ResizeOptions },
        ImageInput
      >(worker, 'resize:run', { image, options }, signal);

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
