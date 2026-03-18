/**
 * Bridge implementation for the OxiPNG package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateImageInput } from '@squoosh-kit/runtime';
import type { OxipngOptions } from './types';

export type BridgeOptions = {
  assetPath?: string;
};

interface OxipngBridge {
  optimize(
    image: ImageInput,
    options?: OxipngOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array>;
  terminate(): Promise<void>;
}

class OxipngClientBridge implements OxipngBridge {
  async optimize(
    image: ImageInput,
    options?: OxipngOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const module = await import('./oxipng.worker.js');
    const oxipngOptimizeClient = module.oxipngOptimizeClient as (
      image: ImageInput,
      options?: OxipngOptions,
      signal?: AbortSignal
    ) => Promise<Uint8Array>;
    return oxipngOptimizeClient(image, options, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class OxipngWorkerBridge implements OxipngBridge {
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
    this.worker = await createReadyWorker('oxipng.worker.js', this.options);
    return this.worker;
  }

  async optimize(
    image: ImageInput,
    options?: OxipngOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, 'oxipng:optimize', { image, options }, signal);
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
): OxipngBridge {
  if (mode === 'worker') {
    return new OxipngWorkerBridge(options);
  }
  return new OxipngClientBridge();
}
