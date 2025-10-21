/**
 * Worker bridge abstraction for worker/client execution modes
 */

import { callWorker } from './worker-call.ts';

export type BridgeMode = 'worker' | 'client';

export type ImageInput =
  | ImageData
  | { data: Uint8Array; width: number; height: number };

export interface WebpOptions {
  quality?: number;
  lossless?: boolean;
  nearLossless?: boolean;
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  premultiply?: boolean;
  linearRGB?: boolean;
}

/**
 * Abstract worker bridge interface
 */
export interface WorkerBridge {
  webpEncode(
    signal: AbortSignal,
    image: ImageInput,
    options?: WebpOptions
  ): Promise<Uint8Array>;

  resize(
    signal: AbortSignal,
    image: ImageInput,
    options: ResizeOptions
  ): Promise<ImageInput>;
}

/**
 * Worker-based bridge implementation
 */
class WorkerThreadBridge implements WorkerBridge {
  private webpWorker: Worker | null = null;
  private resizeWorker: Worker | null = null;

  private getWebpWorker(): Worker {
    if (!this.webpWorker) {
      this.webpWorker = new Worker(
        '/webp.worker-3jpj2j43.js',
        { type: 'module' }
      );
    }
    return this.webpWorker;
  }

  private getResizeWorker(): Worker {
    if (!this.resizeWorker) {
      this.resizeWorker = new Worker(
        '/resize.worker-bc4vvb31.js',
        { type: 'module' }
      );
    }
    return this.resizeWorker;
  }

  async webpEncode(
    signal: AbortSignal,
    image: ImageInput,
    options?: WebpOptions
  ): Promise<Uint8Array> {
    const worker = this.getWebpWorker();

    // Extract the buffer for transfer
    const buffer = image.data.buffer;

    const result = await callWorker<
      { image: ImageInput; options?: WebpOptions },
      Uint8Array
    >(worker, 'webp:encode', { image, options }, signal, [buffer]);

    return result;
  }

  async resize(
    signal: AbortSignal,
    image: ImageInput,
    options: ResizeOptions
  ): Promise<ImageInput> {
    const worker = this.getResizeWorker();

    // Extract the buffer for transfer
    const buffer = image.data.buffer;

    const result = await callWorker<
      { image: ImageInput; options: ResizeOptions },
      ImageInput
    >(worker, 'resize:run', { image, options }, signal, [buffer]);

    return result;
  }

  terminate() {
    this.webpWorker?.terminate();
    this.resizeWorker?.terminate();
  }
}

/**
 * Client-mode bridge implementation (direct function calls)
 */
class ClientBridge implements WorkerBridge {
  async webpEncode(
    signal: AbortSignal,
    image: ImageInput,
    options?: WebpOptions
  ): Promise<Uint8Array> {
    // Dynamically import the client implementation
    const { webpEncodeClient } = await import(
      '../features/webp/webp.worker.ts'
    );
    return webpEncodeClient(signal, image, options);
  }

  async resize(
    signal: AbortSignal,
    image: ImageInput,
    options: ResizeOptions
  ): Promise<ImageInput> {
    // Dynamically import the client implementation
    const { resizeClient } = await import(
      '../features/resize/resize.worker.ts'
    );
    return resizeClient(signal, image, options);
  }
}

/**
 * Create a worker bridge with the specified mode
 */
export function createWorkerBridge(mode: BridgeMode = 'worker'): WorkerBridge {
  if (mode === 'client') {
    return new ClientBridge();
  }
  return new WorkerThreadBridge();
}
