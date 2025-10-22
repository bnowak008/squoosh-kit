/**
 * Integration tests for the full library
 */

import { describe, it, expect } from 'bun:test';
import { createWebpEncoder, createResizer } from '../src/';

// Test image data: 3x3 red square
const createTestImage = (): {
  data: Uint8ClampedArray;
  width: number;
  height: number;
} => {
  const data = new Uint8ClampedArray(36); // 3x3x4 = 36 bytes
  for (let i = 0; i < 36; i += 4) {
    data[i] = 255; // R
    data[i + 1] = 0; // G
    data[i + 2] = 0; // B
    data[i + 3] = 255; // A
  }
  return { data, width: 3, height: 3 };
};

describe('Integration Tests', () => {
  it('should create factory functions from main entry point', async () => {
    // Test WebP encoder factory
    const webpEncoder = await createWebpEncoder('client');
    expect(typeof webpEncoder).toBe('function');

    // Test resize factory
    const resizer = await createResizer('client');
    expect(typeof resizer).toBe('function');
  });

  it('should create factory functions for worker mode', async () => {
    // Test WebP encoder factory
    const webpEncoder = await createWebpEncoder('worker');
    expect(typeof webpEncoder).toBe('function');

    // Test resize factory
    const resizer = await createResizer('worker');
    expect(typeof resizer).toBe('function');
  });

  it('should validate image input from main entry point', async () => {
    const image = createTestImage();
    expect(image.data).toBeInstanceOf(Uint8ClampedArray);
    expect(image.width).toBe(3);
    expect(image.height).toBe(3);
    expect(image.data.length).toBe(36); // 3x3x4 = 36 bytes
  });

  it('should handle different execution modes', async () => {
    // Test that both modes are supported
    const clientWebpEncoder = createWebpEncoder('client');
    const workerWebpEncoder = createWebpEncoder('worker');
    const clientResizer = createResizer('client');
    const workerResizer = createResizer('worker');

    expect(typeof clientWebpEncoder).toBe('function');
    expect(typeof workerWebpEncoder).toBe('function');
    expect(typeof clientResizer).toBe('function');
    expect(typeof workerResizer).toBe('function');
  });
});
