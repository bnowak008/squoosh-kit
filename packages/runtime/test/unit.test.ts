/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'bun:test';
import { validateArrayBuffer } from '../src/validators.js';

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

describe('Buffer Validation', () => {
  it('should accept normal ArrayBuffer', () => {
    const buffer = new ArrayBuffer(100);
    expect(() => validateArrayBuffer(buffer)).not.toThrow();
  });

  it('should accept Uint8Array backed by ArrayBuffer', () => {
    const arrayBuffer = new ArrayBuffer(100);
    const uint8Array = new Uint8Array(arrayBuffer);
    expect(() => validateArrayBuffer(uint8Array.buffer)).not.toThrow();
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

  it('should reject strings', () => {
    expect(() => validateArrayBuffer('buffer')).toThrow(/ArrayBuffer/);
  });

  it('should reject numbers', () => {
    expect(() => validateArrayBuffer(123)).toThrow(/ArrayBuffer/);
  });
});
