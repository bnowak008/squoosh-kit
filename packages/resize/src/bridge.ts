/**
 * Bridge implementation for the Resize package, handling worker and client modes.
 */

import {
  callWorker,
  type ImageInput,
  createCodecWorker,
} from '@squoosh-kit/runtime';
import { resizeClient } from './resize.worker';
import type { ResizeOptions } from './types';

interface ResizeBridge {
  resize(
    signal: AbortSignal,
    image: ImageInput,
    options: ResizeOptions
  ): Promise<ImageInput>;
}

class ResizeClientBridge implements ResizeBridge {
  async resize(
    signal: AbortSignal,
    image: ImageInput,
    options: ResizeOptions
  ): Promise<ImageInput> {
    return resizeClient(signal, image, options);
  }
}

class ResizeWorkerBridge implements ResizeBridge {
  private worker: Worker | null = null;
  private async getWorker(): Promise<Worker> {
    if (!this.worker) {
      this.worker = await createCodecWorker('file:///home/bnowak/repos/squoosh-lite/packages/resize/dist/resize.worker.bun.js');
    }
    return this.worker;
  }
  async resize(
    signal: AbortSignal,
    image: ImageInput,
    options: ResizeOptions
  ): Promise<ImageInput> {
    const worker = await this.getWorker();
    console.log('worker', worker);
    const buffer = image.data.buffer;
    console.log('buffer', buffer);

    try {
      const result = await callWorker<
        { image: ImageInput; options: ResizeOptions },
        ImageInput
      >(worker, 'resize:run', { image, options }, signal, [
        buffer as ArrayBuffer,
      ]);

      console.log('result', result);

      return result;
    } catch (error) {
      console.error('error', error);
      throw error;
    }
  }
}

export function createBridge(mode: 'worker' | 'client'): ResizeBridge {
  return mode === 'client'
    ? new ResizeClientBridge()
    : new ResizeWorkerBridge();
}
