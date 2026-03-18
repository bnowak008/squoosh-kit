var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// ../runtime/src/env.ts
function isBun() {
  return typeof Bun !== "undefined";
}

// ../runtime/src/worker-call.ts
async function callWorker(worker, type, payload, signal, transfer) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const handleMessage = (event) => {
      const response = event.data;
      if (response.id !== id)
        return;
      cleanup();
      if (response.ok && response.data !== undefined) {
        resolve(response.data);
      } else {
        reject(new Error(response.error || "Unknown worker error"));
      }
    };
    const handleError = (error) => {
      cleanup();
      reject(new Error(`Worker error: ${error.message}`));
    };
    const handleAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };
    const cleanup = () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      signal?.removeEventListener("abort", handleAbort);
    };
    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    signal?.addEventListener("abort", handleAbort);
    const request = { type, id, payload };
    if (transfer && transfer.length > 0) {
      worker.postMessage(request, transfer);
    } else {
      worker.postMessage(request);
    }
  });
}
var requestId = 0;

// ../runtime/src/worker-helper.ts
function createCodecWorker(workerFilename, options) {
  const normalizedName = workerFilename.endsWith(".js") ? workerFilename : `${workerFilename}.js`;
  const workerMap = {
    "resize.worker.js": {
      package: "@squoosh-kit/resize",
      specifier: "resize.worker.js"
    },
    "webp.worker.js": {
      package: "@squoosh-kit/webp",
      specifier: "webp.worker.js"
    }
  };
  const workerConfig = workerMap[normalizedName];
  if (!workerConfig) {
    throw new Error(`Unknown worker: ${normalizedName}. ` + `Supported workers: ${Object.keys(workerMap).join(", ")}`);
  }
  try {
    if (typeof window !== "undefined") {
      const packageName = workerConfig.package.split("/")[1];
      const workerFile = normalizedName.replace(".js", ".browser.mjs");
      console.log(`[worker-helper] In browser environment. Trying to create worker:`);
      console.log(`[worker-helper]   - Package Name: ${packageName}`);
      console.log(`[worker-helper]   - Worker File: ${workerFile}`);
      if (options?.assetPath) {
        let normalizedAssetPath = options.assetPath;
        if (!normalizedAssetPath.startsWith("/")) {
          normalizedAssetPath = "/" + normalizedAssetPath;
        }
        if (normalizedAssetPath.endsWith("/")) {
          normalizedAssetPath = normalizedAssetPath.slice(0, -1);
        }
        const workerPath = `${normalizedAssetPath}/${packageName}/${workerFile}`;
        const workerUrl = new URL(workerPath, window.location.origin).href;
        console.log(`[worker-helper] Using provided assetPath. Full Worker URL: ${workerUrl}`);
        try {
          const worker = new Worker(workerUrl, { type: "module" });
          console.log(`[worker-helper] Successfully created worker with assetPath: ${workerUrl}`);
          return worker;
        } catch (e) {
          console.error(`[worker-helper] Failed to load worker from assetPath URL: ${workerUrl}`, e);
          throw new Error(`Worker failed to load from ${workerUrl}: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
        }
      }
      const pathStrategies = [
        `../../${packageName}/dist/${workerFile}`,
        `../../../node_modules/@squoosh-kit/${packageName}/dist/${workerFile}`,
        `../../../${packageName}/dist/${workerFile}`
      ];
      let lastError = null;
      for (const relPath of pathStrategies) {
        console.log("relPath:", relPath);
        console.log("import.meta.url:", import.meta.url);
        try {
          const workerUrl = new URL(relPath, import.meta.url);
          console.log(`[worker-helper] Trying path strategy. Full Worker URL: ${workerUrl.href}`);
          const worker = new Worker(workerUrl, {
            type: "module"
          });
          console.log(`[worker-helper] Successfully created worker with URL: ${workerUrl.href}`);
          return worker;
        } catch (error) {
          console.warn(`[worker-helper] Path strategy failed for ${relPath}:`, error);
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      }
      if (lastError) {
        console.error("[worker-helper] All path strategies failed.", lastError);
        throw lastError;
      }
      throw new Error(`Could not resolve worker ${normalizedName} using any available path strategy`);
    }
    const platformExt = isBun() ? ".bun.js" : ".node.mjs";
    const baseName = normalizedName.replace(".js", "");
    const srcRelPath = workerConfig.package.includes("resize") ? `../../resize/src/${baseName}.ts` : `../../webp/src/${baseName}.ts`;
    console.log("srcRelPath:", srcRelPath);
    console.log("import.meta.url:", import.meta.url);
    try {
      return new Worker(new URL(srcRelPath, import.meta.url), {
        type: "module"
      });
    } catch {
      const distRelPath = workerConfig.package.includes("resize") ? `../../resize/dist/${baseName}.${platformExt.slice(1)}` : `../../webp/dist/${baseName}.${platformExt.slice(1)}`;
      console.log("distRelPath:", distRelPath);
      console.log("import.meta.url:", import.meta.url);
      try {
        return new Worker(new URL(distRelPath, import.meta.url), {
          type: "module"
        });
      } catch {
        if (typeof import.meta.resolve === "function") {
          try {
            const resolved = import.meta.resolve(`${workerConfig.package}/${workerConfig.specifier}`);
            console.log("resolved:", resolved);
            return new Worker(resolved, { type: "module" });
          } catch {}
        }
      }
    }
    throw new Error(`Failed to create worker from ${normalizedName}. ` + `Tried TypeScript source, dist output, and import.meta.resolve. ` + `Ensure the @squoosh-kit/resize and @squoosh-kit/webp packages are installed.`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create worker from ${normalizedName}: ${errorMessage}. ` + `Ensure the @squoosh-kit/resize and @squoosh-kit/webp packages are installed. ` + `If you're using Vite, ensure the worker files are not being optimized as dependencies.`, { cause: error });
  }
}
function createReadyWorker(workerFilename, options, timeoutMs = 1e4) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Worker initialization timeout after ${timeoutMs}ms. Worker file: ${workerFilename}`));
    }, timeoutMs);
    let worker;
    try {
      worker = createCodecWorker(workerFilename, options);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
      return;
    }
    const handleMessage = (event) => {
      if (event.data?.type === "worker:ready") {
        clearTimeout(timeout);
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
        worker.removeEventListener("messageerror", handleMessageError);
        resolve(worker);
      }
    };
    const handleError = (event) => {
      clearTimeout(timeout);
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      worker.removeEventListener("messageerror", handleMessageError);
      reject(new Error(`Worker failed to start: ${event?.message || "Unknown error"}. Worker file: ${workerFilename}`));
    };
    const handleMessageError = () => {
      clearTimeout(timeout);
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      worker.removeEventListener("messageerror", handleMessageError);
      reject(new Error(`Worker message error during initialization. Worker file: ${workerFilename}`));
    };
    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    worker.addEventListener("messageerror", handleMessageError);
    worker.postMessage({ type: "worker:ping" });
  });
}
var init_worker_helper = () => {};

// ../runtime/src/wasm-loader.ts
async function loadWasmBinary(relativePath, baseUrlOverride) {
  const baseUrl = baseUrlOverride ? typeof baseUrlOverride === "string" ? new URL(".", baseUrlOverride) : new URL(".", baseUrlOverride.href) : new URL(".", import.meta.url);
  const fullUrl = new URL(relativePath, baseUrl);
  console.log(`[WasmLoader] Loading WASM from relative path: ${relativePath}`);
  console.log(`[WasmLoader] Base URL (import.meta.url): ${baseUrl.href}`);
  console.log(`[WasmLoader] Constructed full URL: ${fullUrl.href}`);
  try {
    const response = await fetch(fullUrl.href);
    console.log(`[WasmLoader] Fetch response status for ${fullUrl.href}: ${response.status}`);
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`[WasmLoader] Fetch response text (first 500 chars):`, responseText.substring(0, 500));
      throw new Error(`Failed to fetch WASM module at ${fullUrl.href}: ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get("content-type");
    console.log(`[WasmLoader] Response Content-Type: ${contentType}`);
    if (!contentType || !contentType.includes("application/wasm")) {
      console.warn(`[WasmLoader] Warning: WASM module at ${fullUrl.href} served with incorrect MIME type: "${contentType}". Should be "application/wasm".`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error(`[WasmLoader] CRITICAL: Fetching WASM binary from ${fullUrl.href} failed.`, error);
    throw error;
  }
}

// ../runtime/src/validators.ts
function validateImageInput(image) {
  if (!image || typeof image !== "object") {
    throw new TypeError("image must be an object");
  }
  const imageObj = image;
  if (!("data" in imageObj)) {
    throw new TypeError("image.data is required");
  }
  const { data } = imageObj;
  if (!(data instanceof Uint8Array || data instanceof Uint8ClampedArray)) {
    throw new TypeError("image.data must be Uint8Array or Uint8ClampedArray");
  }
  if (!("width" in imageObj) || !("height" in imageObj)) {
    throw new TypeError("image.width and image.height are required");
  }
  const { width, height } = imageObj;
  if (typeof width !== "number" || !Number.isInteger(width) || width <= 0) {
    throw new RangeError(`image.width must be a positive integer, got ${width}`);
  }
  if (typeof height !== "number" || !Number.isInteger(height) || height <= 0) {
    throw new RangeError(`image.height must be a positive integer, got ${height}`);
  }
  const expectedSize = width * height * 4;
  if (data.length < expectedSize) {
    throw new RangeError(`image.data too small: ${data.length} bytes, expected at least ${expectedSize} bytes for ${width}x${height} RGBA image`);
  }
}
// ../runtime/src/simd-detector.ts
var init_simd_detector = () => {};

// ../runtime/src/image-data-polyfill.ts
function polyfillImageData() {
  if (typeof ImageData === "undefined") {
    globalThis.ImageData = class {
      data;
      width;
      height;
      colorSpace = "srgb";
      constructor(data, width, height) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
  }
}

// ../runtime/src/index.ts
var init_src = __esm(() => {
  init_worker_helper();
  init_simd_detector();
});

// src/validators.ts
function validateWp2Options(options) {
  if (options === undefined) {
    return;
  }
  if (typeof options !== "object" || options === null) {
    throw new TypeError("options must be an object or undefined");
  }
  const opts = options;
  if ("quality" in opts && opts.quality !== undefined) {
    const quality = opts.quality;
    if (Number.isNaN(quality)) {
      throw new RangeError("quality must be a valid number in the range 0-100, got NaN");
    }
    if (typeof quality !== "number") {
      throw new TypeError("quality must be a number");
    }
    if (!Number.isFinite(quality) || !Number.isInteger(quality)) {
      throw new RangeError("quality must be an integer in the range 0-100, got floating point");
    }
    if (quality < 0 || quality > 100) {
      throw new RangeError(`quality must be in the range 0-100, got ${quality}`);
    }
  }
  if ("alpha_quality" in opts && opts.alpha_quality !== undefined) {
    const alphaQuality = opts.alpha_quality;
    if (Number.isNaN(alphaQuality)) {
      throw new RangeError("alpha_quality must be a valid number in the range 0-100, got NaN");
    }
    if (typeof alphaQuality !== "number") {
      throw new TypeError("alpha_quality must be a number");
    }
    if (!Number.isFinite(alphaQuality) || !Number.isInteger(alphaQuality)) {
      throw new RangeError("alpha_quality must be an integer in the range 0-100, got floating point");
    }
    if (alphaQuality < 0 || alphaQuality > 100) {
      throw new RangeError(`alpha_quality must be in the range 0-100, got ${alphaQuality}`);
    }
  }
  if ("effort" in opts && opts.effort !== undefined) {
    const effort = opts.effort;
    if (Number.isNaN(effort)) {
      throw new RangeError("effort must be a valid number in the range 0-9, got NaN");
    }
    if (typeof effort !== "number") {
      throw new TypeError("effort must be a number");
    }
    if (!Number.isFinite(effort) || !Number.isInteger(effort)) {
      throw new RangeError("effort must be an integer in the range 0-9, got floating point");
    }
    if (effort < 0 || effort > 9) {
      throw new RangeError(`effort must be in the range 0-9, got ${effort}`);
    }
  }
  if ("pass" in opts && opts.pass !== undefined) {
    const pass = opts.pass;
    if (Number.isNaN(pass)) {
      throw new RangeError("pass must be a valid number in the range 1-10, got NaN");
    }
    if (typeof pass !== "number") {
      throw new TypeError("pass must be a number");
    }
    if (!Number.isFinite(pass) || !Number.isInteger(pass)) {
      throw new RangeError("pass must be an integer in the range 1-10, got floating point");
    }
    if (pass < 1 || pass > 10) {
      throw new RangeError(`pass must be in the range 1-10, got ${pass}`);
    }
  }
  if ("sns" in opts && opts.sns !== undefined) {
    const sns = opts.sns;
    if (Number.isNaN(sns)) {
      throw new RangeError("sns must be a valid number in the range 0-100, got NaN");
    }
    if (typeof sns !== "number") {
      throw new TypeError("sns must be a number");
    }
    if (!Number.isFinite(sns) || !Number.isInteger(sns)) {
      throw new RangeError("sns must be an integer in the range 0-100, got floating point");
    }
    if (sns < 0 || sns > 100) {
      throw new RangeError(`sns must be in the range 0-100, got ${sns}`);
    }
  }
}

// src/wp2.worker.ts
var exports_wp2_worker = {};
__export(exports_wp2_worker, {
  wp2EncodeClient: () => wp2EncodeClient,
  wp2DecodeClient: () => wp2DecodeClient
});
async function loadWp2Module() {
  if (cachedModule) {
    return cachedModule;
  }
  const isNodeOrBun = typeof process !== "undefined" && (process.versions?.bun !== undefined || process.versions?.node !== undefined);
  const modulePath = isNodeOrBun ? "wp2-enc/wp2_node_enc.js" : "wp2-enc/wp2_enc.js";
  try {
    console.log("[WP2 Worker] Initializing. Environment:", isNodeOrBun ? "Node/Bun" : "Browser");
    console.log(`[WP2 Worker] Attempting to import module from path: ${modulePath}`);
    const globalSelf = typeof self !== "undefined" ? self : globalThis;
    if (!globalSelf.location) {
      globalSelf.location = {
        href: import.meta.url
      };
    }
    if (typeof self === "undefined" && typeof globalThis !== "undefined") {
      globalThis.self = globalThis;
    }
    let moduleFactory;
    const isSource = import.meta.url.includes("/src/");
    const pathsToTry = isSource ? ["../wasm/" + modulePath, "./wasm/" + modulePath] : ["./wasm/" + modulePath, "../wasm/" + modulePath];
    let lastError = null;
    for (const importPath of pathsToTry) {
      try {
        moduleFactory = (await import(importPath)).default;
        console.log(`[WP2 Worker] Successfully loaded module from: ${importPath}`);
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[WP2 Worker] Failed to load from ${importPath}, trying next path...`);
      }
    }
    if (!moduleFactory) {
      throw lastError || new Error("Could not load WP2 module from any path");
    }
    console.log("[WP2 Worker] Module factory loaded successfully.");
    const wasmFile = isNodeOrBun ? "wp2_node_enc.wasm" : "wp2_enc.wasm";
    const wasmPathsToTry = isSource ? [`../wasm/wp2-enc/${wasmFile}`, `./wasm/wp2-enc/${wasmFile}`] : [`./wasm/wp2-enc/${wasmFile}`, `../wasm/wp2-enc/${wasmFile}`];
    console.log(`[WP2 Worker] Preparing to load WASM binary. Will try paths: ${wasmPathsToTry.join(", ")}`);
    const initModuleWithBinary = async (moduleFactory2, wasmPaths) => {
      const workerBaseUrl = new URL(".", import.meta.url);
      let lastError2 = null;
      for (const wasmPath of wasmPaths) {
        try {
          console.log(`[WP2 Worker] Calling loadWasmBinary with path: ${wasmPath}`);
          const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
          console.log(`[WP2 Worker] Successfully fetched WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`);
          const globalSelf2 = typeof self !== "undefined" ? self : globalThis;
          if (!globalSelf2.location) {
            globalSelf2.location = {
              href: import.meta.url
            };
          }
          if (typeof self === "undefined" && typeof globalThis !== "undefined") {
            globalThis.self = globalThis;
          }
          return await moduleFactory2({
            noInitialRun: true,
            wasmBinary
          });
        } catch (err) {
          lastError2 = err instanceof Error ? err : new Error(String(err));
          console.warn(`[WP2 Worker] Failed to load WASM from ${wasmPath}, trying next path...`);
        }
      }
      throw lastError2 || new Error("Could not load WASM binary from any of the attempted paths");
    };
    cachedModule = await initModuleWithBinary(moduleFactory, wasmPathsToTry);
    console.log("[WP2 Worker] WP2 module initialized successfully.");
    return cachedModule;
  } catch (err) {
    console.error(`[WP2 Worker] CRITICAL: Failed to load WP2 module from path: ${modulePath}`, err);
    throw err;
  }
}
function createEncodeOptions(options) {
  return {
    quality: options?.quality ?? 75,
    alpha_quality: options?.alpha_quality ?? 75,
    effort: options?.effort ?? 5,
    pass: options?.pass ?? 1,
    sns: options?.sns ?? 50,
    uv_mode: options?.uv_mode ?? UVModeAuto,
    csp_type: options?.csp_type ?? kYCoCg,
    error_diffusion: options?.error_diffusion ?? 0,
    use_random_matrix: options?.use_random_matrix ?? false
  };
}
async function wp2EncodeClient(image, options, signal) {
  validateImageInput(image);
  validateWp2Options(options);
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const width = image.width;
  const height = image.height;
  const data = image.data;
  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error("Image data must be Uint8Array or Uint8ClampedArray");
  }
  const module = await loadWp2Module();
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const encodeOptions = createEncodeOptions(options);
  const dataArray = data instanceof Uint8ClampedArray ? new Uint8Array(data.buffer, data.byteOffset, data.length) : new Uint8Array(data.buffer, data.byteOffset, data.length);
  const result = module.encode(dataArray, width, height, encodeOptions);
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (!result) {
    throw new Error("WP2 encoding failed");
  }
  return result;
}
async function loadWp2DecModule() {
  if (cachedDecModule) {
    return cachedDecModule;
  }
  const isNodeOrBun = typeof process !== "undefined" && (process.versions?.bun !== undefined || process.versions?.node !== undefined);
  const modulePath = isNodeOrBun ? "wp2-dec/wp2_node_dec.js" : "wp2-dec/wp2_dec.js";
  try {
    console.log("[WP2 Worker] Initializing dec. Environment:", isNodeOrBun ? "Node/Bun" : "Browser");
    console.log(`[WP2 Worker] Attempting to import dec module from path: ${modulePath}`);
    const globalSelf = typeof self !== "undefined" ? self : globalThis;
    if (!globalSelf.location) {
      globalSelf.location = {
        href: import.meta.url
      };
    }
    if (typeof self === "undefined" && typeof globalThis !== "undefined") {
      globalThis.self = globalThis;
    }
    polyfillImageData();
    let moduleFactory;
    const isSource = import.meta.url.includes("/src/");
    const pathsToTry = isSource ? ["../wasm/" + modulePath, "./wasm/" + modulePath] : ["./wasm/" + modulePath, "../wasm/" + modulePath];
    let lastError = null;
    for (const importPath of pathsToTry) {
      try {
        moduleFactory = (await import(importPath)).default;
        console.log(`[WP2 Worker] Successfully loaded dec module from: ${importPath}`);
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[WP2 Worker] Failed to load dec from ${importPath}, trying next path...`);
      }
    }
    if (!moduleFactory) {
      throw lastError || new Error("Could not load WP2 dec module from any path");
    }
    console.log("[WP2 Worker] Dec module factory loaded successfully.");
    const wasmFile = isNodeOrBun ? "wp2_node_dec.wasm" : "wp2_dec.wasm";
    const wasmPathsToTry = isSource ? [`../wasm/wp2-dec/${wasmFile}`, `./wasm/wp2-dec/${wasmFile}`] : [`./wasm/wp2-dec/${wasmFile}`, `../wasm/wp2-dec/${wasmFile}`];
    console.log(`[WP2 Worker] Preparing to load dec WASM binary. Will try paths: ${wasmPathsToTry.join(", ")}`);
    const initDecModuleWithBinary = async (moduleFactory2, wasmPaths) => {
      const workerBaseUrl = new URL(".", import.meta.url);
      let lastError2 = null;
      for (const wasmPath of wasmPaths) {
        try {
          console.log(`[WP2 Worker] Calling loadWasmBinary with dec path: ${wasmPath}`);
          const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
          console.log(`[WP2 Worker] Successfully fetched dec WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`);
          const globalSelf2 = typeof self !== "undefined" ? self : globalThis;
          if (!globalSelf2.location) {
            globalSelf2.location = {
              href: import.meta.url
            };
          }
          if (typeof self === "undefined" && typeof globalThis !== "undefined") {
            globalThis.self = globalThis;
          }
          return await moduleFactory2({
            noInitialRun: true,
            wasmBinary
          });
        } catch (err) {
          lastError2 = err instanceof Error ? err : new Error(String(err));
          console.warn(`[WP2 Worker] Failed to load dec WASM from ${wasmPath}, trying next path...`);
        }
      }
      throw lastError2 || new Error("Could not load dec WASM binary from any of the attempted paths");
    };
    cachedDecModule = await initDecModuleWithBinary(moduleFactory, wasmPathsToTry);
    console.log("[WP2 Worker] WP2 dec module initialized successfully.");
    return cachedDecModule;
  } catch (err) {
    console.error(`[WP2 Worker] CRITICAL: Failed to load WP2 dec module from path: ${modulePath}`, err);
    throw err;
  }
}
async function wp2DecodeClient(data, signal) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const module = await loadWp2DecModule();
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const result = module.decode(data);
  if (!result) {
    throw new Error("WP2 decoding failed");
  }
  return result;
}
var UVModeAuto = 3, kYCoCg = 0, cachedModule = null, cachedDecModule = null;
var init_wp2_worker = __esm(() => {
  init_src();
  if (typeof self !== "undefined") {
    self.onmessage = async (event) => {
      const data = event.data;
      if (data?.type === "worker:ping") {
        self.postMessage({ type: "worker:ready" });
        return;
      }
      if (data?.type === "wp2:encode") {
        const request2 = data;
        const response2 = {
          id: request2.id,
          ok: false
        };
        try {
          const { image, options } = request2.payload;
          const result = await wp2EncodeClient(image, options);
          response2.ok = true;
          response2.data = result;
          self.postMessage(response2);
        } catch (error) {
          response2.error = error instanceof Error ? error.message : String(error);
          self.postMessage(response2);
        }
        return;
      }
      if (data?.type === "wp2:decode") {
        const request2 = data;
        const response2 = {
          id: request2.id,
          ok: false
        };
        try {
          const result = await wp2DecodeClient(request2.payload.data);
          response2.ok = true;
          response2.data = result;
          self.postMessage(response2);
        } catch (error) {
          response2.error = error instanceof Error ? error.message : String(error);
          self.postMessage(response2);
        }
        return;
      }
      const request = data;
      const response = {
        id: request.id,
        ok: false,
        error: `Unknown message type: ${data?.type}`
      };
      self.postMessage(response);
    };
  }
});

// src/bridge.ts
init_src();
init_src();

class Wp2ClientBridge {
  async encode(image, options, signal) {
    const module = await Promise.resolve().then(() => (init_wp2_worker(), exports_wp2_worker));
    const wp2EncodeClient2 = module.wp2EncodeClient;
    return wp2EncodeClient2(image, options, signal);
  }
  async decode(data, signal) {
    const module = await Promise.resolve().then(() => (init_wp2_worker(), exports_wp2_worker));
    const wp2DecodeClient2 = module.wp2DecodeClient;
    return wp2DecodeClient2(data, signal);
  }
  async terminate() {}
}

class Wp2WorkerBridge {
  worker = null;
  workerReady = null;
  options;
  constructor(options) {
    console.log("[wp2/bridge] Wp2WorkerBridge constructor called with options:", options);
    this.options = options;
  }
  async getWorker() {
    if (!this.workerReady) {
      this.workerReady = this.createWorker();
    }
    return this.workerReady;
  }
  async createWorker() {
    console.log("[wp2/bridge] createWorker called. Creating ready worker...");
    this.worker = await createReadyWorker("wp2.worker.js", this.options);
    console.log("[wp2/bridge] createWorker: Ready worker created successfully.");
    return this.worker;
  }
  async encode(image, options, signal) {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, "wp2:encode", { image, options }, signal);
  }
  async decode(data, signal) {
    const worker = await this.getWorker();
    return callWorker(worker, "wp2:decode", { data }, signal);
  }
  async terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = null;
    }
  }
}
function createBridge(mode, options) {
  console.log(`[wp2/bridge] createBridge called with mode: ${mode}`);
  if (mode === "worker") {
    return new Wp2WorkerBridge(options);
  }
  return new Wp2ClientBridge;
}

