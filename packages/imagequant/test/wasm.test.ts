/**
 * ImageQuant WASM tests
 */

import { describe, it, expect } from 'bun:test';
import { createImagequantQuantizer } from '../src/index.js';
import type { ImageInput } from '../src/index.js';

// Test image data: 4x4 RGBA image
const createTestImage = (): ImageInput => {
  const width = 4;
  const height = 4;
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 0] = (i % 4) * 64; // R
    data[i * 4 + 1] = Math.floor(i / 4) * 64; // G
    data[i * 4 + 2] = 128; // B
    data[i * 4 + 3] = 255; // A
  }
  return { data, width, height };
};

describe('ImageQuant WASM', () => {
  it('quantize returns { data: Uint8ClampedArray, width, height }', async () => {
    const quantizer = createImagequantQuantizer('client');
    try {
      const image = createTestImage();
      const result = await quantizer(image);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('width', image.width);
      expect(result).toHaveProperty('height', image.height);
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
    } finally {
      await quantizer.terminate();
    }
  });

  it('data.length === width * height * 4', async () => {
    const quantizer = createImagequantQuantizer('client');
    try {
      const image = createTestImage();
      const result = await quantizer(image);
      expect(result.data.length).toBe(image.width * image.height * 4);
    } finally {
      await quantizer.terminate();
    }
  });

  it('quantize with numColors=16', async () => {
    const quantizer = createImagequantQuantizer('client');
    try {
      const image = createTestImage();
      const result = await quantizer(image, { numColors: 16 });
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
      expect(result.data.length).toBe(image.width * image.height * 4);
    } finally {
      await quantizer.terminate();
    }
  });

  it('rejects pre-aborted signal', async () => {
    const quantizer = createImagequantQuantizer('client');
    try {
      const image = createTestImage();
      const controller = new AbortController();
      controller.abort();
      await expect(quantizer(image, {}, controller.signal)).rejects.toThrow();
    } finally {
      await quantizer.terminate();
    }
  });

  it('terminate() works without error', async () => {
    const quantizer = createImagequantQuantizer('client');
    const image = createTestImage();
    await quantizer(image);
    await expect(quantizer.terminate()).resolves.toBeUndefined();
  });
});
