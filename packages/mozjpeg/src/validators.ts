import type { MozjpegEncodeInputOptions } from './types';

export function validateMozjpegEncodeOptions(
  options: unknown
): asserts options is MozjpegEncodeInputOptions {
  if (options !== undefined && typeof options !== 'object') {
    throw new TypeError('MozJPEG encode options must be an object');
  }

  if (!options) {
    return;
  }

  const opts = options as Record<string, unknown>;

  if (opts.quality !== undefined) {
    if (typeof opts.quality !== 'number') {
      throw new TypeError('quality must be a number');
    }
    if (opts.quality < 0 || opts.quality > 100) {
      throw new RangeError('quality must be between 0 and 100');
    }
  }

  if (opts.smoothing !== undefined) {
    if (typeof opts.smoothing !== 'number') {
      throw new TypeError('smoothing must be a number');
    }
    if (opts.smoothing < 0 || opts.smoothing > 100) {
      throw new RangeError('smoothing must be between 0 and 100');
    }
  }

  if (opts.color_space !== undefined) {
    if (typeof opts.color_space !== 'number') {
      throw new TypeError('color_space must be a number');
    }
  }
}
