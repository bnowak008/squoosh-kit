/**
 * Bridge implementation for the WP2 package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateImageInput } from '@squoosh-kit/runtime';
import type { Wp2EncodeOptions } from './types';

export type BridgeOptions = {
  assetPath?: string;
};

interface WP2Bridge {
  encode(
    image: ImageInput,
    options?: Wp2EncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array>;
  decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData>;
  terminate(): Promise<void>;
}

class Wp2ClientBridge implements WP2Bridge {
  async encode(
    image: ImageInput,
    options?: Wp2EncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    // Dynamically import the client encoder to avoid module loading issues in Vite
    const module = await import('./wp2.worker.js');
    const wp2EncodeClient = module.wp2EncodeClient as (
      image: ImageInput,
      options?: Wp2EncodeOptions,
      signal?: AbortSignal
    ) => Promise<Uint8Array>;
    return wp2EncodeClient(image, options, signal);
  }

  async decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const module = await import('./wp2.worker.js');
    const wp2DecodeClient = module.wp2DecodeClient as (
      data: BufferSource,
      signal?: AbortSignal
    ) => Promise<ImageData>;
    return wp2DecodeClient(data, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class Wp2WorkerBridge implements WP2Bridge {
  private worker: Worker | null = null;
  private workerReady: Promise<Worker> | null = null;
  private options?: BridgeOptions;

  constructor(options?: BridgeOptions) {
    console.log(
      '[wp2/bridge] Wp2WorkerBridge constructor called with options:',
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
    console.log('[wp2/bridge] createWorker called. Creating ready worker...');
    this.worker = await createReadyWorker('wp2.worker.js', this.options);
    console.log(
      '[wp2/bridge] createWorker: Ready worker created successfully.'
    );
    return this.worker;
  }

  async encode(
    image: ImageInput,
    options?: Wp2EncodeOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();

    validateImageInput(image);
    return callWorker(worker, 'wp2:encode', { image, options }, signal);
  }

  async decode(data: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const worker = await this.getWorker();
    return callWorker(worker, 'wp2:decode', { data }, signal);
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
): WP2Bridge {
  console.log(`[wp2/bridge] createBridge called with mode: ${mode}`);
  if (mode === 'worker') {
    return new Wp2WorkerBridge(options);
  }
  return new Wp2ClientBridge();
}
