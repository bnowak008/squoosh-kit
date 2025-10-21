/**
 * WASM functionality tests for WebP
 */

import { describe, it, expect } from 'bun:test';
import { encode, createWebpEncoder } from '../src/index.ts';
import type { ImageInput } from '@squoosh-kit/runtime';
import type { WebpOptions } from '../src/types.ts';

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
  it.skip('should encode image data to WebP format', async () => {
    const image = createTestImage();
    const signal = new AbortController().signal;

    const result = await encode(signal, image);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);

    // WebP files start with "RIFF" and contain "WEBP"
    const header = new TextDecoder().decode(result.slice(0, 12));
    expect(header).toContain('RIFF');
    expect(header).toContain('WEBP');
  }, 30000); // 30 second timeout

  it.skip('should encode with custom options', async () => {
    const image = createTestImage();
    const signal = new AbortController().signal;
    const options: WebpOptions = {
      quality: 90,
      lossless: false,
    };

    const result = await encode(signal, image, options);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  }, 30000);

  it.skip('should work with factory functions', async () => {
    const image = createTestImage();
    const signal = new AbortController().signal;

    // Test WebP encoder factory
    const webpEncoder = createWebpEncoder('client');
    const webpResult = await webpEncoder(signal, image);
    expect(webpResult).toBeInstanceOf(Uint8Array);
  }, 30000);
});
