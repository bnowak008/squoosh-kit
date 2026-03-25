import { validateImageInput } from '@squoosh-kit/runtime';
import type { ImageInput } from '@squoosh-kit/runtime';
import type { OxipngOptions } from './types';

export { validateImageInput };

export function validateOxipngOptions(
  options: unknown
): asserts options is OxipngOptions | undefined {
  if (options === undefined) {
    return;
  }

  if (typeof options !== 'object' || options === null) {
    throw new TypeError('options must be an object or undefined');
  }

  const opts = options as Record<string, unknown>;

  if ('level' in opts && opts.level !== undefined) {
    const level = opts.level;

    if (typeof level !== 'number') {
      throw new TypeError('level must be a number');
    }

    if (Number.isNaN(level) || !Number.isFinite(level)) {
      throw new RangeError('level must be a valid number');
    }

    if (!Number.isInteger(level)) {
      throw new RangeError('level must be an integer');
    }

    if (level < 0 || level > 6) {
      throw new RangeError(`level must be in the range 0-6, got ${level}`);
    }
  }

  if ('interlace' in opts && opts.interlace !== undefined) {
    if (typeof opts.interlace !== 'boolean') {
      throw new TypeError('interlace must be a boolean');
    }
  }
}

export function validateOxipngInput(
  image: ImageInput,
  options?: unknown
): void {
  validateImageInput(image);
  validateOxipngOptions(options);
}
