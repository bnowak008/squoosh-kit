/**
 * Image resize tests
 */

import { describe, it, expect } from 'bun:test';
import { createResizer } from '../src/index.ts';
import type { ImageInput } from '../src/index.ts';

describe('Resize Factory', () => {
  it('should create a factory function for client mode', () => {
    const resizer = createResizer('client');
    expect(typeof resizer).toBe('function');
  });

  it('should create a factory function for worker mode', () => {
    const resizer = createResizer('worker');
    expect(typeof resizer).toBe('function');
  });
});

describe('ImageData Buffer Handling (Zero-Copy Optimization)', () => {
  it('should accept Uint8ClampedArray input and resize correctly', async () => {
    const clampedData = new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
    ]);
    const resizer = createResizer('client');
    const result = await resizer(
      { data: clampedData, width: 2, height: 2 },
      { width: 1, height: 1 }
    );
    expect(result.data).toBeInstanceOf(Uint8ClampedArray);
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });
});

describe('Input Validation', () => {
  it('should reject null image', async () => {
    const resizer = createResizer('client');
    // @ts-expect-error - we want to test the error case
    await expect(resizer(null, { width: 800 })).rejects.toThrow(TypeError);
  });

  it('should reject undefined image', async () => {
    const resizer = createResizer('client');
    // @ts-expect-error - we want to test the error case
    await expect(resizer(undefined, { width: 800 })).rejects.toThrow(TypeError);
  });

  it('should reject image without data property', async () => {
    const resizer = createResizer('client');
    await expect(
      // @ts-expect-error - we want to test the error case
      resizer({ width: 4, height: 4 }, { width: 2 })
    ).rejects.toThrow(TypeError);
  });

  it('should reject image without width property', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), height: 4 };
    // @ts-expect-error - we want to test the error case
    await expect(resizer(image, { width: 2 })).rejects.toThrow(TypeError);
  });

  it('should reject image without height property', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4 };
    // @ts-expect-error - we want to test the error case
    await expect(resizer(image, { width: 2 })).rejects.toThrow(TypeError);
  });

  it('should reject image data that is not Uint8Array or Uint8ClampedArray', async () => {
    const resizer = createResizer('client');
    const image = {
      data: new Float32Array(64),
      width: 4,
      height: 4,
    };
    // @ts-expect-error - we want to test the error case
    await expect(resizer(image, { width: 2 })).rejects.toThrow(TypeError);
  });

  it('should reject image data that is a regular array', async () => {
    const resizer = createResizer('client');
    const image = { data: Array(64).fill(0), width: 4, height: 4 };
    // @ts-expect-error - we want to test the error case
    await expect(resizer(image, { width: 2 })).rejects.toThrow(TypeError);
  });

  it('should reject image with NaN width', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: NaN, height: 4 };
    await expect(resizer(image, { width: 2 })).rejects.toThrow(RangeError);
  });

  it('should reject image with NaN height', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4, height: NaN };
    await expect(resizer(image, { width: 2 })).rejects.toThrow(RangeError);
  });

  it('should reject image with negative width', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: -4, height: 4 };
    await expect(resizer(image, { width: 2 })).rejects.toThrow(RangeError);
  });

  it('should reject image with negative height', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4, height: -4 };
    await expect(resizer(image, { width: 2 })).rejects.toThrow(RangeError);
  });

  it('should reject image with zero width', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 0, height: 4 };
    await expect(resizer(image, { width: 2 })).rejects.toThrow(RangeError);
  });

  it('should reject image with zero height', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4, height: 0 };
    await expect(resizer(image, { width: 2 })).rejects.toThrow(RangeError);
  });

  it('should reject image with floating point width', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4.5, height: 4 };
    await expect(resizer(image, { width: 2 })).rejects.toThrow(RangeError);
  });

  it('should reject image with floating point height', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4, height: 4.5 };
    await expect(resizer(image, { width: 2 })).rejects.toThrow(RangeError);
  });

  it('should reject image with buffer too small', async () => {
    const resizer = createResizer('client');
    const image = {
      data: new Uint8Array(10),
      width: 100,
      height: 100,
    };
    await expect(resizer(image, { width: 50 })).rejects.toThrow(RangeError);
  });

  it('should provide clear error message for small buffer', async () => {
    const resizer = createResizer('client');
    const image = {
      data: new Uint8Array(10),
      width: 100,
      height: 100,
    };
    try {
      await resizer(image, { width: 50 });
      throw new Error('Should have thrown');
    } catch (e) {
      const message = (e as Error).message;
      expect(message).toContain('too small');
      expect(message).toContain('100x100');
      expect(message).toContain('10');
    }
  });

  describe('ResizeOptions validation', () => {
    const createTestImage = (): ImageInput => {
      const data = new Uint8Array(64);
      for (let i = 0; i < 64; i += 4) {
        data[i] = 255;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }
      return { data, width: 4, height: 4 };
    };

    it('should reject options with NaN width', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { width: NaN })).rejects.toThrow(RangeError);
    });

    it('should reject options with NaN height', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { height: NaN })).rejects.toThrow(RangeError);
    });

    it('should reject options with negative width', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { width: -800 })).rejects.toThrow(RangeError);
    });

    it('should reject options with negative height', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { height: -600 })).rejects.toThrow(
        RangeError
      );
    });

    it('should reject options with zero width', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { width: 0 })).rejects.toThrow(RangeError);
    });

    it('should reject options with zero height', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { height: 0 })).rejects.toThrow(RangeError);
    });

    it('should reject options with floating point width', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { width: 800.5 })).rejects.toThrow(
        RangeError
      );
    });

    it('should reject options with floating point height', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { height: 600.5 })).rejects.toThrow(
        RangeError
      );
    });

    it('should reject invalid resize method', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(
        // @ts-expect-error - we want to test the error case
        resizer(image, { width: 2, method: 'invalid' })
      ).rejects.toThrow(TypeError);
    });

    it('should accept valid resize methods', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      const methods = ['triangular', 'catrom', 'mitchell', 'lanczos3'] as const;

      for (const method of methods) {
        const result = await resizer(image, { width: 2, method });
        expect(result.width).toBe(2);
        expect(result.height).toBe(2);
        expect(result.data).toBeInstanceOf(Uint8ClampedArray);
        expect(result.data.length).toBe(16); // 2x2x4
      }
    });

    it('should reject premultiply as non-boolean', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(
        // @ts-expect-error - we want to test the error case
        resizer(image, { width: 2, premultiply: 1 })
      ).rejects.toThrow(TypeError);
    });

    it('should reject linearRGB as non-boolean', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(
        // @ts-expect-error - we want to test the error case
        resizer(image, { width: 2, linearRGB: 'true' })
      ).rejects.toThrow(TypeError);
    });

    it('should provide clear error message for invalid method', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      try {
        // @ts-expect-error - we want to test the error case
        await resizer(image, { width: 2, method: 'invalid' });
        throw new Error('Should have thrown');
      } catch (e) {
        const message = (e as Error).message;
        expect(message).toContain('method');
        expect(message).toContain('triangular');
        expect(message).toContain('catrom');
        expect(message).toContain('mitchell');
        expect(message).toContain('lanczos3');
      }
    });
  });
});

describe('Edge Cases in Resize Logic', () => {
  it('should handle extreme aspect ratio (very wide) without errors', async () => {
    const resizer = createResizer('client');
    const data = new Uint8Array(1920 * 1 * 4).fill(255);
    const image = { data, width: 1920, height: 1 };
    const result = await resizer(image, { height: 1 });
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBe(1);
  });

  it('should compute aspect-ratio height correctly', async () => {
    const resizer = createResizer('client');
    const data = new Uint8Array(1920 * 1080 * 4).fill(128);
    const image = { data, width: 1920, height: 1080 };
    const result = await resizer(image, { width: 960 });
    expect(result.width).toBe(960);
    expect(result.height).toBe(540); // 1080 * 960 / 1920 = 540
  });
});
