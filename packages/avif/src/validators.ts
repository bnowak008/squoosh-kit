export function validateAvifOptions(
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

  if ('qualityAlpha' in opts && opts.qualityAlpha !== undefined) {
    const qualityAlpha = opts.qualityAlpha;

    if (typeof qualityAlpha !== 'number') {
      throw new TypeError('qualityAlpha must be a number');
    }

    if (Number.isNaN(qualityAlpha)) {
      throw new RangeError('qualityAlpha must be a valid number');
    }

    // qualityAlpha can be -1 (use quality) or 0-100
    if (Number.isFinite(qualityAlpha) && qualityAlpha !== -1) {
      if (!Number.isInteger(qualityAlpha)) {
        throw new RangeError(
          'qualityAlpha must be an integer in the range 0-100 or -1'
        );
      }

      if (qualityAlpha < 0 || qualityAlpha > 100) {
        throw new RangeError(
          `qualityAlpha must be in the range 0-100 or -1, got ${qualityAlpha}`
        );
      }
    }
  }

  if ('speed' in opts && opts.speed !== undefined) {
    const speed = opts.speed;

    if (typeof speed !== 'number') {
      throw new TypeError('speed must be a number');
    }

    if (Number.isNaN(speed)) {
      throw new RangeError('speed must be a valid number');
    }

    if (!Number.isFinite(speed) || !Number.isInteger(speed)) {
      throw new RangeError('speed must be an integer in the range 0-10');
    }

    if (speed < 0 || speed > 10) {
      throw new RangeError(`speed must be in the range 0-10, got ${speed}`);
    }
  }

  if ('denoiseLevel' in opts && opts.denoiseLevel !== undefined) {
    const denoiseLevel = opts.denoiseLevel;

    if (typeof denoiseLevel !== 'number') {
      throw new TypeError('denoiseLevel must be a number');
    }

    if (Number.isNaN(denoiseLevel)) {
      throw new RangeError('denoiseLevel must be a valid number');
    }

    if (!Number.isFinite(denoiseLevel) || !Number.isInteger(denoiseLevel)) {
      throw new RangeError('denoiseLevel must be an integer in the range 0-50');
    }

    if (denoiseLevel < 0 || denoiseLevel > 50) {
      throw new RangeError(
        `denoiseLevel must be in the range 0-50, got ${denoiseLevel}`
      );
    }
  }
}
