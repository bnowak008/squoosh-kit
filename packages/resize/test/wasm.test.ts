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
    console.log('--- RESIZE TEST RESULT ---');
    console.log(result);
    console.log('--------------------------');
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
});
