/**
 * @squoosh-lite/core - Shared runtime utilities for Squoosh Lite packages
 *
 * This package provides shared runtime utilities used by codec packages.
 * For codec functionality, use the specific packages:
 * - @squoosh-lite/webp for WebP encoding
 * - @squoosh-lite/resize for image resizing
 */

// Re-export shared runtime utilities
export { callWorker } from './runtime/worker-call.ts';
export type {
  WorkerRequest,
  WorkerResponse,
} from './runtime/worker-call.ts';

export {
  isWorker,
  isBrowser,
  isBun,
  isNode,
  hasImageData,
} from './runtime/env.ts';

// Re-export common types
export type { ImageInput, BridgeMode } from './runtime/types.ts';
