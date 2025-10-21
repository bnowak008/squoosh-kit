/**
 * @squoosh-lite/core - Per-feature adapters around Squoosh codecs
 *
 * Main entry point with convenience re-exports.
 * For production use, prefer importing from specific subpaths:
 * - @squoosh-lite/core/webp
 * - @squoosh-lite/core/resize
 */

// Re-export WebP
export {
  encode as webpEncode,
  createWebpEncoder,
} from './features/webp/index.ts';
export type { WebpOptions } from './features/webp/index.ts';

// Re-export Resize
export { resize, createResizer } from './features/resize/index.ts';
export type { ResizeOptions } from './features/resize/index.ts';

// Re-export common types
export type { ImageInput } from './runtime/worker-bridge.ts';
