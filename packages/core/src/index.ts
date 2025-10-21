/**
 * @squoosh-kit/core - Per-feature adapters around Squoosh codecs
 *
 * Main entry point that re-exports all functionality from the individual
 * feature packages. For smaller bundle sizes, import directly from the
 * feature package (e.g., `@squoosh-kit/webp`).
 */

// Re-export WebP functionality
export * from '@squoosh-kit/webp';

// Re-export Resize functionality
export * from '@squoosh-kit/resize';

// Re-export common types from runtime
export type { ImageInput } from '@squoosh-kit/runtime';
