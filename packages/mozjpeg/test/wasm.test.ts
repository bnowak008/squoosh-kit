/**
 * WASM functionality tests for MozJPEG
 */

import { describe, it, expect } from 'bun:test';
import { createMozjpegEncoder, createMozjpegDecoder } from '../src/index.ts';
import type { ImageInput } from '@squoosh-kit/runtime';
import type { MozjpegEncodeOptions } from '../src/types.ts';

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

// JPEG magic bytes: FF D8 FF
const isJpeg = (data: Uint8Array): boolean =>
  data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;

describe('MozJPEG WASM Encode Functionality', () => {
  it('should encode image data to JPEG format', async () => {
    const image = createTestImage();

    const encoder = createMozjpegEncoder('client');
    const result = await encoder(image, { quality: 90 });

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    expect(isJpeg(result)).toBe(true);

    await encoder.terminate();
  }, 30000);

  it('should encode with custom quality options', async () => {
    const image = createTestImage();
    const options: MozjpegEncodeOptions = {
      quality: 80,
      progressive: false,
    };

    const encoder = createMozjpegEncoder('client');
    const result = await encoder(image, options);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(isJpeg(result)).toBe(true);

    await encoder.terminate();
  }, 30000);

  it('should encode with default options (no options argument)', async () => {
    const image = createTestImage();

    const encoder = createMozjpegEncoder('client');
    const result = await encoder(image);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(isJpeg(result)).toBe(true);

    await encoder.terminate();
  }, 30000);

  it('should reject a pre-aborted AbortSignal before encoding', async () => {
    const encoder = createMozjpegEncoder('client');
    const image = createTestImage();
    const controller = new AbortController();
    controller.abort();
    await expect(encoder(image, {}, controller.signal)).rejects.toThrow(
      DOMException
    );
    await encoder.terminate();
  }, 30000);

  it('should expose a working terminate method', async () => {
    const encoder = createMozjpegEncoder('client');
    expect(typeof encoder.terminate).toBe('function');
    await expect(encoder.terminate()).resolves.toBeUndefined();
  });

  it('should expose a working terminate method in worker mode', async () => {
    const encoder = createMozjpegEncoder('worker');
    expect(typeof encoder.terminate).toBe('function');
    await expect(encoder.terminate()).resolves.toBeUndefined();
  }, 30000);
});

describe('MozJPEG WASM Decode Functionality', () => {
  // Decode is only supported in Bun/Node environments
  it('should encode then decode and return an ImageData-like object', async () => {
    const image = createTestImage();
    const encoder = createMozjpegEncoder('client');
    const encoded = await encoder(image, { quality: 90 });

    const decoder = createMozjpegDecoder('client');
    const result = await decoder(encoded);

    expect(result).toBeDefined();
    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);

    await encoder.terminate();
    await decoder.terminate();
  }, 30000);

  it('should reject a pre-aborted AbortSignal before decoding', async () => {
    const decoder = createMozjpegDecoder('client');
    const controller = new AbortController();
    controller.abort();
    const dummyData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    await expect(decoder(dummyData, controller.signal)).rejects.toThrow(
      DOMException
    );
    await decoder.terminate();
  }, 30000);

  it('should expose a working terminate method on decoder', async () => {
    const decoder = createMozjpegDecoder('client');
    expect(typeof decoder.terminate).toBe('function');
    await expect(decoder.terminate()).resolves.toBeUndefined();
  });
});
