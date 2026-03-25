/**
 * Bridge implementation for the JXL package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateImageInput } from '@squoosh-kit/runtime';
import type { JxlEncodeOptions } from './types';

export type BridgeOptions = {
  assetPath?: string;
};

interface JxlBridge {
  encode(
    image: ImageInput,
    options?: JxlEncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array>;
  decode(data: Uint8Array, signal?: AbortSignal): Promise<ImageData>;
  terminate(): Promise<void>;
}

class JxlClientBridge implements JxlBridge {
  async encode(
    image: ImageInput,
    options?: JxlEncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const module = await import('./jxl.worker.js');
    const jxlEncodeClient = module.jxlEncodeClient as (
      image: ImageInput,
      options?: JxlEncodeOptions,
      signal?: AbortSignal
    ) => Promise<Uint8Array>;
    return jxlEncodeClient(image, options, signal);
  }

  async decode(data: Uint8Array, signal?: AbortSignal): Promise<ImageData> {
    const module = await import('./jxl.worker.js');
    const jxlDecodeClient = module.jxlDecodeClient as (
      data: Uint8Array,
      signal?: AbortSignal
    ) => Promise<ImageData>;
    return jxlDecodeClient(data, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class JxlWorkerBridge implements JxlBridge {
  private worker: Worker | null = null;
  private workerReady: Promise<Worker> | null = null;
  private options?: BridgeOptions;

  constructor(options?: BridgeOptions) {
    console.log(
      '[jxl/bridge] JxlWorkerBridge constructor called with options:',
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
    console.log('[jxl/bridge] createWorker called. Creating ready worker...');
    this.worker = await createReadyWorker('jxl.worker.js', this.options);
    console.log(
      '[jxl/bridge] createWorker: Ready worker created successfully.'
    );
    return this.worker;
  }

  async encode(
    image: ImageInput,
    options?: JxlEncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, 'jxl:encode', { image, options }, signal);
  }

  async decode(data: Uint8Array, signal?: AbortSignal): Promise<ImageData> {
    const worker = await this.getWorker();
    return callWorker(worker, 'jxl:decode', { data }, signal);
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
): JxlBridge {
  console.log(`[jxl/bridge] createBridge called with mode: ${mode}`);
  if (mode === 'worker') {
    return new JxlWorkerBridge(options);
  }
  return new JxlClientBridge();
}
