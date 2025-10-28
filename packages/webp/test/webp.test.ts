/**
 * WebP encoder tests
 */

import { describe, it, expect } from 'bun:test';
import { validateArrayBuffer } from '@squoosh-kit/runtime';
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

  it('should validate image input structure', () => {
    const image = createTestImage();
    expect(image.data).toBeInstanceOf(Uint8Array);
    expect(image.width).toBe(2);
    expect(image.height).toBe(2);
    expect(image.data.length).toBe(16); // 2x2x4 = 16 bytes
  });
});

describe('ImageData Buffer Handling (Zero-Copy Optimization)', () => {
  it('should handle Uint8Array input', () => {
    const image = createTestImage();
    expect(image.data).toBeInstanceOf(Uint8Array);
    expect(image.data.length).toBe(16);
  });

  it('should create zero-copy view for Uint8ClampedArray', () => {
    const clampedArray = new Uint8ClampedArray(100);
    clampedArray[0] = 255;
    clampedArray[1] = 200;

    // Create a view (zero-copy) like the code does
    const view = new Uint8Array(
      clampedArray.buffer,
      clampedArray.byteOffset,
      clampedArray.length
    );

    // Same underlying buffer, so modifying view affects original
    view[0] = 100;
    expect(clampedArray[0]).toBe(100);

    // And modifying original affects view
    clampedArray[1] = 50;
    expect(view[1]).toBe(50);
  });

  it('should work with Uint8ClampedArray image data', () => {
    // Simulate canvas ImageData which uses Uint8ClampedArray
    const clampedData = new Uint8ClampedArray([
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

    const image: ImageInput = {
      data: clampedData,
      width: 2,
      height: 2,
    };

    expect(image.data).toBeInstanceOf(Uint8ClampedArray);
    expect(image.data.length).toBe(16);
    expect(image.width).toBe(2);
    expect(image.height).toBe(2);
  });
});

describe('Input Validation', () => {
  it('should reject null image', async () => {
    const encoder = createWebpEncoder('client');
    // @ts-expect-error - we want to test the error case
    await expect(encoder(undefined)).rejects.toThrow(TypeError);
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
      console.log(result);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should provide clear error message for quality out of range', async () => {
      const encoder = createWebpEncoder('client');
      const image = createTestImage();
      try {
        await await encoder(image, { quality: 150 });
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
      console.log(result);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle undefined options', async () => {
      const encoder = createWebpEncoder('client');
      const image = createTestImage();
      expect(await encoder(image, undefined)).toBeInstanceOf(Uint8Array);
    });
  });
});

describe('Buffer Validation (Unsafe Type Cast Prevention)', () => {
  it('should accept normal ArrayBuffer', () => {
    const buffer = new ArrayBuffer(100);
    expect(() => validateArrayBuffer(buffer)).not.toThrow();
  });

  it('should accept Uint8Array backed by ArrayBuffer', () => {
    const arrayBuffer = new ArrayBuffer(16);
    const data = new Uint8Array(arrayBuffer);
    expect(() => validateArrayBuffer(data.buffer)).not.toThrow();
  });

  it('should reject SharedArrayBuffer', () => {
    if (typeof SharedArrayBuffer !== 'undefined') {
      const sharedBuffer = new SharedArrayBuffer(100);
      expect(() => validateArrayBuffer(sharedBuffer)).toThrow(
        /SharedArrayBuffer/
      );
    }
  });

  it('should reject null', () => {
    expect(() => validateArrayBuffer(null)).toThrow(/ArrayBuffer/);
  });

  it('should reject undefined', () => {
    expect(() => validateArrayBuffer(undefined)).toThrow(/ArrayBuffer/);
  });

  it('should reject plain objects', () => {
    expect(() => validateArrayBuffer({})).toThrow(/ArrayBuffer/);
  });
});
