/**
 * Integration tests for the full library
 */

import { describe, it, expect } from 'bun:test';
import { webp, resize } from '../src/index.ts';

describe('Integration Tests', () => {
  it('should create factory functions from main entry point', () => {
    // Test WebP encoder factory
    const webpEncoder = webp.createWebpEncoder('client');
    expect(typeof webpEncoder).toBe('function');

    // Test resize factory
    const resizer = resize.createResizer('client');
    expect(typeof resizer).toBe('function');
  });

  it('should create factory functions for worker mode', () => {
    // Test WebP encoder factory
    const webpEncoder = webp.createWebpEncoder('worker');
    expect(typeof webpEncoder).toBe('function');

    // Test resize factory
    const resizer = resize.createResizer('worker');
    expect(typeof resizer).toBe('function');
  });

  it('should encode with webp and resize in sequence', async () => {
    const data = new Uint8ClampedArray(16 * 16 * 4).fill(128);
    const image = { data, width: 16, height: 16 };
    const resizer = resize.createResizer('client');
    const resized = await resizer(image, { width: 8, height: 8 });
    const encoder = webp.createWebpEncoder('client');
    const encoded = await encoder(resized);
    expect(encoded).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(encoded.slice(0, 4));
    expect(header).toBe('RIFF');
  });
});
