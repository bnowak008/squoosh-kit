import type { HqxOptions } from './types';

export function validateHqxOptions(
  options: unknown
): asserts options is HqxOptions {
  if (options === undefined || options === null) {
    return;
  }

  if (typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }

  const opts = options as Record<string, unknown>;

  if (opts.factor !== undefined) {
    if (opts.factor !== 2 && opts.factor !== 3 && opts.factor !== 4) {
      throw new RangeError(
        `options.factor must be 2, 3, or 4, got ${opts.factor}`
      );
    }
  }
}
