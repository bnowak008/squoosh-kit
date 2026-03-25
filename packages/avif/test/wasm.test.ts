/**
 * WASM functionality tests for AVIF
 */

import { describe, it, expect } from 'bun:test';
import {
  createAvifEncoder,
  createAvifDecoder,
  AVIFTune,
} from '../src/index.ts';
import type { ImageInput } from '@squoosh-kit/runtime';
import type { AvifEncodeOptions } from '../src/types.ts';

// Test image data: 2x2 red square (RGBA)
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

// Check that a buffer contains AVIF magic bytes
// AVIF files are ISOBMFF containers with 'ftyp' box containing 'avif' or 'avis' brand
function isAvifBytes(data: Uint8Array): boolean {
  const decoder = new TextDecoder('ascii', { fatal: false });
  // The 'ftyp' box appears at offset 4 in most ISOBMFF files
  // and 'avif' or 'avis' brand appears at offset 8
  const slice = decoder.decode(data.slice(0, 32));
  return (
    slice.includes('ftyp') || slice.includes('avif') || slice.includes('avis')
  );
}

describe('AVIF WASM Functionality', () => {
  it('should encode image data to AVIF format', async () => {
    const image = createTestImage();

    const encoder = createAvifEncoder('client');
    const result = await encoder(image, { quality: 60 });

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);

    // AVIF files are ISOBMFF containers — check for ftyp/avif markers
    expect(isAvifBytes(result)).toBe(true);

    await encoder.terminate();
  }, 30000);

  it('should encode with custom options', async () => {
    const image = createTestImage();
    const options: AvifEncodeOptions = {
      quality: 80,
      qualityAlpha: -1,
      speed: 8,
      tune: AVIFTune.auto,
    };

    const encoder = createAvifEncoder('client');
    const result = await encoder(image, options);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    expect(isAvifBytes(result)).toBe(true);

    await encoder.terminate();
  }, 30000);

  it('should encode with default options (no options argument)', async () => {
    const image = createTestImage();

    const encoder = createAvifEncoder('client');
    const result = await encoder(image);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    expect(isAvifBytes(result)).toBe(true);

    await encoder.terminate();
  }, 30000);

  it('should decode AVIF data to ImageData', async () => {
    const image = createTestImage();

    // First encode
    const encoder = createAvifEncoder('client');
    const encoded = await encoder(image);
    await encoder.terminate();

    // Then decode
    const decoder = createAvifDecoder('client');
    const decoded = await decoder(encoded);

    expect(decoded).toBeDefined();
    expect(decoded.width).toBeGreaterThan(0);
    expect(decoded.height).toBeGreaterThan(0);
    expect(decoded.data).toBeDefined();

    await decoder.terminate();
  }, 60000);

  it('should encode then decode round-trip (dimensions match)', async () => {
    const data = new Uint8Array(8 * 8 * 4);
    // Fill with a simple gradient pattern
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const idx = (y * 8 + x) * 4;
        data[idx] = x * 32; // R
        data[idx + 1] = y * 32; // G
        data[idx + 2] = 128; // B
        data[idx + 3] = 255; // A
      }
    }
    const image: ImageInput = { data, width: 8, height: 8 };

    const encoder = createAvifEncoder('client');
    const encoded = await encoder(image, { quality: 70 });
    await encoder.terminate();

    const decoder = createAvifDecoder('client');
    const decoded = await decoder(encoded);
    await decoder.terminate();

    expect(decoded.width).toBe(8);
    expect(decoded.height).toBe(8);
  }, 60000);

  it('should reject a pre-aborted AbortSignal before touching WASM', async () => {
    const encoder = createAvifEncoder('client');
    const image = createTestImage();
    const controller = new AbortController();
    controller.abort();
    await expect(encoder(image, {}, controller.signal)).rejects.toThrow(
      DOMException
    );
    await encoder.terminate();
  }, 30000);

  it('should expose a working terminate method', async () => {
    const encoder = createAvifEncoder('client');
    expect(typeof encoder.terminate).toBe('function');
    await expect(encoder.terminate()).resolves.toBeUndefined();
  });

  it('should expose a working terminate method in worker mode', async () => {
    const encoder = createAvifEncoder('worker');
    expect(typeof encoder.terminate).toBe('function');
    await expect(encoder.terminate()).resolves.toBeUndefined();
  }, 30000);
});
