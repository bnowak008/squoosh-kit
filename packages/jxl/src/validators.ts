export function validateJxlOptions(
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

  if ('effort' in opts && opts.effort !== undefined) {
    const effort = opts.effort;

    if (typeof effort !== 'number') {
      throw new TypeError('effort must be a number');
    }

    if (!Number.isFinite(effort) || !Number.isInteger(effort)) {
      throw new RangeError('effort must be an integer in the range 1-9');
    }

    if (effort < 1 || effort > 9) {
      throw new RangeError(`effort must be in the range 1-9, got ${effort}`);
    }
  }

  if ('epf' in opts && opts.epf !== undefined) {
    const epf = opts.epf;

    if (typeof epf !== 'number') {
      throw new TypeError('epf must be a number');
    }

    if (!Number.isFinite(epf) || !Number.isInteger(epf)) {
      throw new RangeError('epf must be an integer in the range -1 to 3');
    }

    if (epf < -1 || epf > 3) {
      throw new RangeError(`epf must be in the range -1 to 3, got ${epf}`);
    }
  }

  if ('decodingSpeedTier' in opts && opts.decodingSpeedTier !== undefined) {
    const decodingSpeedTier = opts.decodingSpeedTier;

    if (typeof decodingSpeedTier !== 'number') {
      throw new TypeError('decodingSpeedTier must be a number');
    }

    if (
      !Number.isFinite(decodingSpeedTier) ||
      !Number.isInteger(decodingSpeedTier)
    ) {
      throw new RangeError(
        'decodingSpeedTier must be an integer in the range 0-4'
      );
    }

    if (decodingSpeedTier < 0 || decodingSpeedTier > 4) {
      throw new RangeError(
        `decodingSpeedTier must be in the range 0-4, got ${decodingSpeedTier}`
      );
    }
  }
}
