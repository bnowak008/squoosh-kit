/**
 * WASM functionality tests for Resize
 */

import { describe, it, expect } from 'bun:test';
import { createResizer } from '../src/index.ts';
import type { ImageInput } from '../../runtime/src/index.ts';

// Test image data: 2x2 red square
const createTestImage = (): ImageInput => {
  const data = new Uint8Array([
    255,
    0,
    0,
    255, // Red pixel
    255,
    0,
    0,
    255, // Red pixel
    255,
    0,
    0,
    255, // Red pixel
    255,
    0,
    0,
    255, // Red pixel
  ]);
  return { data, width: 2, height: 2 };
};

describe('Resize WASM Functionality', () => {
  it('should resize image to specified dimensions', async () => {
    const image = createTestImage();
    const resize = createResizer('client');
    const result = await resize(image, { width: 1, height: 1 });
    expect(result).toEqual({
      data: new Uint8ClampedArray([254, 0, 0, 255]),
      width: 1,
      height: 1,
    });
  });

  it('should work with factory functions', async () => {
    const image = createTestImage();

    // Test resize factory
    const resize = createResizer('client');
    const result = await resize(image, { width: 1, height: 1 });

    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });

  it('should preserve aspect ratio when only width is specified', async () => {
    const data = new Uint8Array(100 * 50 * 4).fill(128);
    const resizer = createResizer('client');
    const result = await resizer(
      { data, width: 100, height: 50 },
      { width: 50 }
    );
    expect(result.width).toBe(50);
    expect(result.height).toBe(25); // 50 * 50 / 100 = 25
  });

  it('should preserve aspect ratio when only height is specified', async () => {
    const data = new Uint8Array(100 * 50 * 4).fill(128);
    const resizer = createResizer('client');
    const result = await resizer(
      { data, width: 100, height: 50 },
      { height: 25 }
    );
    expect(result.height).toBe(25);
    expect(result.width).toBe(50); // 100 * 25 / 50 = 50
  });

  it('should return same dimensions when neither width nor height is specified', async () => {
    const resizer = createResizer('client');
    const image = createTestImage();
    const result = await resizer(image, {});
    expect(result.width).toBe(image.width);
    expect(result.height).toBe(image.height);
    expect(result.data).toBeInstanceOf(Uint8ClampedArray);
  });

  it('should reject a pre-aborted AbortSignal before touching WASM', async () => {
    const resizer = createResizer('client');
    const image = createTestImage();
    const controller = new AbortController();
    controller.abort();
    await expect(
      resizer(image, { width: 1, height: 1 }, controller.signal)
    ).rejects.toThrow(DOMException);
  });

  it('should expose a working terminate method', async () => {
    const resizer = createResizer('client');
    expect(typeof resizer.terminate).toBe('function');
    await expect(resizer.terminate()).resolves.toBeUndefined();
  });

  it('should expose a working terminate method in worker mode', async () => {
    const resizer = createResizer('worker');
    expect(typeof resizer.terminate).toBe('function');
    await expect(resizer.terminate()).resolves.toBeUndefined();
  }, 30000);
});
