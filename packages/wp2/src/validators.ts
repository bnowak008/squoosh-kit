export function validateWp2Options(
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

    if (!Number.isFinite(quality) || !Number.isInteger(quality)) {
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

  if ('alpha_quality' in opts && opts.alpha_quality !== undefined) {
    const alphaQuality = opts.alpha_quality;

    if (Number.isNaN(alphaQuality)) {
      throw new RangeError(
        'alpha_quality must be a valid number in the range 0-100, got NaN'
      );
    }

    if (typeof alphaQuality !== 'number') {
      throw new TypeError('alpha_quality must be a number');
    }

    if (!Number.isFinite(alphaQuality) || !Number.isInteger(alphaQuality)) {
      throw new RangeError(
        'alpha_quality must be an integer in the range 0-100, got floating point'
      );
    }

    if (alphaQuality < 0 || alphaQuality > 100) {
      throw new RangeError(
        `alpha_quality must be in the range 0-100, got ${alphaQuality}`
      );
    }
  }

  if ('effort' in opts && opts.effort !== undefined) {
    const effort = opts.effort;

    if (Number.isNaN(effort)) {
      throw new RangeError(
        'effort must be a valid number in the range 0-9, got NaN'
      );
    }

    if (typeof effort !== 'number') {
      throw new TypeError('effort must be a number');
    }

    if (!Number.isFinite(effort) || !Number.isInteger(effort)) {
      throw new RangeError(
        'effort must be an integer in the range 0-9, got floating point'
      );
    }

    if (effort < 0 || effort > 9) {
      throw new RangeError(`effort must be in the range 0-9, got ${effort}`);
    }
  }

  if ('pass' in opts && opts.pass !== undefined) {
    const pass = opts.pass;

    if (Number.isNaN(pass)) {
      throw new RangeError(
        'pass must be a valid number in the range 1-10, got NaN'
      );
    }

    if (typeof pass !== 'number') {
      throw new TypeError('pass must be a number');
    }

    if (!Number.isFinite(pass) || !Number.isInteger(pass)) {
      throw new RangeError(
        'pass must be an integer in the range 1-10, got floating point'
      );
    }

    if (pass < 1 || pass > 10) {
      throw new RangeError(`pass must be in the range 1-10, got ${pass}`);
    }
  }

  if ('sns' in opts && opts.sns !== undefined) {
    const sns = opts.sns;

    if (Number.isNaN(sns)) {
      throw new RangeError(
        'sns must be a valid number in the range 0-100, got NaN'
      );
    }

    if (typeof sns !== 'number') {
      throw new TypeError('sns must be a number');
    }

    if (!Number.isFinite(sns) || !Number.isInteger(sns)) {
      throw new RangeError(
        'sns must be an integer in the range 0-100, got floating point'
      );
    }

    if (sns < 0 || sns > 100) {
      throw new RangeError(`sns must be in the range 0-100, got ${sns}`);
    }
  }
}
