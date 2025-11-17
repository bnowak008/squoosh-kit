/**
 * Load WASM binary from various sources with fallback strategies
 *
 * Supports:
 * - Node.js (fs/promises)
 * - Browsers (fetch)
 * - Workers (fetch)
 */
export async function loadWasmBinary(
  relativePath: string,
  baseUrlOverride?: string | URL
): Promise<ArrayBuffer> {
  // Get the base URL depending on the environment (worker or main thread)
  // If a base URL is provided, use it; otherwise use import.meta.url from this module
  // In a worker, import.meta.url is the worker's own URL.
  // In the main thread, it's the URL of the current module.
  const baseUrl = baseUrlOverride
    ? typeof baseUrlOverride === 'string'
      ? new URL('.', baseUrlOverride)
      : new URL('.', baseUrlOverride.href)
    : new URL('.', import.meta.url);
  const fullUrl = new URL(relativePath, baseUrl);

  console.log(`[WasmLoader] Loading WASM from relative path: ${relativePath}`);
  console.log(`[WasmLoader] Base URL (import.meta.url): ${baseUrl.href}`);
  console.log(`[WasmLoader] Constructed full URL: ${fullUrl.href}`);

  try {
    const response = await fetch(fullUrl.href);

    console.log(
      `[WasmLoader] Fetch response status for ${fullUrl.href}: ${response.status}`
    );

    if (!response.ok) {
      const responseText = await response.text();
      console.error(
        `[WasmLoader] Fetch response text (first 500 chars):`,
        responseText.substring(0, 500)
      );
      throw new Error(
        `Failed to fetch WASM module at ${fullUrl.href}: ${response.status} ${response.statusText}`
      );
    }

    const contentType = response.headers.get('content-type');
    console.log(`[WasmLoader] Response Content-Type: ${contentType}`);
    if (!contentType || !contentType.includes('application/wasm')) {
      console.warn(
        `[WasmLoader] Warning: WASM module at ${fullUrl.href} served with incorrect MIME type: "${contentType}". Should be "application/wasm".`
      );
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error(
      `[WasmLoader] CRITICAL: Fetching WASM binary from ${fullUrl.href} failed.`,
      error
    );
    throw error;
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
    return await import(/* @vite-ignore */ modulePath);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e1) {
    // Continue to next strategy
  }

  // Strategy 2: Try import.meta.resolve (Node.js 22+)
  try {
    const resolvedPath = await import.meta.resolve(modulePath);

    return await import(/* @vite-ignore */ resolvedPath);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e2) {
    // Continue to next strategy
  }

  // Strategy 3: Try URL-based import
  try {
    const url = new URL(/* @vite-ignore */ modulePath, import.meta.url);

    return await import(/* @vite-ignore */ url.href);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e3) {
    throw new Error(
      `Failed to load WASM module from "${modulePath}". ` +
        `Ensure WASM files are in the expected location and the module can be resolved.`
    );
  }
}
