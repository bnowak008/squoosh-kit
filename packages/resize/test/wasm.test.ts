/**
 * WASM functionality tests for Resize
 */

import { describe, it, expect } from 'bun:test';
import { resize, createResizer } from '../src/index.ts';
import type { ResizeOptions } from '../src/types.ts';
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
  it.skip('should resize image to specified dimensions', async () => {
    const image = createTestImage();
    const signal = new AbortController().signal;
    const options: ResizeOptions = {
      width: 1,
      height: 1,
    };
    const result = await resize(signal, image, options);
    console.log('--- RESIZE TEST RESULT ---');
    console.log(result);
    console.log('--------------------------');
    expect(result).toBeDefined();
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
    expect(result.data).toBeInstanceOf(Uint8Array);
    expect(result.data.length).toBe(4); // 1x1x4 = 4 bytes
  });

  it.skip('should work with factory functions', async () => {
    const image = createTestImage();
    const signal = new AbortController().signal;

    // Test resize factory
    const resizer = createResizer('client');
    const resizeResult = await resizer(signal, image, { width: 1, height: 1 });
    expect(resizeResult.width).toBe(1);
    expect(resizeResult.height).toBe(1);
  });
});
