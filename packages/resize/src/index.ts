/**
 * @squoosh-lite/resize - Image resizing for Squoosh Lite
 */

import { callWorker } from '@squoosh-lite/core';
import type { ImageInput, BridgeMode } from '@squoosh-lite/core';

export type { ImageInput };

export interface ResizeOptions {
  width?: number;
  height?: number;
  premultiply?: boolean;
  linearRGB?: boolean;
}

/**
 * Resize processor bridge interface
 */
export interface ResizeBridge {
  resize(
    signal: AbortSignal,
    image: ImageInput,
    options: ResizeOptions
  ): Promise<ImageInput>;
  terminate?: () => void;
}

/**
 * Worker-based resize processor implementation
 */
class ResizeWorkerBridge implements ResizeBridge {
  private worker: Worker | null = null;

  private getWorker(): Worker {
    if (!this.worker) {
      const workerUrl = new URL('./resize.worker.js', import.meta.url);
      this.worker = new Worker(workerUrl.href, { type: 'module' });
    }
    return this.worker;
  }

  async resize(
    signal: AbortSignal,
    image: ImageInput,
    options: ResizeOptions
  ): Promise<ImageInput> {
    const worker = this.getWorker();
    const buffer = image.data.buffer;

    const result = await callWorker<
      { image: ImageInput; options: ResizeOptions },
      ImageInput
    >(worker, 'resize:run', { image, options }, signal, [buffer]);

    return result;
  }

  terminate() {
    this.worker?.terminate();
  }
}

/**
 * Client-mode resize processor implementation
 */
class ResizeClientBridge implements ResizeBridge {
  async resize(
    signal: AbortSignal,
    image: ImageInput,
    options: ResizeOptions
  ): Promise<ImageInput> {
    const { resizeClient } = await import('./resize.worker.ts');
    return resizeClient(signal, image, options);
  }
}

/**
 * Create a resize processor bridge with the specified mode
 */
export function createResizeBridge(mode: BridgeMode = 'worker'): ResizeBridge {
  if (mode === 'client') {
    return new ResizeClientBridge();
  }
  return new ResizeWorkerBridge();
}

/**
 * Primary resize function
 *
 * @param signal - AbortSignal to cancel the operation
 * @param workerBridge - ResizeBridge instance or null to use default worker mode
 * @param imageData - Image data to resize (ImageData or { data, width, height })
 * @param options - Resize options
 * @returns Promise resolving to resized image data
 */
export async function resize(
  signal: AbortSignal,
  workerBridge: ResizeBridge | null,
  imageData: ImageInput,
  options: ResizeOptions
): Promise<ImageInput> {
  const bridge = workerBridge ?? createResizeBridge('worker');
  return bridge.resize(signal, imageData, options);
}

/**
 * Convenience factory: bind runtime once, then call with (signal, image, options)
 *
 * @param mode - Execution mode: 'worker' (default) or 'client'
 * @returns Resizer function bound to the specified mode
 */
export function createResizer(mode: BridgeMode = 'worker') {
  const bridge = createResizeBridge(mode);

  return (
    signal: AbortSignal,
    imageData: ImageInput,
    options: ResizeOptions
  ): Promise<ImageInput> => {
    return bridge.resize(signal, imageData, options);
  };
}
