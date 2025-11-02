/**
 * Bridge implementation for the MozJPEG package, handling worker and client modes.
 */

import {
  callWorker,
  createReadyWorker,
  type ImageInput,
} from '@squoosh-kit/runtime';
import { validateImageInput } from '@squoosh-kit/runtime';
import type { MozjpegEncodeInputOptions } from './types';

interface MozjpegBridge {
  encode(
    image: ImageInput,
    options?: MozjpegEncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array>;
  terminate(): Promise<void>;
}

class MozjpegClientBridge implements MozjpegBridge {
  async encode(
    image: ImageInput,
    options?: MozjpegEncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const module = await import('./mozjpeg.worker.js');
    const mozjpegEncodeClient = module.mozjpegEncodeClient as (
      image: ImageInput,
      options?: MozjpegEncodeInputOptions,
      signal?: AbortSignal
    ) => Promise<Uint8Array>;
    return mozjpegEncodeClient(image, options, signal);
  }

  async terminate(): Promise<void> {
    // Client mode has nothing to terminate
  }
}

class MozjpegWorkerBridge implements MozjpegBridge {
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
    return createReadyWorker('mozjpeg.worker');
  }

  async encode(
    image: ImageInput,
    options?: MozjpegEncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, 'mozjpeg:encode', { image, options }, signal);
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = null;
    }
  }
}

export function createBridge(mode: 'worker' | 'client'): MozjpegBridge {
  return mode === 'client'
    ? new MozjpegClientBridge()
    : new MozjpegWorkerBridge();
}
