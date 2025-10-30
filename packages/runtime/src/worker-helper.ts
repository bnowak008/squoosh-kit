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

    // Node.js/Bun: prefer import.meta.resolve to package export
    if (typeof import.meta.resolve === 'function') {
      try {
        const resolved = import.meta.resolve(
          `${workerConfig.package}/${workerConfig.specifier}`
        );
        return new Worker(resolved, { type: 'module' });
      } catch {
        // Continue to fallbacks below
      }
    }

    // Fallbacks for monorepo/dev without build artifacts
    // 1) Try dist output (if already built)
    const platformExt = isBun() ? '.bun.js' : '.node.mjs';
    const baseName = normalizedName.replace('.js', '');
    const distRelPath = workerConfig.package.includes('resize')
      ? `../../resize/dist/${baseName}.${platformExt.slice(1)}`
      : `../../webp/dist/${baseName}.${platformExt.slice(1)}`;
    try {
      return new Worker(new URL(distRelPath, import.meta.url), {
        type: 'module',
      });
    } catch {
      // 2) Try TypeScript source directly (Bun can transpile TS)
      const srcRelPath = workerConfig.package.includes('resize')
        ? `../../resize/src/${baseName}.ts`
        : `../../webp/src/${baseName}.ts`;
      return new Worker(new URL(srcRelPath, import.meta.url), {
        type: 'module',
      });
    }
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
        worker.removeEventListener('error', handleError);
        worker.removeEventListener('messageerror', handleMessageError);
        resolve(worker);
      }
    };

    const handleError = (event: ErrorEvent) => {
      clearTimeout(timeout);
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      worker.removeEventListener('messageerror', handleMessageError);
      reject(
        new Error(
          `Worker failed to start: ${event?.message || 'Unknown error'}. Worker file: ${workerFilename}`
        )
      );
    };

    const handleMessageError = () => {
      clearTimeout(timeout);
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      worker.removeEventListener('messageerror', handleMessageError);
      reject(
        new Error(
          `Worker message error during initialization. Worker file: ${workerFilename}`
        )
      );
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.addEventListener('messageerror', handleMessageError);
    worker.postMessage({ type: 'worker:ping' });
  });
}
