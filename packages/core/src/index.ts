/**
 * @squoosh-kit/core - Per-feature adapters around Squoosh codecs
 *
 * Main entry point that re-exports all functionality from the individual
 * feature packages. For smaller bundle sizes, import directly from the
 * feature package (e.g., `@squoosh-kit/webp`).
 *
 * Each codec is namespaced to avoid collisions (encode/decode exist in many packages):
 *   import { webp, avif, mozjpeg } from '@squoosh-kit/core';
 *   const result = await webp.encode(imageData, { quality: 80 });
 */

export * as webp from '@squoosh-kit/webp';
export * as resize from '@squoosh-kit/resize';
export * as avif from '@squoosh-kit/avif';
export * as mozjpeg from '@squoosh-kit/mozjpeg';
export * as jxl from '@squoosh-kit/jxl';
export * as oxipng from '@squoosh-kit/oxipng';
export * as imagequant from '@squoosh-kit/imagequant';
export * as png from '@squoosh-kit/png';
export * as qoi from '@squoosh-kit/qoi';
export * as wp2 from '@squoosh-kit/wp2';
export * as hqx from '@squoosh-kit/hqx';
export * as rotate from '@squoosh-kit/rotate';
export * as visdif from '@squoosh-kit/visdif';

// Re-export common types from runtime
export type { ImageInput } from '@squoosh-kit/runtime';
