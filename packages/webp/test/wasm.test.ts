/**
 * WASM functionality tests for WebP
 */

import { describe, it, expect } from 'bun:test';
import { createWebpEncoder } from '../src/index.ts';
import type { ImageInput } from '@squoosh-kit/runtime';
import type { EncodeInputOptions } from '../src/types.ts';

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

describe('WebP WASM Functionality', () => {
  it('should encode image data to WebP format', async () => {
    const image = createTestImage();

    const encode = createWebpEncoder('client');
    const result = await encode(image, { quality: 90 });

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);

    // WebP files start with "RIFF" and contain "WEBP"
    const header = new TextDecoder().decode(result.slice(0, 12));
    expect(header).toContain('RIFF');
    expect(header).toContain('WEBP');
  }, 30000); // 30 second timeout

  it('should encode with custom options', async () => {
    const image = createTestImage();
    const options: EncodeInputOptions = {
      quality: 90,
      lossless: 0,
    };

    const encode = createWebpEncoder('client');
    const result = await encode(image, options);

    expect(result).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(result.slice(0, 12));
    expect(header).toContain('RIFF');
    expect(header).toContain('WEBP');
  }, 30000);

  it('should encode with default options (no options argument)', async () => {
    const image = createTestImage();

    const encode = createWebpEncoder('client');
    const result = await encode(image);

    expect(result).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(result.slice(0, 12));
    expect(header).toContain('RIFF');
    expect(header).toContain('WEBP');
  }, 30000);

  it('should produce smaller output at lower quality', async () => {
    const data = new Uint8Array(100 * 100 * 4);
    for (let i = 0; i < data.length; i++) data[i] = Math.floor(Math.random() * 256);
    const image = { data, width: 100, height: 100 };
    const encode = createWebpEncoder('client');
    const lowQ = await encode(image, { quality: 1 });
    const highQ = await encode(image, { quality: 100 });
    expect(lowQ.length).toBeLessThan(highQ.length);
  }, 30000);

  it('should encode with lossless mode', async () => {
    const image = createTestImage();
    const encode = createWebpEncoder('client');
    const result = await encode(image, { lossless: 1 });
    expect(result).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(result.slice(0, 4));
    expect(header).toBe('RIFF');
  }, 30000);

  it('should reject a pre-aborted AbortSignal before touching WASM', async () => {
    const encoder = createWebpEncoder('client');
    const image = createTestImage();
    const controller = new AbortController();
    controller.abort();
    await expect(encoder(image, {}, controller.signal)).rejects.toThrow(DOMException);
  }, 30000);

  it('should expose a working terminate method', async () => {
    const encoder = createWebpEncoder('client');
    expect(typeof encoder.terminate).toBe('function');
    await expect(encoder.terminate()).resolves.toBeUndefined();
  });

  it('should expose a working terminate method in worker mode', async () => {
    const encoder = createWebpEncoder('worker');
    expect(typeof encoder.terminate).toBe('function');
    await expect(encoder.terminate()).resolves.toBeUndefined();
  }, 30000);
});
