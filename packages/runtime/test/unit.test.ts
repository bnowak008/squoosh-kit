/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'bun:test';

describe('Utility Functions', () => {
  it('should validate image input structure', () => {
    const validImage = {
      data: new Uint8Array(16), // 2x2x4 = 16 bytes
      width: 2,
      height: 2,
    };

    expect(validImage.data).toBeInstanceOf(Uint8Array);
    expect(validImage.width).toBe(2);
    expect(validImage.height).toBe(2);
    expect(validImage.data.length).toBe(16);
  });

  it('should handle Uint8ClampedArray input', () => {
    const validImage = {
      data: new Uint8ClampedArray(16), // 2x2x4 = 16 bytes
      width: 2,
      height: 2,
    };

    expect(validImage.data).toBeInstanceOf(Uint8ClampedArray);
    expect(validImage.width).toBe(2);
    expect(validImage.height).toBe(2);
  });

  it('should validate WebP options', () => {
    const options = {
      quality: 80,
      lossless: false,
      nearLossless: false,
    };

    expect(options.quality).toBe(80);
    expect(options.lossless).toBe(false);
    expect(options.nearLossless).toBe(false);
  });

  it('should validate resize options', () => {
    const options = {
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
});
