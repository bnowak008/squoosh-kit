/**
 * Runtime environment detection utilities
 */

/**
 * Detect if running in a Web Worker context
 */
export function isWorker(): boolean {
  return (
    typeof self !== 'undefined' &&
    typeof (globalThis as unknown as { DedicatedWorkerGlobalScope?: unknown })
      .DedicatedWorkerGlobalScope !== 'undefined'
  );
}

/**
 * Detect if running in a browser context
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Detect if running in Bun
 */
export function isBun(): boolean {
  return typeof Bun !== 'undefined';
}

/**
 * Detect if running in Node.js
 */
export function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
}

/**
 * Check if ImageData is available in the current environment
 */
export function hasImageData(): boolean {
  return typeof ImageData !== 'undefined';
}
