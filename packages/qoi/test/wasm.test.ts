/**
 * QOI WASM tests
 */

import { describe, it, expect } from 'bun:test';
import { createQoiEncoder, createQoiDecoder } from '../src/index.js';
import type { ImageInput } from '../src/index.js';

// QOI magic bytes: 'qoif' = 0x71 0x6F 0x69 0x66
const QOI_MAGIC = [0x71, 0x6f, 0x69, 0x66];

// Test image data: 4x4 RGBA image
const createTestImage = (): ImageInput => {
  const width = 4;
  const height = 4;
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 0] = (i % 4) * 64; // R
    data[i * 4 + 1] = Math.floor(i / 4) * 64; // G
    data[i * 4 + 2] = 128; // B
    data[i * 4 + 3] = 255; // A
  }
  return { data, width, height };
};

describe('QOI WASM', () => {
  it('encode returns Uint8Array with QOI magic bytes', async () => {
    const encoder = createQoiEncoder('client');
    try {
      const image = createTestImage();
      const result = await encoder(image);
      expect(result).toBeInstanceOf(Uint8Array);
      // Check QOI magic bytes 'qoif'
      expect(result[0]).toBe(QOI_MAGIC[0]);
      expect(result[1]).toBe(QOI_MAGIC[1]);
      expect(result[2]).toBe(QOI_MAGIC[2]);
      expect(result[3]).toBe(QOI_MAGIC[3]);
    } finally {
      await encoder.terminate();
    }
  });

  it('decode returns ImageData-like object', async () => {
    const encoder = createQoiEncoder('client');
    const decoder = createQoiDecoder('client');
    try {
      const image = createTestImage();
      const encoded = await encoder(image);
      const decoded = await decoder(encoded);
      expect(decoded).toHaveProperty('data');
      expect(decoded).toHaveProperty('width');
      expect(decoded).toHaveProperty('height');
    } finally {
      await encoder.terminate();
      await decoder.terminate();
    }
  });

  it('round-trip encode/decode preserves dimensions', async () => {
    const encoder = createQoiEncoder('client');
    const decoder = createQoiDecoder('client');
    try {
      const image = createTestImage();
      const encoded = await encoder(image);
      const decoded = await decoder(encoded);
      expect(decoded.width).toBe(image.width);
      expect(decoded.height).toBe(image.height);
    } finally {
      await encoder.terminate();
      await decoder.terminate();
    }
  });

  it('rejects pre-aborted signal on encode', async () => {
    const encoder = createQoiEncoder('client');
    try {
      const image = createTestImage();
      const controller = new AbortController();
      controller.abort();
      await expect(encoder(image, controller.signal)).rejects.toThrow();
    } finally {
      await encoder.terminate();
    }
  });

  it('rejects pre-aborted signal on decode', async () => {
    const encoder = createQoiEncoder('client');
    const decoder = createQoiDecoder('client');
    try {
      const image = createTestImage();
      const encoded = await encoder(image);
      const controller = new AbortController();
      controller.abort();
      await expect(decoder(encoded, controller.signal)).rejects.toThrow();
    } finally {
      await encoder.terminate();
      await decoder.terminate();
    }
  });

  it('terminate() works without error', async () => {
    const encoder = createQoiEncoder('client');
    const decoder = createQoiDecoder('client');
    const image = createTestImage();
    await encoder(image);
    await expect(encoder.terminate()).resolves.toBeUndefined();
    await expect(decoder.terminate()).resolves.toBeUndefined();
  });
});
