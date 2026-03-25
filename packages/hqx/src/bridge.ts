/**
 * Bridge implementation for the HQX package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
  validateImageInput,
} from '@squoosh-kit/runtime';
import type { HqxOptions } from './types';

export type BridgeOptions = {
  assetPath?: string;
};

interface HqxBridge {
  upscale(
    image: ImageInput,
    options?: HqxOptions,
    signal?: AbortSignal
  ): Promise<ImageInput>;
  terminate(): Promise<void>;
}

class HqxClientBridge implements HqxBridge {
  async upscale(
    image: ImageInput,
    options?: HqxOptions,
    signal?: AbortSignal
  ): Promise<ImageInput> {
    const module = await import('./hqx.worker.js');
    const hqxUpscaleClient = module.hqxUpscaleClient as (
      image: ImageInput,
      options?: HqxOptions,
      signal?: AbortSignal
    ) => Promise<ImageInput>;
    return hqxUpscaleClient(image, options, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class HqxWorkerBridge implements HqxBridge {
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
    this.worker = await createReadyWorker('hqx.worker.js', this.options);
    return this.worker;
  }

  async upscale(
    image: ImageInput,
    options?: HqxOptions,
    signal?: AbortSignal
  ): Promise<ImageInput> {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, 'hqx:upscale', { image, options }, signal);
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
): HqxBridge {
  if (mode === 'worker') {
    return new HqxWorkerBridge(options);
  }
  return new HqxClientBridge();
}
