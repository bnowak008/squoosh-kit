/**
 * WASM functionality tests for JXL
 */

import { describe, it, expect } from 'bun:test';
import { createJxlEncoder, createJxlDecoder } from '../src/index.ts';
import type { ImageInput } from '@squoosh-kit/runtime';
import type { JxlEncodeOptions } from '../src/types.ts';

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

describe('JXL WASM Functionality', () => {
  it('should encode image data to JXL format', async () => {
    const image = createTestImage();

    const encode = createJxlEncoder('client');
    const result = await encode(image, { quality: 90 });

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);

    // JXL files start with either:
    // - Bare codestream: 0xFF 0x0A
    // - ISOBMFF container: 0x00 0x00 0x00 0x0C 'J' 'X' 'L' ' ' (with 'JXL ' box)
    const isBareCodingstream = result[0] === 0xff && result[1] === 0x0a;
    const isContainer =
      result[4] === 0x4a && // 'J'
      result[5] === 0x58 && // 'X'
      result[6] === 0x4c && // 'L'
      result[7] === 0x20; // ' '
    expect(isBareCodingstream || isContainer).toBe(true);
  }, 30000);

  it('should encode with custom options', async () => {
    const image = createTestImage();
    const options: JxlEncodeOptions = {
      quality: 80,
      effort: 5,
    };

    const encode = createJxlEncoder('client');
    const result = await encode(image, options);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  }, 30000);

  it('should encode with default options (no options argument)', async () => {
    const image = createTestImage();

    const encode = createJxlEncoder('client');
    const result = await encode(image);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  }, 30000);

  it('should decode JXL data to ImageData-like object', async () => {
    const image = createTestImage();
    const encode = createJxlEncoder('client');
    const encoded = await encode(image, { quality: 90 });

    const decode = createJxlDecoder('client');
    const result = await decode(encoded);

    expect(result).toBeDefined();
    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
    expect(result.data).toBeDefined();
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
  }, 30000);

  it('should round-trip encode then decode', async () => {
    const image = createTestImage();
    const encode = createJxlEncoder('client');
    const decode = createJxlDecoder('client');

    const encoded = await encode(image, { quality: 100 });
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = await decode(encoded);
    expect(decoded.width).toBe(image.width);
    expect(decoded.height).toBe(image.height);
    expect(decoded.data.length).toBe(image.width * image.height * 4);
  }, 30000);

  it('should reject a pre-aborted AbortSignal before touching WASM', async () => {
    const encoder = createJxlEncoder('client');
    const image = createTestImage();
    const controller = new AbortController();
    controller.abort();
    await expect(encoder(image, {}, controller.signal)).rejects.toThrow(
      DOMException
    );
  }, 30000);

  it('should expose a working terminate method on encoder', async () => {
    const encoder = createJxlEncoder('client');
    expect(typeof encoder.terminate).toBe('function');
    await expect(encoder.terminate()).resolves.toBeUndefined();
  });

  it('should expose a working terminate method in encoder worker mode', async () => {
    const encoder = createJxlEncoder('worker');
    expect(typeof encoder.terminate).toBe('function');
    await expect(encoder.terminate()).resolves.toBeUndefined();
  }, 30000);

  it('should expose a working terminate method on decoder', async () => {
    const decoder = createJxlDecoder('client');
    expect(typeof decoder.terminate).toBe('function');
    await expect(decoder.terminate()).resolves.toBeUndefined();
  });
});
