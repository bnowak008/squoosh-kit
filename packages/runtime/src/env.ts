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

/**
 * Create a codec worker in a way that is compatible with all supported environments.
 * @param workerPath - The path or URL to the worker script.
 * @returns A new Worker instance.
 */
export async function createCodecWorker(workerPath: string): Promise<Worker> {
  let resolvedPath: string;
  
  // For relative paths, try to resolve them using import.meta.resolve
  // If that fails, use the path as-is (it might be a file URL or absolute path)
  try {
    resolvedPath = await import.meta.resolve(workerPath);
  } catch (error) {
    // If resolution fails, use the path as-is
    resolvedPath = workerPath;
  }

  if (isBrowser()) {
    return new Worker(resolvedPath, { type: 'module' });
  } else if (isBun() || isNode()) {
    return new Worker(resolvedPath);
  }

  throw new Error('Unsupported environment for worker creation.');
}
