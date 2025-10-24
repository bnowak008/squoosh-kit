/**
 * Worker helper utilities for creating and managing Web Workers
 *
 * This module provides centralized logic for creating worker instances
 * in different environments (browser, Node.js, Bun) using import.meta.resolve
 * for server-side and package-relative paths for browsers.
 */

import { isBun } from './env';

/**
 * Create a Web Worker for a specific codec
 *
 * In Node.js/Bun environments, uses import.meta.resolve to locate worker files.
 * In browser environments, uses relative paths within node_modules that Vite can resolve.
 *
 * @param workerFilename - The name of the worker file (e.g., 'resize.worker' or 'webp.worker')
 * @returns Worker instance
 * @throws Error if worker creation fails with detailed error message
 */
export function createCodecWorker(workerFilename: string): Worker {
  // Ensure filename has correct format
  const normalizedName = workerFilename.endsWith('.js')
    ? workerFilename
    : `${workerFilename}.js`;

  // Map worker filenames to their package and export
  const workerMap: Record<string, { package: string; specifier: string }> = {
    'resize.worker.js': {
      package: '@squoosh-kit/resize',
      specifier: 'resize.worker.js',
    },
    'webp.worker.js': {
      package: '@squoosh-kit/webp',
      specifier: 'webp.worker.js',
    },
  };

  const workerConfig = workerMap[normalizedName];
  if (!workerConfig) {
    throw new Error(
      `Unknown worker: ${normalizedName}. ` +
        `Supported workers: ${Object.keys(workerMap).join(', ')}`
    );
  }

  try {
    // In browser contexts, use relative paths within the installed packages
    if (typeof window !== 'undefined') {
      const packageName = workerConfig.package.split('/')[1]; // Extract 'resize' or 'webp'
      const workerFile = normalizedName.replace('.js', '.browser.mjs');

      // Try multiple path strategies to support both:
      // 1. Monorepo development structure: ../../{package}/dist/{workerFile}
      // 2. npm installed structure: ../../../{package}/dist/{workerFile}
      const pathStrategies = [
        // First try monorepo structure (when runtime is at packages/runtime/src)
        `../../${packageName}/dist/${workerFile}`,
        // Then try npm structure (when runtime is at node_modules/@squoosh-kit/runtime)
        `../../../node_modules/@squoosh-kit/${packageName}/dist/${workerFile}`,
        // Alternative npm structure for cases where packages are flattened
        `../../../${packageName}/dist/${workerFile}`,
      ];

      let lastError: Error | null = null;

      for (const relPath of pathStrategies) {
        try {
          const workerUrl = new URL(relPath, import.meta.url);
          return new Worker(workerUrl, {
            type: 'module',
          });
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          // Continue to next strategy
        }
      }

      // If all strategies failed, throw the last error
      if (lastError) {
        throw lastError;
      }
      throw new Error(
        `Could not resolve worker ${normalizedName} using any available path strategy`
      );
    }

    // Node.js/Bun: use import.meta.resolve if available
    if (typeof import.meta.resolve === 'function') {
      try {
        const resolved = import.meta.resolve(
          `${workerConfig.package}/${workerConfig.specifier}`
        );
        return new Worker(resolved, { type: 'module' });
      } catch {
        // Fallback if resolve fails - use relative path as last resort
      }
    }

    // Fallback for Bun: use relative path from this file's location
    const platformExt = isBun() ? '.bun.js' : '.node.mjs';
    const baseName = normalizedName.replace('.js', '');
    const relPath = workerConfig.package.includes('resize')
      ? `../../resize/dist/${baseName}.${platformExt.slice(1)}`
      : `../../webp/dist/${baseName}.${platformExt.slice(1)}`;

    return new Worker(new URL(relPath, import.meta.url), { type: 'module' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to create worker from ${normalizedName}: ${errorMessage}. ` +
        `Ensure the @squoosh-kit/resize and @squoosh-kit/webp packages are installed. ` +
        `If you're using Vite, ensure the worker files are not being optimized as dependencies.`
    );
  }
}

/**
 * Create a worker with initialization timeout and ready signal handling
 *
 * This is a higher-level function that creates a worker and waits for it
 * to signal that it's ready to receive messages.
 *
 * @param workerFilename - The name of the worker file
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns Promise that resolves to a ready Worker instance
 * @throws Error if worker creation fails or times out
 */
export function createReadyWorker(
  workerFilename: string,
  timeoutMs: number = 10000
): Promise<Worker> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          `Worker initialization timeout after ${timeoutMs}ms. Worker file: ${workerFilename}`
        )
      );
    }, timeoutMs);

    let worker: Worker;
    try {
      worker = createCodecWorker(workerFilename);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'worker:ready') {
        clearTimeout(timeout);
        worker.removeEventListener('message', handleMessage);
        resolve(worker);
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ type: 'worker:ping' });
  });
}
