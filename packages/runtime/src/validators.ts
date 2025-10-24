import type { ImageInput } from './types.js';

export function validateArrayBuffer(
  buffer: unknown
): asserts buffer is ArrayBuffer {
  if (buffer instanceof SharedArrayBuffer) {
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

export function validateResizeOptions(options: unknown): asserts options is {
  width?: number;
  height?: number;
  method?: 'triangular' | 'catrom' | 'mitchell' | 'lanczos3';
  premultiply?: boolean;
  linearRGB?: boolean;
} {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError('options must be an object');
  }

  const opts = options as Record<string, unknown>;

  if (opts.width !== undefined) {
    if (
      typeof opts.width !== 'number' ||
      !Number.isInteger(opts.width) ||
      opts.width <= 0
    ) {
      throw new RangeError(
        `options.width must be a positive integer, got ${opts.width}`
      );
    }
  }

  if (opts.height !== undefined) {
    if (
      typeof opts.height !== 'number' ||
      !Number.isInteger(opts.height) ||
      opts.height <= 0
    ) {
      throw new RangeError(
        `options.height must be a positive integer, got ${opts.height}`
      );
    }
  }

  if (opts.method !== undefined) {
    const validMethods = ['triangular', 'catrom', 'mitchell', 'lanczos3'];
    if (!validMethods.includes(opts.method as string)) {
      throw new TypeError(
        `options.method must be one of: ${validMethods.join(', ')}, got ${opts.method}`
      );
    }
  }

  if (opts.premultiply !== undefined && typeof opts.premultiply !== 'boolean') {
    throw new TypeError(
      `options.premultiply must be boolean, got ${typeof opts.premultiply}`
    );
  }

  if (opts.linearRGB !== undefined && typeof opts.linearRGB !== 'boolean') {
    throw new TypeError(
      `options.linearRGB must be boolean, got ${typeof opts.linearRGB}`
    );
  }
}

export function validateWebpOptions(options: unknown): asserts options is {
  quality?: number;
  lossless?: boolean;
  nearLossless?: boolean;
} {
  if (
    options !== undefined &&
    (typeof options !== 'object' || options === null)
  ) {
    throw new TypeError('options must be an object or undefined');
  }

  if (options === undefined) {
    return;
  }

  const opts = options as Record<string, unknown>;

  if (opts.quality !== undefined) {
    if (
      typeof opts.quality !== 'number' ||
      !Number.isInteger(opts.quality) ||
      opts.quality < 0 ||
      opts.quality > 100
    ) {
      throw new RangeError(
        `options.quality must be an integer between 0 and 100, got ${opts.quality}`
      );
    }
  }

  if (opts.lossless !== undefined && typeof opts.lossless !== 'number') {
    throw new TypeError(
      `options.lossless must be boolean, got ${typeof opts.lossless}`
    );
  }

  if (
    opts.nearLossless !== undefined &&
    typeof opts.nearLossless !== 'boolean'
  ) {
    throw new TypeError(
      `options.nearLossless must be boolean, got ${typeof opts.nearLossless}`
    );
  }
}
