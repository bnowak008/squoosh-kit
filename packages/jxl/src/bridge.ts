import {
  callWorker,
  createReadyWorker,
  type ImageInput,
  validateImageInput,
} from '@squoosh-kit/runtime';
import type { JxlEncodeInputOptions } from './types';

interface JxlBridge {
  encode(
    image: ImageInput,
    options?: JxlEncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array>;
  decode(buffer: BufferSource, signal?: AbortSignal): Promise<ImageData>;
  terminate(): Promise<void>;
}

class JxlClientBridge implements JxlBridge {
  async encode(
    image: ImageInput,
    options?: JxlEncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const module = await import('./jxl.worker.js');
    return module.jxlEncodeClient(image, options, signal);
  }
  async decode(buffer: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const module = await import('./jxl.worker.js');
    return module.jxlDecodeClient(buffer, signal);
  }
  async terminate(): Promise<void> {}
}

class JxlWorkerBridge implements JxlBridge {
  private worker: Worker | null = null;
  private workerReady: Promise<Worker> | null = null;

  private async getWorker(): Promise<Worker> {
    if (!this.worker) {
      if (!this.workerReady) this.workerReady = createReadyWorker('jxl.worker');
      this.worker = await this.workerReady;
    }
    return this.worker;
  }

  async encode(
    image: ImageInput,
    options?: JxlEncodeInputOptions,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, 'jxl:encode', { image, options }, signal);
  }

  async decode(buffer: BufferSource, signal?: AbortSignal): Promise<ImageData> {
    const worker = await this.getWorker();
    return callWorker(worker, 'jxl:decode', { buffer }, signal);
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = null;
    }
  }
}

export function createBridge(mode: 'worker' | 'client'): JxlBridge {
  return mode === 'client' ? new JxlClientBridge() : new JxlWorkerBridge();
}
