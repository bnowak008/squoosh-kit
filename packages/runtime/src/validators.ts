import type { ImageInput } from './types.js';

export function validateArrayBuffer(
  buffer: unknown
): asserts buffer is ArrayBuffer {
  // Check if SharedArrayBuffer is defined in the current environment before using it
  if (
    typeof SharedArrayBuffer !== 'undefined' &&
    buffer instanceof SharedArrayBuffer
  ) {
    throw new Error(
      'SharedArrayBuffer is not supported. ' +
        'Use regular ArrayBuffer or Uint8Array instead.'
    );
  }

  if (!(buffer instanceof ArrayBuffer)) {
    throw new TypeError('image.data.buffer must be an ArrayBuffer');
  }
}

export function validateImageInput(
  image: unknown
): asserts image is ImageInput {
  if (!image || typeof image !== 'object') {
    throw new TypeError('image must be an object');
  }

  const imageObj = image as Record<string, unknown>;

  if (!('data' in imageObj)) {
    throw new TypeError('image.data is required');
  }

  const { data } = imageObj;
  if (!(data instanceof Uint8Array || data instanceof Uint8ClampedArray)) {
    throw new TypeError('image.data must be Uint8Array or Uint8ClampedArray');
  }

  if (!('width' in imageObj) || !('height' in imageObj)) {
    throw new TypeError('image.width and image.height are required');
  }

  const { width, height } = imageObj;

  if (typeof width !== 'number' || !Number.isInteger(width) || width <= 0) {
    throw new RangeError(
      `image.width must be a positive integer, got ${width}`
    );
  }

  if (typeof height !== 'number' || !Number.isInteger(height) || height <= 0) {
    throw new RangeError(
      `image.height must be a positive integer, got ${height}`
    );
  }

  const expectedSize = width * height * 4;
  if (data.length < expectedSize) {
    throw new RangeError(
      `image.data too small: ${data.length} bytes, expected at least ${expectedSize} bytes for ${width}x${height} RGBA image`
    );
  }
}
