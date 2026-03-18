/**
 * Bridge implementation for the PNG package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateImageInput } from '@squoosh-kit/runtime';

export type BridgeOptions = {
  assetPath?: string;
};

interface PngBridge {
  encode(image: ImageInput, signal?: AbortSignal): Promise<Uint8Array>;
  decode(data: Uint8Array, signal?: AbortSignal): Promise<ImageData>;
  terminate(): Promise<void>;
}

class PngClientBridge implements PngBridge {
  async encode(image: ImageInput, signal?: AbortSignal): Promise<Uint8Array> {
    const module = await import('./png.worker.js');
    const pngEncodeClient = module.pngEncodeClient as (
      image: ImageInput,
      signal?: AbortSignal
    ) => Promise<Uint8Array>;
    return pngEncodeClient(image, signal);
  }

  async decode(data: Uint8Array, signal?: AbortSignal): Promise<ImageData> {
    const module = await import('./png.worker.js');
    const pngDecodeClient = module.pngDecodeClient as (
      data: Uint8Array,
      signal?: AbortSignal
    ) => Promise<ImageData>;
    return pngDecodeClient(data, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class PngWorkerBridge implements PngBridge {
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
    this.worker = await createReadyWorker('png.worker.js', this.options);
    return this.worker;
  }

  async encode(image: ImageInput, signal?: AbortSignal): Promise<Uint8Array> {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, 'png:encode', { image }, signal);
  }

  async decode(data: Uint8Array, signal?: AbortSignal): Promise<ImageData> {
    const worker = await this.getWorker();
    return callWorker(worker, 'png:decode', { data }, signal);
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
): PngBridge {
  if (mode === 'worker') {
    return new PngWorkerBridge(options);
  }
  return new PngClientBridge();
}
