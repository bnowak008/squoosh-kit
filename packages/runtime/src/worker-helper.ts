/**
 * Worker helper utilities for creating and managing Web Workers
 * 
 * This module provides centralized logic for locating and creating worker files
 * in different environments (development, npm package, bundled, etc.)
 */

/**
 * Get the URL for a worker file
 * 
 * This helper abstracts away the complexity of locating worker files
 * in different environments (development, npm package, bundled, etc.)
 * 
 * @param workerFilename - The name of the worker file (with or without .js extension)
 * @returns URL object pointing to the worker file
 */
export function getWorkerURL(workerFilename: string): URL {
  // Ensure filename has correct format
  const normalizedName = workerFilename.endsWith('.js') 
    ? workerFilename 
    : `${workerFilename}.js`;
  
  // In packaged/built code, worker is in same directory as this module
  return new URL(normalizedName, import.meta.url);
}

/**
 * Create a Web Worker for a specific codec
 * 
 * Handles environment-specific worker creation logic and provides
 * clear error messages when worker creation fails.
 * 
 * @param workerFilename - The name of the worker file (e.g., 'resize.worker' or 'webp.worker')
 * @returns Worker instance
 * @throws Error if worker creation fails with detailed error message
 */
export function createCodecWorker(workerFilename: string): Worker {
  const workerURL = getWorkerURL(workerFilename);
  
  try {
    return new Worker(workerURL, { type: 'module' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to create worker from ${workerURL}: ${errorMessage}. ` +
      `Ensure the worker file exists at the expected location. ` +
      `Expected worker file: ${workerFilename}${workerFilename.endsWith('.js') ? '' : '.js'}`
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
export function createReadyWorker(workerFilename: string, timeoutMs: number = 10000): Promise<Worker> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Worker initialization timeout after ${timeoutMs}ms. Worker file: ${workerFilename}`));
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
