/**
 * Integration tests for the WebP package
 */
import { describe, it, expect } from 'bun:test';
import { createWebpEncoder, type ImageInput } from '../src/';

const createTestImage = (width: number, height: number): ImageInput => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0; // R
    data[i + 1] = 255; // G
    data[i + 2] = 0; // B
    data[i + 3] = 255; // A
  }
  return { data, width, height };
};

describe('WebP Integration Tests', () => {
  it('should correctly encode an image to WebP in client mode', async () => {
    const image = createTestImage(16, 16);
    const encoder = createWebpEncoder('client');
    const encodedImage = await encoder(image, { quality: 90 });

    expect(encodedImage).toBeInstanceOf(Uint8Array);
    expect(encodedImage.length).toBeGreaterThan(0);
    // A simple check for the WebP RIFF header
    const header = new TextDecoder().decode(encodedImage.slice(0, 4));
    expect(header).toBe('RIFF');
  });

  it('should correctly encode an image to WebP in worker mode', async () => {
    const image = createTestImage(16, 16);
    const encoder = createWebpEncoder('worker');
    const encodedImage = await encoder(image, { quality: 90 });

    expect(encodedImage).toBeInstanceOf(Uint8Array);
    expect(encodedImage.length).toBeGreaterThan(0);
    // A simple check for the WebP RIFF header
    const header = new TextDecoder().decode(encodedImage.slice(0, 4));
    expect(header).toBe('RIFF');
  }, 15000);
});
