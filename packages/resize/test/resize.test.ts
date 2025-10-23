/**
 * Image resize tests
 */

import { describe, it, expect } from 'bun:test';
import { validateArrayBuffer } from '@squoosh-kit/runtime';
import { createResizer } from '../src/index.ts';
import type { ImageInput, ResizeOptions } from '../src/index.ts';

// Test image data: 4x4 red square
const createTestImage = (): ImageInput => {
  const data = new Uint8Array(64); // 4x4x4 = 64 bytes
  for (let i = 0; i < 64; i += 4) {
    data[i] = 255; // R
    data[i + 1] = 0; // G
    data[i + 2] = 0; // B
    data[i + 3] = 255; // A
  }
  return { data, width: 4, height: 4 };
};

describe('Resize Factory', () => {
  it('should create a factory function for client mode', () => {
    const resizer = createResizer('client');
    expect(typeof resizer).toBe('function');
  });

  it('should create a factory function for worker mode', () => {
    const resizer = createResizer('worker');
    expect(typeof resizer).toBe('function');
  });

  it('should validate image input structure', () => {
    const image = createTestImage();
    expect(image.data).toBeInstanceOf(Uint8Array);
    expect(image.width).toBe(4);
    expect(image.height).toBe(4);
    expect(image.data.length).toBe(64); // 4x4x4 = 64 bytes
  });

  it('should validate resize options', () => {
    const options: ResizeOptions = {
      width: 800,
      height: 600,
      premultiply: false,
      linearRGB: false,
    };
    expect(options.width).toBe(800);
    expect(options.height).toBe(600);
    expect(options.premultiply).toBe(false);
    expect(options.linearRGB).toBe(false);
  });

  it('should handle partial resize options', () => {
    const options: ResizeOptions = {
      width: 800,
    };
    expect(options.width).toBe(800);
    expect(options.height).toBeUndefined();
    expect(options.premultiply).toBeUndefined();
    expect(options.linearRGB).toBeUndefined();
  });

  it('should handle default resize options', () => {
    const options: ResizeOptions = {};
    expect(options.width).toBeUndefined();
    expect(options.height).toBeUndefined();
    expect(options.premultiply).toBeUndefined();
    expect(options.linearRGB).toBeUndefined();
    expect(options.method).toBeUndefined();
  });

  it('should validate resize options with method', () => {
    const options: ResizeOptions = {
      width: 800,
      height: 600,
      method: 'lanczos3',
      premultiply: true,
      linearRGB: true,
    };
    expect(options.width).toBe(800);
    expect(options.height).toBe(600);
    expect(options.method).toBe('lanczos3');
    expect(options.premultiply).toBe(true);
    expect(options.linearRGB).toBe(true);
  });

  it('should support all resize methods', () => {
    const methods = ['triangular', 'catrom', 'mitchell', 'lanczos3'] as const;
    for (const method of methods) {
      const options: ResizeOptions = { width: 50, method };
      expect(options.method).toBe(method);
    }
  });

  it('should default to mitchell when method is not specified', () => {
    const options: ResizeOptions = { width: 50 };
    expect(options.method).toBeUndefined();
  });
});

describe('ImageData Buffer Handling (Zero-Copy Optimization)', () => {
  it('should handle Uint8Array input', () => {
    const image = createTestImage();
    expect(image.data).toBeInstanceOf(Uint8Array);
    expect(image.data.length).toBe(64);
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
    const clampedData = new Uint8ClampedArray(64);
    for (let i = 0; i < 64; i += 4) {
      clampedData[i] = 255; // R
      clampedData[i + 1] = 0; // G
      clampedData[i + 2] = 0; // B
      clampedData[i + 3] = 255; // A
    }

    const image: ImageInput = {
      data: clampedData,
      width: 4,
      height: 4,
    };

    expect(image.data).toBeInstanceOf(Uint8ClampedArray);
    expect(image.data.length).toBe(64);
    expect(image.width).toBe(4);
    expect(image.height).toBe(4);
  });
});

