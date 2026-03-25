/**
 * WASM functionality tests for rotate
 */

import { describe, it, expect } from 'bun:test';
import { createRotator } from '../src/index.ts';
import type { ImageInput } from '@squoosh-kit/runtime';

// Create a test image with known pixel data
const createTestImage = (width = 4, height = 3): ImageInput => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = (i * 37) % 256; // R
    data[i * 4 + 1] = (i * 71) % 256; // G
    data[i * 4 + 2] = (i * 131) % 256; // B
    data[i * 4 + 3] = 255; // A
  }
  return { data, width, height };
};

describe('Rotate WASM Functionality', () => {
  it('should rotate 0 degrees and return same dimensions', async () => {
    const image = createTestImage(4, 3);
    const rotator = createRotator('client');

    const result = await rotator(image, { rotate: 0 });

    expect(result.width).toBe(4);
    expect(result.height).toBe(3);
    expect(result.data.length).toBe(4 * 3 * 4);

    await rotator.terminate();
  }, 30000);

  it('should rotate 90 degrees and swap width/height', async () => {
    const image = createTestImage(4, 3);
    const rotator = createRotator('client');

    const result = await rotator(image, { rotate: 90 });

    expect(result.width).toBe(3);
    expect(result.height).toBe(4);
    expect(result.data.length).toBe(3 * 4 * 4);

    await rotator.terminate();
  }, 30000);

  it('should rotate 180 degrees and keep dimensions', async () => {
    const image = createTestImage(4, 3);
    const rotator = createRotator('client');

    const result = await rotator(image, { rotate: 180 });

    expect(result.width).toBe(4);
    expect(result.height).toBe(3);
    expect(result.data.length).toBe(4 * 3 * 4);

    await rotator.terminate();
  }, 30000);

  it('should rotate 270 degrees and swap width/height', async () => {
    const image = createTestImage(4, 3);
    const rotator = createRotator('client');

    const result = await rotator(image, { rotate: 270 });

    expect(result.width).toBe(3);
    expect(result.height).toBe(4);
    expect(result.data.length).toBe(3 * 4 * 4);

    await rotator.terminate();
  }, 30000);

  it('should return correct data length for all rotations', async () => {
    const image = createTestImage(6, 4);
    const rotator = createRotator('client');

    for (const degrees of [0, 90, 180, 270] as const) {
      const result = await rotator(image, { rotate: degrees });
      const expectedW = degrees === 90 || degrees === 270 ? 4 : 6;
      const expectedH = degrees === 90 || degrees === 270 ? 6 : 4;
      expect(result.data.length).toBe(expectedW * expectedH * 4);
    }

    await rotator.terminate();
  }, 30000);

  it('should use 0 degrees by default', async () => {
    const image = createTestImage(4, 3);
    const rotator = createRotator('client');

    const result = await rotator(image);

    expect(result.width).toBe(4);
    expect(result.height).toBe(3);

    await rotator.terminate();
  }, 30000);

  it('should reject a pre-aborted AbortSignal before touching WASM', async () => {
    const rotator = createRotator('client');
    const image = createTestImage();
    const controller = new AbortController();
    controller.abort();

    await expect(rotator(image, {}, controller.signal)).rejects.toThrow(
      DOMException
    );

    await rotator.terminate();
  }, 30000);

  it('should expose a working terminate method', async () => {
    const rotator = createRotator('client');
    expect(typeof rotator.terminate).toBe('function');
    await expect(rotator.terminate()).resolves.toBeUndefined();
  });

  it('terminate should work without prior rotate call', async () => {
    const rotator = createRotator('worker');
    expect(typeof rotator.terminate).toBe('function');
    await expect(rotator.terminate()).resolves.toBeUndefined();
  }, 30000);
});
