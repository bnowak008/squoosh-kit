/**
 * Common types shared across squoosh-kit packages.
 */

export type ImageInput =
  | ImageData
  | { data: Uint8Array | Uint8ClampedArray; width: number; height: number };