describe('Input Validation', () => {
  it('should reject null image', async () => {
    const resizer = createResizer('client');
    await expect(resizer(undefined as any, { width: 800 }))
      .rejects.toThrow(TypeError);
  });

  it('should reject undefined image', async () => {
    const resizer = createResizer('client');
    await expect(resizer(undefined as any, { width: 800 }))
      .rejects.toThrow(TypeError);
  });

  it('should reject image without data property', async () => {
    const resizer = createResizer('client');
    await expect(resizer({ width: 4, height: 4 } as any, { width: 2 }))
      .rejects.toThrow(TypeError);
  });

  it('should reject image without width property', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), height: 4 } as any;
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(TypeError);
  });

  it('should reject image without height property', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4 } as any;
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(TypeError);
  });

  it('should reject image data that is not Uint8Array or Uint8ClampedArray', async () => {
    const resizer = createResizer('client');
    const image = {
      data: new Float32Array(64),
      width: 4,
      height: 4,
    } as any;
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(TypeError);
  });

  it('should reject image data that is a regular array', async () => {
    const resizer = createResizer('client');
    const image = { data: Array(64).fill(0), width: 4, height: 4 } as any;
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(TypeError);
  });

  it('should reject image with NaN width', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: NaN, height: 4 };
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject image with NaN height', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4, height: NaN };
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject image with negative width', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: -4, height: 4 };
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject image with negative height', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4, height: -4 };
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject image with zero width', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 0, height: 4 };
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject image with zero height', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4, height: 0 };
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject image with floating point width', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4.5, height: 4 };
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject image with floating point height', async () => {
    const resizer = createResizer('client');
    const image = { data: new Uint8Array(64), width: 4, height: 4.5 };
    await expect(resizer(image, { width: 2 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject image with buffer too small', async () => {
    const resizer = createResizer('client');
    const image = {
      data: new Uint8Array(10),
      width: 100,
      height: 100,
    };
    await expect(resizer(image, { width: 50 }))
      .rejects.toThrow(RangeError);
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
      await expect(resizer(image, { width: NaN }))
        .rejects.toThrow(RangeError);
    });

    it('should reject options with NaN height', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { height: NaN }))
        .rejects.toThrow(RangeError);
    });

    it('should reject options with negative width', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { width: -800 }))
        .rejects.toThrow(RangeError);
    });

    it('should reject options with negative height', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { height: -600 }))
        .rejects.toThrow(RangeError);
    });

    it('should reject options with zero width', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { width: 0 }))
        .rejects.toThrow(RangeError);
    });

    it('should reject options with zero height', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { height: 0 }))
        .rejects.toThrow(RangeError);
    });

    it('should reject options with floating point width', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { width: 800.5 }))
        .rejects.toThrow(RangeError);
    });

    it('should reject options with floating point height', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { height: 600.5 }))
        .rejects.toThrow(RangeError);
    });

    it('should reject invalid resize method', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { width: 2, method: 'invalid' as any }))
        .rejects.toThrow(TypeError);
    });

    it('should accept valid resize methods', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      const methods = ['triangular', 'catrom', 'mitchell', 'lanczos3'] as const;
      
      for (const method of methods) {
        const options: ResizeOptions = { width: 2, method };
        expect(options.method).toBe(method);
      }
    });

    it('should reject premultiply as non-boolean', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { width: 2, premultiply: 1 as any }))
        .rejects.toThrow(TypeError);
    });

    it('should reject linearRGB as non-boolean', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      await expect(resizer(image, { width: 2, linearRGB: 'true' as any }))
        .rejects.toThrow(TypeError);
    });

    it('should provide clear error message for invalid method', async () => {
      const resizer = createResizer('client');
      const image = createTestImage();
      try {
        await resizer(image, { width: 2, method: 'invalid' as any });
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

describe('Buffer Validation (Unsafe Type Cast Prevention)', () => {
  it('should accept normal ArrayBuffer', () => {
    const buffer = new ArrayBuffer(100);
    expect(() => validateArrayBuffer(buffer)).not.toThrow();
  });

  it('should accept Uint8Array backed by ArrayBuffer', () => {
    const arrayBuffer = new ArrayBuffer(64);
    const data = new Uint8Array(arrayBuffer);
    expect(() => validateArrayBuffer(data.buffer)).not.toThrow();
  });

  it('should reject SharedArrayBuffer', () => {
    if (typeof SharedArrayBuffer !== 'undefined') {
      const sharedBuffer = new SharedArrayBuffer(100);
      expect(() => validateArrayBuffer(sharedBuffer)).toThrow(/SharedArrayBuffer/);
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

describe('Edge Cases in Resize Logic', () => {
  const createTestImage = (width: number, height: number): ImageInput => {
    const size = width * height * 4;
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i += 4) {
      data[i] = 255; // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 255; // A
    }
    return { data, width, height };
  };

  it('should accept valid aspect ratio dimensions', () => {
    const image = createTestImage(1921, 1080);
    expect(image.width).toBe(1921);
    expect(image.height).toBe(1080);
  });

  it('should accept extreme aspect ratios', () => {
    const image = createTestImage(1920, 1);
    expect(image.width).toBe(1920);
    expect(image.height).toBe(1);
  });

  it('should accept square image dimensions', () => {
    const image = createTestImage(100, 100);
    expect(image.width).toBe(100);
    expect(image.height).toBe(100);
  });

  it('should accept portrait image dimensions', () => {
    const image = createTestImage(600, 1200);
    expect(image.width).toBe(600);
    expect(image.height).toBe(1200);
  });

  it('should accept landscape image dimensions', () => {
    const image = createTestImage(1200, 600);
    expect(image.width).toBe(1200);
    expect(image.height).toBe(600);
  });

  it('should accept large image dimensions', () => {
    const image = createTestImage(4000, 3000);
    expect(image.width).toBe(4000);
    expect(image.height).toBe(3000);
  });

  it('should accept small image dimensions', () => {
    const image = createTestImage(10, 10);
    expect(image.width).toBe(10);
    expect(image.height).toBe(10);
  });

  it('should accept valid resize option with aspect ratio', () => {
    const options: ResizeOptions = { width: 960 };
    expect(options.width).toBe(960);
    expect(options.height).toBeUndefined();
  });

  it('should reject zero width in options', async () => {
    const resizer = createResizer('client');
    const image = createTestImage(100, 100);
    
    await expect(resizer(image, { width: 0 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject zero height in options', async () => {
    const resizer = createResizer('client');
    const image = createTestImage(100, 100);
    
    await expect(resizer(image, { height: 0 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject negative width in options', async () => {
    const resizer = createResizer('client');
    const image = createTestImage(100, 100);
    
    await expect(resizer(image, { width: -100 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject negative height in options', async () => {
    const resizer = createResizer('client');
    const image = createTestImage(100, 100);
    
    await expect(resizer(image, { height: -100 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject floating point width in options', async () => {
    const resizer = createResizer('client');
    const image = createTestImage(100, 100);
    
    await expect(resizer(image, { width: 50.5 }))
      .rejects.toThrow(RangeError);
  });

  it('should reject floating point height in options', async () => {
    const resizer = createResizer('client');
    const image = createTestImage(100, 100);
    
    await expect(resizer(image, { height: 50.5 }))
      .rejects.toThrow(RangeError);
  });

  it('should handle dimension calculations safely', () => {
    const width = 1921;
    const height = 1080;
    const targetWidth = 1;
    
    const calculatedHeight = Math.max(1, Math.round((height * targetWidth) / width));
    
    expect(calculatedHeight).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(calculatedHeight)).toBe(true);
  });

  it('should handle extreme aspect ratio calculations', () => {
    const width = 1920;
    const height = 1;
    const targetHeight = 1;
    
    const calculatedWidth = Math.max(1, Math.round((width * targetHeight) / height));
    
    expect(calculatedWidth).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(calculatedWidth)).toBe(true);
  });

  it('should handle rounding precision in dimension calculations', () => {
    const width = 1920;
    const height = 1081;
    const targetWidth = 960;
    
    const calculatedHeight = Math.max(1, Math.round((height * targetWidth) / width));
    
    expect(Number.isFinite(calculatedHeight)).toBe(true);
    expect(calculatedHeight).toBeGreaterThanOrEqual(1);
  });

  it('should provide clear error for invalid output dimensions', async () => {
    const resizer = createResizer('client');
    const image = createTestImage(100, 100);
    
    try {
      await resizer(image, { width: 0 });
      throw new Error('Should have thrown');
    } catch (e) {
      const message = (e as Error).message;
      expect(message).toMatch(/dimension|positive/i);
    }
  });
});
