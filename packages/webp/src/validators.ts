export function validateWebpOptions(
  options: unknown
): asserts options is Record<string, unknown> | undefined {
  if (options === undefined) {
    return;
  }

  if (typeof options !== 'object' || options === null) {
    throw new TypeError('options must be an object or undefined');
  }

  const opts = options as Record<string, unknown>;

  if ('quality' in opts && opts.quality !== undefined) {
    const quality = opts.quality;

    if (Number.isNaN(quality)) {
      throw new RangeError(
        'quality must be a valid number in the range 0-100, got NaN'
      );
    }

    if (typeof quality !== 'number') {
      throw new TypeError('quality must be a number');
    }

    if (!Number.isInteger(quality)) {
      throw new RangeError(
        'quality must be an integer in the range 0-100, got floating point'
      );
    }

    if (quality < 0 || quality > 100) {
      throw new RangeError(
        `quality must be in the range 0-100, got ${quality}`
      );
    }
  }
}
