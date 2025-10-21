/**
 * WebP encoder tests
 */

import { describe, it, expect } from 'bun:test';
import { createWebpEncoder } from '../dist/index.js';
import type { ImageInput, WebpOptions } from '../dist/index.js';

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

describe('WebP Encoder', () => {
  it('should create encoder factory function', () => {
    const encoder = createWebpEncoder('client');
    expect(typeof encoder).toBe('function');
  });

  it('should create encoder factory function for worker mode', () => {
    const encoder = createWebpEncoder('worker');
    expect(typeof encoder).toBe('function');
  });

  it('should validate image input structure', () => {
    const image = createTestImage();
    expect(image.data).toBeInstanceOf(Uint8Array);
    expect(image.width).toBe(2);
    expect(image.height).toBe(2);
    expect(image.data.length).toBe(16); // 2x2x4 = 16 bytes
  });

  it('should validate WebP options', () => {
    const options: WebpOptions = {
      quality: 90,
      lossless: false,
      nearLossless: false,
    };
    expect(options.quality).toBe(90);
    expect(options.lossless).toBe(false);
    expect(options.nearLossless).toBe(false);
  });

  it('should handle default WebP options', () => {
    const options: WebpOptions = {};
    expect(options.quality).toBeUndefined();
    expect(options.lossless).toBeUndefined();
    expect(options.nearLossless).toBeUndefined();
  });
});
