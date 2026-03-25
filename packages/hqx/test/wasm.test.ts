/**
 * WASM functionality tests for HQX
 */

import { describe, it, expect } from 'bun:test';
import { createHqxUpscaler } from '../src/index.ts';
import type { ImageInput } from '@squoosh-kit/runtime';

// Test image data: 4x4 checkerboard RGBA
const createTestImage = (width = 4, height = 4): ImageInput => {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const isLight = (x + y) % 2 === 0;
      data[i] = isLight ? 255 : 0; // R
      data[i + 1] = isLight ? 255 : 0; // G
      data[i + 2] = isLight ? 255 : 0; // B
      data[i + 3] = 255; // A
    }
  }
  return { data, width, height };
};

describe('HQX WASM Functionality', () => {
  it('should upscale 2x and return image with doubled dimensions', async () => {
    const image = createTestImage();
    const upscaler = createHqxUpscaler('client');

    const result = await upscaler(image, { factor: 2 });

    expect(result.width).toBe(image.width * 2);
    expect(result.height).toBe(image.height * 2);
    expect(result.data.length).toBe(result.width * result.height * 4);

    await upscaler.terminate();
  }, 30000);

  it('should upscale 4x and return image with 4x dimensions', async () => {
    const image = createTestImage();
    const upscaler = createHqxUpscaler('client');

    const result = await upscaler(image, { factor: 4 });

    expect(result.width).toBe(image.width * 4);
    expect(result.height).toBe(image.height * 4);
    expect(result.data.length).toBe(result.width * result.height * 4);

    await upscaler.terminate();
  }, 30000);

  it('should use factor 2 by default', async () => {
    const image = createTestImage();
    const upscaler = createHqxUpscaler('client');

    const result = await upscaler(image);

    expect(result.width).toBe(image.width * 2);
    expect(result.height).toBe(image.height * 2);

    await upscaler.terminate();
  }, 30000);

  it('should reject a pre-aborted AbortSignal before touching WASM', async () => {
    const upscaler = createHqxUpscaler('client');
    const image = createTestImage();
    const controller = new AbortController();
    controller.abort();

    await expect(upscaler(image, {}, controller.signal)).rejects.toThrow(
      DOMException
    );

    await upscaler.terminate();
  }, 30000);

  it('should expose a working terminate method', async () => {
    const upscaler = createHqxUpscaler('client');
    expect(typeof upscaler.terminate).toBe('function');
    await expect(upscaler.terminate()).resolves.toBeUndefined();
  });

  it('terminate should work without prior upscale call', async () => {
    const upscaler = createHqxUpscaler('worker');
    expect(typeof upscaler.terminate).toBe('function');
    await expect(upscaler.terminate()).resolves.toBeUndefined();
  }, 30000);
});
