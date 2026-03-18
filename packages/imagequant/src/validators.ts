import type { ImagequantOptions } from './types';

export function validateImagequantOptions(
  options: unknown
): asserts options is ImagequantOptions | undefined {
  if (options === undefined) {
    return;
  }

  if (typeof options !== 'object' || options === null) {
    throw new TypeError('options must be an object or undefined');
  }

  const opts = options as Record<string, unknown>;

  if ('numColors' in opts && opts.numColors !== undefined) {
    const numColors = opts.numColors;

    if (Number.isNaN(numColors)) {
      throw new RangeError(
        'numColors must be a valid integer in the range 2-256, got NaN'
      );
    }

    if (typeof numColors !== 'number') {
      throw new TypeError('numColors must be a number');
    }

    if (!Number.isFinite(numColors) || !Number.isInteger(numColors)) {
      throw new RangeError(
        'numColors must be an integer in the range 2-256, got floating point'
      );
    }

    if (numColors < 2 || numColors > 256) {
      throw new RangeError(
        `numColors must be in the range 2-256, got ${numColors}`
      );
    }
  }

  if ('dither' in opts && opts.dither !== undefined) {
    const dither = opts.dither;

    if (Number.isNaN(dither)) {
      throw new RangeError(
        'dither must be a valid number in the range 0-1, got NaN'
      );
    }

    if (typeof dither !== 'number') {
      throw new TypeError('dither must be a number');
    }

    if (!Number.isFinite(dither)) {
      throw new RangeError('dither must be a finite number in the range 0-1');
    }

    if (dither < 0 || dither > 1) {
      throw new RangeError(`dither must be in the range 0-1, got ${dither}`);
    }
  }
}
