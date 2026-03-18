/**
 * Integration tests for the full library
 */

import { describe, it, expect } from 'bun:test';
import { createWebpEncoder, createResizer } from '../src/index.ts';

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
  it('should create factory functions from main entry point', () => {
    // Test WebP encoder factory
    const webpEncoder = createWebpEncoder('client');
    expect(typeof webpEncoder).toBe('function');

    // Test resize factory
    const resizer = createResizer('client');
    expect(typeof resizer).toBe('function');
  });

  it('should create factory functions for worker mode', () => {
    // Test WebP encoder factory
    const webpEncoder = createWebpEncoder('worker');
    expect(typeof webpEncoder).toBe('function');

    // Test resize factory
    const resizer = createResizer('worker');
    expect(typeof resizer).toBe('function');
  });

  it('should encode with webp and resize in sequence', async () => {
    const data = new Uint8ClampedArray(16 * 16 * 4).fill(128);
    const image = { data, width: 16, height: 16 };
    const resizer = createResizer('client');
    const resized = await resizer(image, { width: 8, height: 8 });
    const encoder = createWebpEncoder('client');
    const encoded = await encoder(resized);
    expect(encoded).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(encoded.slice(0, 4));
    expect(header).toBe('RIFF');
  });

});
