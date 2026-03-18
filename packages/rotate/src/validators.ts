import type { RotateOptions } from './types';

export function validateRotateOptions(
  options: unknown
): asserts options is RotateOptions {
  if (options === undefined || options === null) {
    return;
  }

  if (typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }

  const opts = options as Record<string, unknown>;

  if (opts.rotate !== undefined) {
    if (
      opts.rotate !== 0 &&
      opts.rotate !== 90 &&
      opts.rotate !== 180 &&
      opts.rotate !== 270
    ) {
      throw new RangeError(
        `options.rotate must be 0, 90, 180, or 270, got ${opts.rotate}`
      );
    }
  }
}
