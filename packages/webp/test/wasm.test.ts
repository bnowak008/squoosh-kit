/**
 * WASM functionality tests for WebP
 */

import { describe, it, expect } from 'bun:test';
import { createWebpEncoder } from '../src/index.ts';
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
    const options: WebpOptions = {
      quality: 90,
      lossless: false,
    };

    const encode = createWebpEncoder('client');
    const result = await encode(image, options);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  }, 30000);

  it('should work with factory functions', async () => {
    const image = createTestImage();

    const encode = createWebpEncoder('client');
    const result = await encode(image);

    expect(result).toBeInstanceOf(Uint8Array);
  }, 30000);
});
