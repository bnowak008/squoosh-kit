/**
 * Bridge implementation for the WebP package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateImageInput } from '@squoosh-kit/runtime';
import type { EncodeInputOptions } from './types';

export type BridgeOptions = {
  assetPath?: string;
};

interface WebPBridge {
  encode(
    image: ImageInput,
    options?: EncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array>;
  terminate(): Promise<void>;
}

class WebpClientBridge implements WebPBridge {
  async encode(
    image: ImageInput,
    options?: EncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    // Dynamically import the client encoder to avoid module loading issues in Vite
    const module = await import('./webp.worker.js');
    const webpEncodeClient = module.webpEncodeClient as (
      image: ImageInput,
      options?: EncodeInputOptions,
      signal?: AbortSignal
    ) => Promise<Uint8Array>;
    return webpEncodeClient(image, options, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class WebpWorkerBridge implements WebPBridge {
  private worker: Worker | null = null;
  private workerReady: Promise<Worker> | null = null;
  private options?: BridgeOptions;

  constructor(options?: BridgeOptions) {
    console.log(
      '[webp/bridge] WebpWorkerBridge constructor called with options:',
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
    console.log('[webp/bridge] createWorker called. Creating ready worker...');
    this.worker = await createReadyWorker('webp.worker.js', this.options);
    console.log(
      '[webp/bridge] createWorker: Ready worker created successfully.'
    );
    return this.worker;
  }

  async encode(
    image: ImageInput,
    options?: EncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();

    validateImageInput(image);
    return callWorker(worker, 'webp:encode', { image, options }, signal);
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
): WebPBridge {
  console.log(`[webp/bridge] createBridge called with mode: ${mode}`);
  if (mode === 'worker') {
    return new WebpWorkerBridge(options);
  }
  return new WebpClientBridge();
}