// src/index.ts
var UVMode = {
  UVModeAdapt: 0,
  UVMode420: 1,
  UVMode444: 2,
  UVModeAuto: 3
};
var Csp = {
  kYCoCg: 0,
  kYCbCr: 1,
  kCustom: 2,
  kYIQ: 3
};
var globalClientBridge = null;
async function encode(imageData, options, signal) {
  if (!globalClientBridge) {
    globalClientBridge = createBridge("worker");
  }
  return globalClientBridge.encode(imageData, options, signal);
}
async function decode(data, signal) {
  if (!globalClientBridge) {
    globalClientBridge = createBridge("worker");
  }
  return globalClientBridge.decode(data, signal);
}
function createWp2Encoder(mode = "worker", options) {
  const bridge = createBridge(mode, options);
  return Object.assign((imageData, options2, signal) => {
    return bridge.encode(imageData, options2, signal);
  }, {
    terminate: async () => {
      await bridge.terminate();
    }
  });
}
function createWp2Decoder(mode = "worker", options) {
  const bridge = createBridge(mode, options);
  return Object.assign((data, signal) => {
    return bridge.decode(data, signal);
  }, {
    terminate: async () => {
      await bridge.terminate();
    }
  });
}
export {
  encode,
  decode,
  createWp2Encoder,
  createWp2Decoder,
  UVMode,
  Csp
};

//# debugId=72CD856BFB479EC664756E2164756E21
