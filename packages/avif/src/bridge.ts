/**
 * Bridge implementation for the AVIF package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateImageInput } from '@squoosh-kit/runtime';
import type { AvifEncodeOptions } from './types';

export type BridgeOptions = {
  assetPath?: string;
};

interface AvifBridge {
  encode(
    image: ImageInput,
    options?: AvifEncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array>;
  decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
  terminate(): Promise<void>;
}

class AvifClientBridge implements AvifBridge {
  async encode(
    image: ImageInput,
    options?: AvifEncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    // Dynamically import the client encoder to avoid module loading issues in Vite
    const module = await import('./avif.worker.js');
    const avifEncodeClient = module.avifEncodeClient as (
      image: ImageInput,
      options?: AvifEncodeOptions,
      signal?: AbortSignal
    ) => Promise<Uint8Array>;
    return avifEncodeClient(image, options, signal);
  }

  async decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const module = await import('./avif.worker.js');
    const avifDecodeClient = module.avifDecodeClient as (
      data: BufferSource,
      signal?: AbortSignal
    ) => Promise<ImageData>;
    return avifDecodeClient(data, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class AvifWorkerBridge implements AvifBridge {
  private worker: Worker | null = null;
  private workerReady: Promise<Worker> | null = null;
  private options?: BridgeOptions;

  constructor(options?: BridgeOptions) {
    console.log(
      '[avif/bridge] AvifWorkerBridge constructor called with options:',
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
    console.log('[avif/bridge] createWorker called. Creating ready worker...');
    this.worker = await createReadyWorker('avif.worker.js', this.options);
    console.log(
      '[avif/bridge] createWorker: Ready worker created successfully.'
    );
    return this.worker;
  }

  async encode(
    image: ImageInput,
    options?: AvifEncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();

    validateImageInput(image);
    return callWorker(worker, 'avif:encode', { image, options }, signal);
  }

  async decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const worker = await this.getWorker();

    return callWorker(worker, 'avif:decode', { data }, signal);
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
): AvifBridge {
  console.log(`[avif/bridge] createBridge called with mode: ${mode}`);
  if (mode === 'worker') {
    return new AvifWorkerBridge(options);
  }
  return new AvifClientBridge();
}
