/**
 * Common types shared across squoosh-kit packages.
 */

/**
 * Represents image data that can be processed by squoosh-kit.
 * It can be an `ImageData` object or a plain object with pixel data,
 * width, and height.
 */
export type ImageInput =
  | ImageData
  | { data: Uint8Array | Uint8ClampedArray; width: number; height: number };
