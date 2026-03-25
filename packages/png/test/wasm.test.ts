/**
 * WASM functionality tests for PNG
 */

import { describe, it, expect } from 'bun:test';
import { createPngEncoder, createPngDecoder } from '../src/index.ts';
import type { ImageInput } from '@squoosh-kit/runtime';

// PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function hasPngMagic(data: Uint8Array): boolean {
  if (data.length < 8) return false;
  return PNG_MAGIC.every((byte, i) => data[i] === byte);
}

// Test image data: 4x4 RGBA pixels (gradient)
const createTestImage = (): ImageInput => {
  const width = 4;
  const height = 4;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i + 0] = Math.floor((x / width) * 255); // R
      data[i + 1] = Math.floor((y / height) * 255); // G
      data[i + 2] = 128; // B
      data[i + 3] = 255; // A
    }
  }
  return { data, width, height };
};

describe('PNG WASM Functionality', () => {
  it('should encode image data to PNG format with magic bytes', async () => {
    const image = createTestImage();
    const encode = createPngEncoder('client');

    const result = await encode(image);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    expect(hasPngMagic(result)).toBe(true);

    await encode.terminate();
  }, 30000);

  it('should decode PNG data to ImageData-like object', async () => {
    const image = createTestImage();
    const encode = createPngEncoder('client');
    const decode = createPngDecoder('client');

    const encoded = await encode(image);
    expect(hasPngMagic(encoded)).toBe(true);

    const decoded = await decode(encoded);

    expect(decoded).toBeDefined();
    expect(decoded.width).toBe(image.width);
    expect(decoded.height).toBe(image.height);
    expect(decoded.data).toBeInstanceOf(Uint8ClampedArray);
    expect(decoded.data.length).toBe(image.width * image.height * 4);

    await encode.terminate();
    await decode.terminate();
  }, 30000);

  it('should perform a lossless round-trip encode+decode', async () => {
    const image = createTestImage();
    const encode = createPngEncoder('client');
    const decode = createPngDecoder('client');

    const encoded = await encode(image);
    const decoded = await decode(encoded);

    // PNG is lossless — pixel values must match exactly
    expect(decoded.width).toBe(image.width);
    expect(decoded.height).toBe(image.height);

    const originalData =
      image.data instanceof Uint8ClampedArray
        ? image.data
        : new Uint8ClampedArray(
            image.data.buffer as ArrayBuffer,
            image.data.byteOffset,
            image.data.length
          );

    for (let i = 0; i < originalData.length; i++) {
      expect(decoded.data[i]).toBe(originalData[i]);
    }

    await encode.terminate();
    await decode.terminate();
  }, 30000);

  it('should reject a pre-aborted AbortSignal on encode', async () => {
    const encoder = createPngEncoder('client');
    const image = createTestImage();
    const controller = new AbortController();
    controller.abort();

    await expect(encoder(image, controller.signal)).rejects.toThrow(
      DOMException
    );

    await encoder.terminate();
  }, 30000);

  it('should reject a pre-aborted AbortSignal on decode', async () => {
    const decoder = createPngDecoder('client');
    const controller = new AbortController();
    controller.abort();

    await expect(
      decoder(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), controller.signal)
    ).rejects.toThrow(DOMException);

    await decoder.terminate();
  }, 30000);

  it('should expose a working terminate method on encoder', async () => {
    const encoder = createPngEncoder('client');
    expect(typeof encoder.terminate).toBe('function');
    await expect(encoder.terminate()).resolves.toBeUndefined();
  });

  it('should expose a working terminate method on decoder', async () => {
    const decoder = createPngDecoder('client');
    expect(typeof decoder.terminate).toBe('function');
    await expect(decoder.terminate()).resolves.toBeUndefined();
  });

  it('should expose a working terminate method in worker mode', async () => {
    const encoder = createPngEncoder('worker');
    expect(typeof encoder.terminate).toBe('function');
    await expect(encoder.terminate()).resolves.toBeUndefined();
  }, 30000);
});
