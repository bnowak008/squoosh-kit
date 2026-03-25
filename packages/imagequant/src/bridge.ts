/**
 * Bridge implementation for the ImageQuant package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
  validateImageInput,
} from '@squoosh-kit/runtime';
import type { ImagequantOptions } from './types';

export type BridgeOptions = {
  assetPath?: string;
};

interface ImagequantBridge {
  quantize(
    image: ImageInput,
    options?: ImagequantOptions,
    signal?: AbortSignal
  ): Promise<{ data: Uint8ClampedArray; width: number; height: number }>;
  terminate(): Promise<void>;
}

class ImagequantClientBridge implements ImagequantBridge {
  async quantize(
    image: ImageInput,
    options?: ImagequantOptions,
    signal?: AbortSignal
  ): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
    const module = await import('./imagequant.worker.js');
    const imagequantQuantizeClient = module.imagequantQuantizeClient as (
      image: ImageInput,
      options?: ImagequantOptions,
      signal?: AbortSignal
    ) => Promise<{ data: Uint8ClampedArray; width: number; height: number }>;
    return imagequantQuantizeClient(image, options, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class ImagequantWorkerBridge implements ImagequantBridge {
  private worker: Worker | null = null;
  private workerReady: Promise<Worker> | null = null;
  private options?: BridgeOptions;

  constructor(options?: BridgeOptions) {
    console.log(
      '[imagequant/bridge] ImagequantWorkerBridge constructor called with options:',
      options
    );
    this.options = options;
  }

  private async getWorker(): Promise<Worker> {
    if (!this.workerReady) {
      this.workerReady = this.createWorker();
    }
    return this.workerReady;
  }

  private async createWorker(): Promise<Worker> {
    console.log(
      '[imagequant/bridge] createWorker called. Creating ready worker...'
    );
    this.worker = await createReadyWorker('imagequant.worker.js', this.options);
    console.log(
      '[imagequant/bridge] createWorker: Ready worker created successfully.'
    );
    return this.worker;
  }

  async quantize(
    image: ImageInput,
    options?: ImagequantOptions,
    signal?: AbortSignal
  ): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(
      worker,
      'imagequant:quantize',
      { image, options },
      signal
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

export function createBridge(
  mode: 'worker' | 'client',
  options?: BridgeOptions
): ImagequantBridge {
  console.log(`[imagequant/bridge] createBridge called with mode: ${mode}`);
  if (mode === 'worker') {
    return new ImagequantWorkerBridge(options);
  }
  return new ImagequantClientBridge();
}
