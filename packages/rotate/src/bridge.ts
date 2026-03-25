/**
 * Bridge implementation for the rotate package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
  validateImageInput,
} from '@squoosh-kit/runtime';
import type { RotateOptions } from './types';

export type BridgeOptions = {
  assetPath?: string;
};

interface RotateBridge {
  rotate(
    image: ImageInput,
    options?: RotateOptions,
    signal?: AbortSignal
  ): Promise<ImageInput>;
  terminate(): Promise<void>;
}

class RotateClientBridge implements RotateBridge {
  async rotate(
    image: ImageInput,
    options?: RotateOptions,
    signal?: AbortSignal
  ): Promise<ImageInput> {
    const module = await import('./rotate.worker.js');
    const rotateClient = module.rotateClient as (
      image: ImageInput,
      options?: RotateOptions,
      signal?: AbortSignal
    ) => Promise<ImageInput>;
    return rotateClient(image, options, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class RotateWorkerBridge implements RotateBridge {
  private worker: Worker | null = null;
  private workerReady: Promise<Worker> | null = null;
  private options?: BridgeOptions;

  constructor(options?: BridgeOptions) {
    this.options = options;
  }

  private async getWorker(): Promise<Worker> {
    if (!this.workerReady) {
      this.workerReady = this.createWorker();
    }
    return this.workerReady;
  }

  private async createWorker(): Promise<Worker> {
    this.worker = await createReadyWorker('rotate.worker.js', this.options);
    return this.worker;
  }

  async rotate(
    image: ImageInput,
    options?: RotateOptions,
    signal?: AbortSignal
  ): Promise<ImageInput> {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, 'rotate:run', { image, options }, signal);
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = null;
    }
  }
}

export function createBridge(
  mode: 'worker' | 'client',
  options?: BridgeOptions
): RotateBridge {
  if (mode === 'worker') {
    return new RotateWorkerBridge(options);
  }
  return new RotateClientBridge();
}
