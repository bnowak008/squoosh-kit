/**
 * Integration tests for the Resize package
 */
import { describe, it, expect } from 'bun:test';
import { createResizer, type ImageInput } from '../src/';

const createTestImage = (width: number, height: number): ImageInput => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255; // R
    data[i + 1] = 0; // G
    data[i + 2] = 0; // B
    data[i + 3] = 255; // A
  }
  return { data, width, height };
};

describe('Resize Integration Tests', () => {
  it('should correctly resize an image in client mode', async () => {
    const resizer = await createResizer('client');
    const image = createTestImage(10, 10);
    const resizedImage = await resizer.resize(
      new AbortController().signal,
      image,
      { width: 5, height: 5 }
    );

    expect(resizedImage.width).toBe(5);
    expect(resizedImage.height).toBe(5);
    expect(resizedImage.data.length).toBe(5 * 5 * 4);
  });

  it('should correctly resize an image in worker mode', async () => {
    const resizer = await createResizer('worker');
    const image = createTestImage(20, 20);
    const resizedImage = await resizer.resize(
      new AbortController().signal,
      image,
      { width: 8, height: 12 }
    );

    expect(resizedImage.width).toBe(8);
    expect(resizedImage.height).toBe(12);
    expect(resizedImage.data.length).toBe(8 * 12 * 4);
  });
});
