/**
 * Bridge implementation for the MozJPEG package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateImageInput } from '@squoosh-kit/runtime';
import type { MozjpegEncodeOptions } from './types';

export type BridgeOptions = {
  assetPath?: string;
};

interface MozjpegBridge {
  encode(
    image: ImageInput,
    options?: MozjpegEncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array>;
  decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
  terminate(): Promise<void>;
}

class MozjpegClientBridge implements MozjpegBridge {
  async encode(
    image: ImageInput,
    options?: MozjpegEncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    // Dynamically import the client encoder to avoid module loading issues in Vite
    const module = await import('./mozjpeg.worker.js');
    const mozjpegEncodeClient = module.mozjpegEncodeClient as (
      image: ImageInput,
      options?: MozjpegEncodeOptions,
      signal?: AbortSignal
    ) => Promise<Uint8Array>;
    return mozjpegEncodeClient(image, options, signal);
  }

  async decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const module = await import('./mozjpeg.worker.js');
    const mozjpegDecodeClient = module.mozjpegDecodeClient as (
      data: BufferSource,
      signal?: AbortSignal
    ) => Promise<ImageData>;
    return mozjpegDecodeClient(data, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class MozjpegWorkerBridge implements MozjpegBridge {
  private worker: Worker | null = null;
  private workerReady: Promise<Worker> | null = null;
  private options?: BridgeOptions;

  constructor(options?: BridgeOptions) {
    console.log(
      '[mozjpeg/bridge] MozjpegWorkerBridge constructor called with options:',
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
      '[mozjpeg/bridge] createWorker called. Creating ready worker...'
    );
    this.worker = await createReadyWorker('mozjpeg.worker.js', this.options);
    console.log(
      '[mozjpeg/bridge] createWorker: Ready worker created successfully.'
    );
    return this.worker;
  }

  async encode(
    image: ImageInput,
    options?: MozjpegEncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();

    validateImageInput(image);
    return callWorker(worker, 'mozjpeg:encode', { image, options }, signal);
  }

  async decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const worker = await this.getWorker();
    return callWorker(worker, 'mozjpeg:decode', { data }, signal);
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
): MozjpegBridge {
  console.log(`[mozjpeg/bridge] createBridge called with mode: ${mode}`);
  if (mode === 'worker') {
    return new MozjpegWorkerBridge(options);
  }
  return new MozjpegClientBridge();
}
