import type { JxlEncodeInputOptions } from './types';

export function validateJxlEncodeOptions(
  options: unknown
): asserts options is JxlEncodeInputOptions {
  if (options !== undefined && typeof options !== 'object')
    throw new TypeError('JXL options must be an object');
  if (!options) return;

  const opts = options as Record<string, unknown>;
  if (
    opts.quality !== undefined &&
    (typeof opts.quality !== 'number' || opts.quality < 0 || opts.quality > 100)
  )
    throw new RangeError('quality must be 0-100');
  if (
    opts.effort !== undefined &&
    (typeof opts.effort !== 'number' || opts.effort < 3 || opts.effort > 9)
  )
    throw new RangeError('effort must be 3-9');
}
