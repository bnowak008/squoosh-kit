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
