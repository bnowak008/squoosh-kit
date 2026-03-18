/**
 * WASM functionality tests for VisDif (Butteraugli perceptual comparison)
 */

import { describe, it, expect } from 'bun:test';
import { createVisDiff } from '../src/index.ts';
import type { ImageInput } from '@squoosh-kit/runtime';

// Create a solid-color test image
const createSolidImage = (
  width: number,
  height: number,
  r: number,
  g: number,
  b: number
): ImageInput => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return { data, width, height };
};

// Create a slightly different image (nudge one channel by a small amount)
const createSlightlyDifferentImage = (
  base: ImageInput,
  delta: number
): ImageInput => {
  const data = new Uint8Array(
    base.data instanceof Uint8ClampedArray
      ? base.data
      : (base.data as Uint8Array)
  );
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + delta));
  }
  return { data, width: base.width, height: base.height };
};

describe('VisDif WASM Functionality', () => {
  it('should compare identical images and return 0 or a very small number', async () => {
    const image = createSolidImage(8, 8, 128, 128, 128);
    const visdiff = createVisDiff('client');

    const distance = await visdiff(image, image);

    expect(typeof distance).toBe('number');
    expect(distance).toBeGreaterThanOrEqual(0);
    expect(distance).toBeLessThan(0.1);

    await visdiff.terminate();
  }, 60000);

  it('should compare different images and return a positive number', async () => {
    const image1 = createSolidImage(8, 8, 0, 0, 0); // black
    const image2 = createSolidImage(8, 8, 255, 255, 255); // white
    const visdiff = createVisDiff('client');

    const distance = await visdiff(image1, image2);

    expect(typeof distance).toBe('number');
    expect(distance).toBeGreaterThan(0);

    await visdiff.terminate();
  }, 60000);

  it('should return higher score for more different images than for similar ones', async () => {
    const base = createSolidImage(8, 8, 128, 128, 128);
    const similar = createSlightlyDifferentImage(base, 5);
    const veryDifferent = createSolidImage(8, 8, 0, 0, 0);
    const visdiff = createVisDiff('client');

    const similarDistance = await visdiff(base, similar);
    const differentDistance = await visdiff(base, veryDifferent);

    expect(differentDistance).toBeGreaterThan(similarDistance);

    await visdiff.terminate();
  }, 60000);

  it('should throw when images have mismatched dimensions', async () => {
    const image1 = createSolidImage(4, 4, 128, 128, 128);
    const image2 = createSolidImage(8, 8, 128, 128, 128);
    const visdiff = createVisDiff('client');

    await expect(visdiff(image1, image2)).rejects.toThrow(
      'Images must have the same dimensions for comparison'
    );

    await visdiff.terminate();
  }, 30000);

  it('should reject a pre-aborted AbortSignal before touching WASM', async () => {
    const image = createSolidImage(8, 8, 128, 128, 128);
    const visdiff = createVisDiff('client');
    const controller = new AbortController();
    controller.abort();

    await expect(visdiff(image, image, controller.signal)).rejects.toThrow(
      DOMException
    );

    await visdiff.terminate();
  }, 30000);

  it('should expose a working terminate method', async () => {
    const visdiff = createVisDiff('client');
    expect(typeof visdiff.terminate).toBe('function');
    await expect(visdiff.terminate()).resolves.toBeUndefined();
  });

  it('terminate should work without prior compare call', async () => {
    const visdiff = createVisDiff('worker');
    expect(typeof visdiff.terminate).toBe('function');
    await expect(visdiff.terminate()).resolves.toBeUndefined();
  }, 30000);
});
