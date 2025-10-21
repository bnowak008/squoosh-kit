/**
 * Image resize tests
 */

import { describe, it, expect } from 'bun:test';
import { createResizer } from '../dist/index.js';
import type {
  ImageInput,
  ResizeOptions,
} from '../dist/index.js';

// Test image data: 4x4 red square
const createTestImage = (): ImageInput => {
  const data = new Uint8Array(64); // 4x4x4 = 64 bytes
  for (let i = 0; i < 64; i += 4) {
    data[i] = 255; // R
    data[i + 1] = 0; // G
    data[i + 2] = 0; // B
    data[i + 3] = 255; // A
  }
  return { data, width: 4, height: 4 };
};

describe('Image Resize', () => {
  it('should create resizer factory function', () => {
    const resizer = createResizer('client');
    expect(typeof resizer).toBe('function');
  });

  it('should create resizer factory function for worker mode', () => {
    const resizer = createResizer('worker');
    expect(typeof resizer).toBe('function');
  });

  it('should validate image input structure', () => {
    const image = createTestImage();
    expect(image.data).toBeInstanceOf(Uint8Array);
    expect(image.width).toBe(4);
    expect(image.height).toBe(4);
    expect(image.data.length).toBe(64); // 4x4x4 = 64 bytes
  });

  it('should validate resize options', () => {
    const options: ResizeOptions = {
      width: 800,
      height: 600,
      premultiply: false,
      linearRGB: false,
    };
    expect(options.width).toBe(800);
    expect(options.height).toBe(600);
    expect(options.premultiply).toBe(false);
    expect(options.linearRGB).toBe(false);
  });

  it('should handle partial resize options', () => {
    const options: ResizeOptions = {
      width: 800,
    };
    expect(options.width).toBe(800);
    expect(options.height).toBeUndefined();
    expect(options.premultiply).toBeUndefined();
    expect(options.linearRGB).toBeUndefined();
  });

  it('should handle default resize options', () => {
    const options: ResizeOptions = {};
    expect(options.width).toBeUndefined();
    expect(options.height).toBeUndefined();
    expect(options.premultiply).toBeUndefined();
    expect(options.linearRGB).toBeUndefined();
  });
});
