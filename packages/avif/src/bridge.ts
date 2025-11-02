/**
 * Bridge implementation for the AVIF package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateImageInput } from '@squoosh-kit/runtime';
import type { AvifEncodeInputOptions } from './types';

interface AvifBridge {
  encode(
    image: ImageInput,
    options?: AvifEncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array>;
  decode(buffer: BufferSource, signal?: AbortSignal): Promise<ImageData>;
  terminate(): Promise<void>;
}

class AvifClientBridge implements AvifBridge {
  async encode(
    image: ImageInput,
    options?: AvifEncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const module = await import('./avif.worker.js');
    const avifEncodeClient = module.avifEncodeClient as (
      image: ImageInput,
      options?: AvifEncodeInputOptions,
      signal?: AbortSignal
    ) => Promise<Uint8Array>;
    return avifEncodeClient(image, options, signal);
  }

  async decode(buffer: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const module = await import('./avif.worker.js');
    const avifDecodeClient = module.avifDecodeClient as (
      buffer: BufferSource,
      signal?: AbortSignal
    ) => Promise<ImageData>;
    return avifDecodeClient(buffer, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class AvifWorkerBridge implements AvifBridge {
  private worker: Worker | null = null;
  private workerReady: Promise<Worker> | null = null;

  private async getWorker(): Promise<Worker> {
    if (!this.worker) {
      if (!this.workerReady) {
        this.workerReady = this.createWorker();
      }
      this.worker = await this.workerReady;
    }
    return this.worker;
  }

  private async createWorker(): Promise<Worker> {
    return createReadyWorker('avif.worker');
  }

  async encode(
    image: ImageInput,
    options?: AvifEncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, 'avif:encode', { image, options }, signal);
  }

  async decode(buffer: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const worker = await this.getWorker();
    return callWorker(worker, 'avif:decode', { buffer }, signal);
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = null;
    }
  }
}

export function createBridge(mode: 'worker' | 'client'): AvifBridge {
  return mode === 'client' ? new AvifClientBridge() : new AvifWorkerBridge();
}
