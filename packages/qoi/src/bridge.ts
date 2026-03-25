/**
 * Bridge implementation for the QOI package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
  validateImageInput,
} from '@squoosh-kit/runtime';

export type BridgeOptions = {
  assetPath?: string;
};

interface QoiBridge {
  encode(image: ImageInput, signal?: AbortSignal): Promise<Uint8Array>;
  decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
  terminate(): Promise<void>;
}

class QoiClientBridge implements QoiBridge {
  async encode(image: ImageInput, signal?: AbortSignal): Promise<Uint8Array> {
    const module = await import('./qoi.worker.js');
    const qoiEncodeClient = module.qoiEncodeClient as (
      image: ImageInput,
      signal?: AbortSignal
    ) => Promise<Uint8Array>;
    return qoiEncodeClient(image, signal);
  }

  async decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const module = await import('./qoi.worker.js');
    const qoiDecodeClient = module.qoiDecodeClient as (
      data: BufferSource,
      signal?: AbortSignal
    ) => Promise<ImageData>;
    return qoiDecodeClient(data, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class QoiWorkerBridge implements QoiBridge {
  private worker: Worker | null = null;
  private workerReady: Promise<Worker> | null = null;
  private options?: BridgeOptions;

  constructor(options?: BridgeOptions) {
    console.log(
      '[qoi/bridge] QoiWorkerBridge constructor called with options:',
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
    console.log('[qoi/bridge] createWorker called. Creating ready worker...');
    this.worker = await createReadyWorker('qoi.worker.js', this.options);
    console.log(
      '[qoi/bridge] createWorker: Ready worker created successfully.'
    );
    return this.worker;
  }

  async encode(image: ImageInput, signal?: AbortSignal): Promise<Uint8Array> {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, 'qoi:encode', { image }, signal);
  }

  async decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const worker = await this.getWorker();
    return callWorker(worker, 'qoi:decode', { data }, signal);
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
): QoiBridge {
  console.log(`[qoi/bridge] createBridge called with mode: ${mode}`);
  if (mode === 'worker') {
    return new QoiWorkerBridge(options);
  }
  return new QoiClientBridge();
}
