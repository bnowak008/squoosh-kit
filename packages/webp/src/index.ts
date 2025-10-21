/**
 * @squoosh-lite/webp - WebP encoding for Squoosh Lite
 *
 * This package re-exports WebP functionality from @squoosh-lite/core
 * for cleaner imports.
 */

export {
  encode,
  createWebpEncoder,
} from '@squoosh-lite/core/webp';

export type { WebpOptions } from '@squoosh-lite/core/webp';
