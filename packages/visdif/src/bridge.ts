/**
 * Bridge implementation for the visdif package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';

export type BridgeOptions = {
  assetPath?: string;
};

interface VisDifBridge {
  compare(
    image1: ImageInput,
    image2: ImageInput,
    signal?: AbortSignal
  ): Promise<number>;
  terminate(): Promise<void>;
}

class VisDifClientBridge implements VisDifBridge {
  async compare(
    image1: ImageInput,
    image2: ImageInput,
    signal?: AbortSignal
  ): Promise<number> {
    const module = await import('./visdif.worker.js');
    const visdifCompareClient = module.visdifCompareClient as (
      image1: ImageInput,
      image2: ImageInput,
      signal?: AbortSignal
    ) => Promise<number>;
    return visdifCompareClient(image1, image2, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class VisDifWorkerBridge implements VisDifBridge {
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
    this.worker = await createReadyWorker('visdif.worker.js', this.options);
    return this.worker;
  }

  async compare(
    image1: ImageInput,
    image2: ImageInput,
    signal?: AbortSignal
  ): Promise<number> {
    const worker = await this.getWorker();
    return callWorker(worker, 'visdif:compare', { image1, image2 }, signal);
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
): VisDifBridge {
  if (mode === 'worker') {
    return new VisDifWorkerBridge(options);
  }
  return new VisDifClientBridge();
}
