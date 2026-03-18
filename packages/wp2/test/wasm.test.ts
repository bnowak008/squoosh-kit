/**
 * WP2 encoder/decoder WASM tests
 */

import { describe, it, expect } from 'bun:test';
import {
  createWp2Encoder,
  createWp2Decoder,
  UVMode,
  Csp,
} from '../src/index.js';
import type { ImageInput } from '../src/index.js';

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

describe('WP2 Factory', () => {
  it('should create a factory function for client mode', () => {
    const wp2Encoder = createWp2Encoder('client');
    expect(typeof wp2Encoder).toBe('function');
  });

  it('should create a factory function for worker mode', () => {
    const wp2Encoder = createWp2Encoder('worker');
    expect(typeof wp2Encoder).toBe('function');
  });

  it('should create a decoder factory function for client mode', () => {
    const wp2Decoder = createWp2Decoder('client');
    expect(typeof wp2Decoder).toBe('function');
  });
});

describe('WP2 Encode', () => {
  it('should encode and return a non-empty Uint8Array', async () => {
    const encoder = createWp2Encoder('client');
    const image = createTestImage();
    const result = await encoder(image);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    await encoder.terminate();
  });

  it('should accept Uint8ClampedArray input and encode correctly', async () => {
    const clampedData = new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
    ]);
    const encoder = createWp2Encoder('client');
    const result = await encoder({ data: clampedData, width: 2, height: 2 });
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    await encoder.terminate();
  });

  it('should encode with custom options', async () => {
    const encoder = createWp2Encoder('client');
    const image = createTestImage();
    const result = await encoder(image, {
      quality: 90,
      alpha_quality: 90,
      effort: 3,
    });
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    await encoder.terminate();
  });

  it('should encode with UVMode and Csp options', async () => {
    const encoder = createWp2Encoder('client');
    const image = createTestImage();
    const result = await encoder(image, {
      quality: 75,
      uv_mode: UVMode.UVModeAuto,
      csp_type: Csp.kYCoCg,
    });
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    await encoder.terminate();
  });
});

describe('WP2 Decode', () => {
  it('should decode encoded WP2 data and return ImageData-like object', async () => {
    const encoder = createWp2Encoder('client');
    const image = createTestImage();
    const encoded = await encoder(image);
    await encoder.terminate();

    const decoder = createWp2Decoder('client');
    const decoded = await decoder(encoded);
    expect(decoded).toBeDefined();
    expect(typeof decoded.width).toBe('number');
    expect(typeof decoded.height).toBe('number');
    expect(decoded.data).toBeDefined();
    await decoder.terminate();
  });
});

describe('AbortSignal', () => {
  it('should reject with AbortError when signal is pre-aborted before encode', async () => {
    const encoder = createWp2Encoder('client');
    const image = createTestImage();
    const controller = new AbortController();
    controller.abort();

    await expect(encoder(image, {}, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    await encoder.terminate();
  });

  it('should reject with AbortError when signal is pre-aborted before decode', async () => {
    const decoder = createWp2Decoder('client');
    const controller = new AbortController();
    controller.abort();

    await expect(
      decoder(new Uint8Array(0), controller.signal)
    ).rejects.toMatchObject({
      name: 'AbortError',
    });
    await decoder.terminate();
  });
});

describe('terminate()', () => {
  it('should allow terminate to be called without error', async () => {
    const encoder = createWp2Encoder('client');
    await expect(encoder.terminate()).resolves.toBeUndefined();
  });

  it('should allow terminate to be called multiple times without error', async () => {
    const encoder = createWp2Encoder('worker');
    await expect(encoder.terminate()).resolves.toBeUndefined();
    await expect(encoder.terminate()).resolves.toBeUndefined();
  });
});

describe('UVMode and Csp exports', () => {
  it('should export UVMode with correct values', () => {
    expect(UVMode.UVModeAdapt).toBe(0);
    expect(UVMode.UVMode420).toBe(1);
    expect(UVMode.UVMode444).toBe(2);
    expect(UVMode.UVModeAuto).toBe(3);
  });

  it('should export Csp with correct values', () => {
    expect(Csp.kYCoCg).toBe(0);
    expect(Csp.kYCbCr).toBe(1);
    expect(Csp.kCustom).toBe(2);
    expect(Csp.kYIQ).toBe(3);
  });
});
