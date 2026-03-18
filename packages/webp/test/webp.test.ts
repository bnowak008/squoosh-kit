/**
 * WebP encoder tests
 */

import { describe, it, expect } from 'bun:test';
import { createWebpEncoder } from '../src/index.js';
import type { ImageInput } from '../src/index.js';

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

describe('WebP Factory', () => {
  it('should create a factory function for client mode', () => {
    const webpEncoder = createWebpEncoder('client');
    expect(typeof webpEncoder).toBe('function');
  });

  it('should create a factory function for worker mode', () => {
    const webpEncoder = createWebpEncoder('worker');
    expect(typeof webpEncoder).toBe('function');
  });
});

describe('ImageData Buffer Handling (Zero-Copy Optimization)', () => {
  it('should accept Uint8ClampedArray input and encode correctly', async () => {
    const clampedData = new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255,
      255, 0, 0, 255, 255, 0, 0, 255,
    ]);
    const encoder = createWebpEncoder('client');
    const result = await encoder({ data: clampedData, width: 2, height: 2 });
    expect(result).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(result.slice(0, 4));
    expect(header).toBe('RIFF');
  });
});

describe('Input Validation', () => {
  it('should reject null image', async () => {
    const encoder = createWebpEncoder('client');
    // @ts-expect-error - we want to test the error case
    await expect(encoder(null)).rejects.toThrow(TypeError);
  });

  it('should reject undefined image', async () => {
    const encoder = createWebpEncoder('client');
    // @ts-expect-error - we want to test the error case
    await expect(encoder(undefined)).rejects.toThrow(TypeError);
  });

  it('should reject image without data property', async () => {
    const encoder = createWebpEncoder('client');
    // @ts-expect-error - we want to test the error case
    await expect(encoder({ width: 2, height: 2 })).rejects.toThrow(TypeError);
  });

  it('should reject image without width property', async () => {
    const encoder = createWebpEncoder('client');
    const image = { data: new Uint8Array(16), height: 2 };
    // @ts-expect-error - we want to test the error case
    await expect(encoder(image)).rejects.toThrow(TypeError);
  });

  it('should reject image without height property', async () => {
    const encoder = createWebpEncoder('client');
    const image = { data: new Uint8Array(16), width: 2 };
    // @ts-expect-error - we want to test the error case
    await expect(encoder(image)).rejects.toThrow(TypeError);
  });

  it('should reject image data that is not Uint8Array or Uint8ClampedArray', async () => {
    const encoder = createWebpEncoder('client');
    const image = {
      data: new Float32Array(16),
      width: 2,
      height: 2,
    };
    // @ts-expect-error - we want to test the error case
    await expect(encoder(image)).rejects.toThrow(TypeError);
  });

  it('should reject image data that is a regular array', async () => {
    const encoder = createWebpEncoder('client');
    const image = { data: Array(16).fill(0), width: 2, height: 2 };
    // @ts-expect-error - we want to test the error case
    await expect(encoder(image)).rejects.toThrow(TypeError);
  });

  it('should reject image with NaN width', async () => {
    const encoder = createWebpEncoder('client');
    const image = { data: new Uint8Array(16), width: NaN, height: 2 };
    await expect(encoder(image)).rejects.toThrow(RangeError);
  });

  it('should reject image with NaN height', async () => {
    const encoder = createWebpEncoder('client');
    const image = { data: new Uint8Array(16), width: 2, height: NaN };
    await expect(encoder(image)).rejects.toThrow(RangeError);
  });

  it('should reject image with negative width', async () => {
    const encoder = createWebpEncoder('client');
    const image = { data: new Uint8Array(16), width: -2, height: 2 };
    await expect(encoder(image)).rejects.toThrow(RangeError);
  });

  it('should reject image with negative height', async () => {
    const encoder = createWebpEncoder('client');
    const image = { data: new Uint8Array(16), width: 2, height: -2 };
    await expect(encoder(image)).rejects.toThrow(RangeError);
  });

  it('should reject image with zero width', async () => {
    const encoder = createWebpEncoder('client');
    const image = { data: new Uint8Array(16), width: 0, height: 2 };
    await expect(encoder(image)).rejects.toThrow(RangeError);
  });

  it('should reject image with zero height', async () => {
    const encoder = createWebpEncoder('client');
    const image = { data: new Uint8Array(16), width: 2, height: 0 };
    await expect(encoder(image)).rejects.toThrow(RangeError);
  });

  it('should reject image with floating point width', async () => {
    const encoder = createWebpEncoder('client');
    const image = { data: new Uint8Array(16), width: 2.5, height: 2 };
    await expect(encoder(image)).rejects.toThrow(RangeError);
  });

  it('should reject image with floating point height', async () => {
    const encoder = createWebpEncoder('client');
    const image = { data: new Uint8Array(16), width: 2, height: 2.5 };
    await expect(encoder(image)).rejects.toThrow(RangeError);
  });

  it('should reject image with buffer too small', async () => {
    const encoder = createWebpEncoder('client');
    const image = {
      data: new Uint8Array(10),
      width: 100,
      height: 100,
    };
    await expect(encoder(image)).rejects.toThrow(RangeError);
  });

  it('should provide clear error message for small buffer', async () => {
    const encoder = createWebpEncoder('client');
    const image = {
      data: new Uint8Array(10),
      width: 100,
      height: 100,
    };
    try {
      await encoder(image);
      throw new Error('Should have thrown');
    } catch (e) {
      const message = (e as Error).message;
      expect(message).toContain('too small');
      expect(message).toContain('100x100');
      expect(message).toContain('10');
    }
  });

  describe('WebpOptions validation', () => {
    const createTestImage = (): ImageInput => {
      const data = new Uint8Array([
        255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
      ]);
      return { data, width: 2, height: 2 };
    };

    it('should reject quality below 0', async () => {
      const encoder = createWebpEncoder('client');
      const image = createTestImage();
      await expect(encoder(image, { quality: -1 })).rejects.toThrow(RangeError);
    });

    it('should reject quality above 100', async () => {
      const encoder = createWebpEncoder('client');
      const image = createTestImage();
      await expect(encoder(image, { quality: 101 })).rejects.toThrow(
        RangeError
      );
    });

    it('should reject quality as floating point', async () => {
      const encoder = createWebpEncoder('client');
      const image = createTestImage();
      await expect(encoder(image, { quality: 82.5 })).rejects.toThrow(
        RangeError
      );
    });

    it('should reject NaN quality', async () => {
      const encoder = createWebpEncoder('client');
      const image = createTestImage();
      await expect(encoder(image, { quality: NaN })).rejects.toThrow(
        RangeError
      );
    });

    it('should accept valid quality values', async () => {
      const encoder = createWebpEncoder('client');
      const image = createTestImage();
      const result = await encoder(image, { quality: 90 });
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should provide clear error message for quality out of range', async () => {
      const encoder = createWebpEncoder('client');
      const image = createTestImage();
      try {
        await encoder(image, { quality: 150 });
        throw new Error('Should have thrown');
      } catch (e) {
        const message = (e as Error).message;
        expect(message).toContain('range');
        expect(message).toContain('0');
        expect(message).toContain('100');
      }
    });

    it('should handle empty options object', async () => {
      const encoder = createWebpEncoder('client');
      const image = createTestImage();
      const result = await encoder(image, {});
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle undefined options', async () => {
      const encoder = createWebpEncoder('client');
      const image = createTestImage();
      expect(await encoder(image, undefined)).toBeInstanceOf(Uint8Array);
    });
  });
});

