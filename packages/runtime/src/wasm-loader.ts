/**
 * Load WASM binary from various sources with fallback strategies
 *
 * Supports:
 * - Node.js (fs/promises)
 * - Browsers (fetch)
 * - Workers (fetch)
 */
export async function loadWasmBinary(
  relativePath: string
): Promise<ArrayBuffer> {
  try {
    // Strategy 1: Try Node.js fs first (most reliable)
    if (typeof process !== 'undefined' && process.versions?.node) {
      const fsModule = await import('fs/promises');
      const fileUrl = new URL(relativePath, import.meta.url);
      const filePath = fileUrl.pathname;
      const buffer = await fsModule.readFile(filePath);
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
    }
  } catch (e) {
    // Fall through to fetch strategy
  }

  // Strategy 2: Fallback to fetch (works in browsers and workers)
  try {
    const url = new URL(relativePath, import.meta.url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch WASM binary: ${response.status} ${response.statusText}`
      );
    }
    return response.arrayBuffer();
  } catch (error) {
    throw new Error(
      `Failed to load WASM binary from "${relativePath}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load WASM JavaScript module with fallback strategies
 *
 * Strategy 1: Static relative import (works everywhere)
 * Strategy 2: import.meta.resolve (Node.js 22+)
 * Strategy 3: URL-based import (browsers/workers)
 */
export async function loadWasmModule(
  modulePath: string
): Promise<WebAssembly.Module> {
  // Strategy 1: Try direct static import
  try {
    return await import(modulePath);
  } catch (e1) {
    // Continue to next strategy
  }

  // Strategy 2: Try import.meta.resolve (Node.js 22+)
  try {
    const resolvedPath = await import.meta.resolve(modulePath);
    return await import(resolvedPath);
  } catch (e2) {
    // Continue to next strategy
  }

  // Strategy 3: Try URL-based import
  try {
    const url = new URL(modulePath, import.meta.url);
    return await import(url.href);
  } catch (e3) {
    throw new Error(
      `Failed to load WASM module from "${modulePath}". ` +
        `Ensure WASM files are in the expected location and the module can be resolved.`
    );
  }
}
