/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'bun:test';
import { validateArrayBuffer } from '../src/validators.js';

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

  it('should reject strings', () => {
    expect(() => validateArrayBuffer('buffer')).toThrow(/ArrayBuffer/);
  });

  it('should reject numbers', () => {
    expect(() => validateArrayBuffer(123)).toThrow(/ArrayBuffer/);
  });
});
