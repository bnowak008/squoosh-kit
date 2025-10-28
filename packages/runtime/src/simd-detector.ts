/**
 * SIMD (Single Instruction Multiple Data) detection for WebAssembly
 *
 * SIMD support allows WebAssembly modules to perform vectorized operations,
 * significantly improving performance for operations like image encoding.
 * Some browsers and runtimes don't support SIMD yet, so we need to detect it.
 */

import { simd } from 'wasm-feature-detect';

let simdSupported: boolean | null = null;
let simdDetectionPromise: Promise<boolean> | null = null;

/**
 * Detects if WebAssembly SIMD is supported in the current environment
 * @returns Promise<boolean> - true if SIMD is supported, false otherwise
 */
export async function detectSimd(): Promise<boolean> {
  // Return cached result if already detected
  if (simdSupported !== null) {
    return simdSupported;
  }

  // Return existing detection promise if detection is in progress
  if (simdDetectionPromise) {
    return simdDetectionPromise;
  }

  // Perform SIMD detection
  simdDetectionPromise = (async () => {
    try {
      simdSupported = await simd();
      return simdSupported;
    } catch (error) {
      // If detection fails, assume SIMD is not supported
      simdSupported = false;
      console.warn(
        'SIMD detection failed, falling back to standard WASM modules:',
        error
      );
      return false;
    }
  })();

  return simdDetectionPromise;
}

/**
 * Reset SIMD detection cache (useful for testing)
 */
export function resetSimdCache(): void {
  simdSupported = null;
  simdDetectionPromise = null;
}
