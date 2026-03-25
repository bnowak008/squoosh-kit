/**
 * Validators for QOI codec.
 * QOI encode options is an empty interface, so validation is minimal.
 */

export function validateQoiEncodeOptions(
  options: unknown
): asserts options is Record<string, never> | undefined {
  if (options === undefined) {
    return;
  }

  if (typeof options !== 'object' || options === null) {
    throw new TypeError('options must be an object or undefined');
  }
}
