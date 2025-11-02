import type { AvifEncodeInputOptions } from './types';

export function validateAvifEncodeOptions(
  options: unknown
): asserts options is AvifEncodeInputOptions {
  if (options !== undefined && typeof options !== 'object') {
    throw new TypeError('AVIF encode options must be an object');
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

  if (opts.qualityAlpha !== undefined) {
    if (typeof opts.qualityAlpha !== 'number') {
      throw new TypeError('qualityAlpha must be a number');
    }
    if (opts.qualityAlpha < 0 || opts.qualityAlpha > 100) {
      throw new RangeError('qualityAlpha must be between 0 and 100');
    }
  }

  if (opts.speed !== undefined) {
    if (typeof opts.speed !== 'number') {
      throw new TypeError('speed must be a number');
    }
    if (opts.speed < 0 || opts.speed > 10) {
      throw new RangeError('speed must be between 0 and 10');
    }
  }

  if (opts.tune !== undefined) {
    if (typeof opts.tune !== 'number') {
      throw new TypeError('tune must be a number');
    }
  }
}
