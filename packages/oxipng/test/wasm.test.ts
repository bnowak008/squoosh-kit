/**
 * WASM functionality tests for OxiPNG
 */

import { describe, it, expect } from 'bun:test';
import { createOxipngOptimizer } from '../src/index.ts';
import type { ImageInput } from '@squoosh-kit/runtime';

// PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function hasPngMagic(data: Uint8Array): boolean {
  if (data.length < 8) return false;
  return PNG_MAGIC.every((byte, i) => data[i] === byte);
}

// Test image data: 4x4 RGBA pixels (all red)
const createTestImage = (): ImageInput => {
  const width = 4;
  const height = 4;
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 0] = 255; // R
    data[i * 4 + 1] = 0; // G
    data[i * 4 + 2] = 0; // B
    data[i * 4 + 3] = 255; // A
  }
  return { data, width, height };
};

describe('OxiPNG WASM Functionality', () => {
  it('should optimize image and return PNG with magic bytes', async () => {
    const image = createTestImage();
    const optimize = createOxipngOptimizer('client');

    const result = await optimize(image);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    expect(hasPngMagic(result)).toBe(true);

    await optimize.terminate();
  }, 30000);

  it('should optimize with level 0 (fastest)', async () => {
    const image = createTestImage();
    const optimize = createOxipngOptimizer('client');

    const result = await optimize(image, { level: 0 });

    expect(result).toBeInstanceOf(Uint8Array);
    expect(hasPngMagic(result)).toBe(true);

    await optimize.terminate();
  }, 30000);

  it('should optimize with level 6 (best compression)', async () => {
    const image = createTestImage();
    const optimize = createOxipngOptimizer('client');

    const result = await optimize(image, { level: 6 });

    expect(result).toBeInstanceOf(Uint8Array);
    expect(hasPngMagic(result)).toBe(true);

    await optimize.terminate();
  }, 30000);

  it('should optimize with interlace enabled', async () => {
    const image = createTestImage();
    const optimize = createOxipngOptimizer('client');

    const result = await optimize(image, { level: 2, interlace: true });

    expect(result).toBeInstanceOf(Uint8Array);
    expect(hasPngMagic(result)).toBe(true);

    await optimize.terminate();
  }, 30000);

  it('should optimize with default options (no options argument)', async () => {
    const image = createTestImage();
    const optimize = createOxipngOptimizer('client');

    const result = await optimize(image);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(hasPngMagic(result)).toBe(true);

    await optimize.terminate();
  }, 30000);

  it('should reject a pre-aborted AbortSignal before touching WASM', async () => {
    const optimizer = createOxipngOptimizer('client');
    const image = createTestImage();
    const controller = new AbortController();
    controller.abort();

    await expect(optimizer(image, {}, controller.signal)).rejects.toThrow(
      DOMException
    );

    await optimizer.terminate();
  }, 30000);

  it('should expose a working terminate method', async () => {
    const optimizer = createOxipngOptimizer('client');
    expect(typeof optimizer.terminate).toBe('function');
    await expect(optimizer.terminate()).resolves.toBeUndefined();
  });

  it('should expose a working terminate method in worker mode', async () => {
    const optimizer = createOxipngOptimizer('worker');
    expect(typeof optimizer.terminate).toBe('function');
    await expect(optimizer.terminate()).resolves.toBeUndefined();
  }, 30000);
});
