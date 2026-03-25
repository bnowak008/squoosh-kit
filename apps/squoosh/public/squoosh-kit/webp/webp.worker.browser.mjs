var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
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
    },
    "avif.worker.js": {
      package: "@squoosh-kit/avif",
      specifier: "avif.worker.js"
    },
    "mozjpeg.worker.js": {
      package: "@squoosh-kit/mozjpeg",
      specifier: "mozjpeg.worker.js"
    },
    "jxl.worker.js": {
      package: "@squoosh-kit/jxl",
      specifier: "jxl.worker.js"
    },
    "oxipng.worker.js": {
      package: "@squoosh-kit/oxipng",
      specifier: "oxipng.worker.js"
    },
    "png.worker.js": {
      package: "@squoosh-kit/png",
      specifier: "png.worker.js"
    },
    "imagequant.worker.js": {
      package: "@squoosh-kit/imagequant",
      specifier: "imagequant.worker.js"
    },
    "qoi.worker.js": {
      package: "@squoosh-kit/qoi",
      specifier: "qoi.worker.js"
    },
    "wp2.worker.js": {
      package: "@squoosh-kit/wp2",
      specifier: "wp2.worker.js"
    },
    "hqx.worker.js": {
      package: "@squoosh-kit/hqx",
      specifier: "hqx.worker.js"
    },
    "rotate.worker.js": {
      package: "@squoosh-kit/rotate",
      specifier: "rotate.worker.js"
    },
    "visdif.worker.js": {
      package: "@squoosh-kit/visdif",
      specifier: "visdif.worker.js"
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
    const pkgName = workerConfig.package.split("/")[1];
    const srcRelPath = `../../${pkgName}/src/${baseName}.ts`;
    console.log("srcRelPath:", srcRelPath);
    console.log("import.meta.url:", import.meta.url);
    try {
      return new Worker(new URL(srcRelPath, import.meta.url), {
        type: "module"
      });
    } catch {
      const distRelPath = `../../${pkgName}/dist/${baseName}.${platformExt.slice(1)}`;
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

// ../../node_modules/.bun/wasm-feature-detect@1.8.0/node_modules/wasm-feature-detect/dist/esm/index.js
var simd = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));

// ../runtime/src/simd-detector.ts
async function detectSimd() {
  if (simdSupported !== null) {
    return simdSupported;
  }
  if (simdDetectionPromise) {
    return simdDetectionPromise;
  }
  simdDetectionPromise = (async () => {
    try {
      simdSupported = await simd();
      return simdSupported;
    } catch (error) {
      simdSupported = false;
      console.warn("SIMD detection failed, falling back to standard WASM modules:", error);
      return false;
    }
  })();
  return simdDetectionPromise;
}
var simdSupported = null, simdDetectionPromise = null;
var init_simd_detector = () => {};

// ../runtime/src/index.ts
var init_src = __esm(() => {
  init_worker_helper();
  init_simd_detector();
});

// src/validators.ts
function validateWebpOptions(options) {
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
}

// src/webp.worker.ts
var exports_webp_worker = {};
__export(exports_webp_worker, {
  webpEncodeClient: () => webpEncodeClient,
  webpDecodeClient: () => webpDecodeClient
});
async function loadWebPModule() {
  if (cachedModule)
    return cachedModule;
  if (loadModulePromise)
    return loadModulePromise;
  loadModulePromise = (async () => {
    const simdSupported2 = await detectSimd();
    const modulePath = simdSupported2 ? "webp/webp_enc_simd.js" : "webp/webp_enc.js";
    try {
      console.log("[WebP Worker] Initializing. SIMD support:", simdSupported2);
      console.log(`[WebP Worker] Attempting to import module from path: ${modulePath}`);
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
          console.log(`[WebP Worker] Successfully loaded module from: ${importPath}`);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`[WebP Worker] Failed to load from ${importPath}, trying next path...`);
        }
      }
      if (!moduleFactory) {
        throw lastError || new Error("Could not load WebP module from any path");
      }
      console.log("[WebP Worker] Module factory loaded successfully.");
      const wasmPathsToTry = simdSupported2 ? isSource ? [
        "../wasm/webp/webp_enc_simd.wasm",
        "./wasm/webp/webp_enc_simd.wasm"
      ] : [
        "./wasm/webp/webp_enc_simd.wasm",
        "../wasm/webp/webp_enc_simd.wasm"
      ] : isSource ? ["../wasm/webp/webp_enc.wasm", "./wasm/webp/webp_enc.wasm"] : ["./wasm/webp/webp_enc.wasm", "../wasm/webp/webp_enc.wasm"];
      console.log(`[WebP Worker] Preparing to load WASM binary. Will try paths: ${wasmPathsToTry.join(", ")}`);
      const initModuleWithBinary = async (moduleFactory2, wasmPaths) => {
        const workerBaseUrl = new URL(".", import.meta.url);
        let lastError2 = null;
        for (const wasmPath of wasmPaths) {
          try {
            console.log(`[WebP Worker] Calling loadWasmBinary with path: ${wasmPath}`);
            const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
            console.log(`[WebP Worker] Successfully fetched WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`);
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
            console.warn(`[WebP Worker] Failed to load WASM from ${wasmPath}, trying next path...`);
          }
        }
        throw lastError2 || new Error("Could not load WASM binary from any of the attempted paths");
      };
      cachedModule = await initModuleWithBinary(moduleFactory, wasmPathsToTry);
      console.log("[WebP Worker] WebP module initialized successfully.");
      return cachedModule;
    } catch (err) {
      console.error(`[WebP Worker] CRITICAL: Failed to load WebP module from path: ${modulePath}`, err);
      throw err;
    }
  })().catch((err) => {
    loadModulePromise = null;
    throw err;
  });
  return loadModulePromise;
}
function createEncodeOptions(options) {
  return {
    quality: options?.quality ?? 75,
    target_size: 0,
    target_PSNR: 0,
    method: options?.method ?? 4,
    sns_strength: options?.sns_strength ?? 50,
    filter_strength: options?.filter_strength ?? 60,
    filter_sharpness: options?.filter_sharpness ?? 0,
    filter_type: options?.filter_type ?? 1,
    partitions: options?.partitions ?? 0,
    segments: options?.segments ?? 4,
    pass: options?.pass ?? 1,
    show_compressed: 0,
    preprocessing: options?.preprocessing ?? 0,
    autofilter: options?.autofilter ?? 0,
    partition_limit: 0,
    alpha_compression: options?.alpha_compression ?? 1,
    alpha_filtering: options?.alpha_filtering ?? 1,
    alpha_quality: options?.alpha_quality ?? options?.quality ?? 75,
    lossless: options?.lossless ? 1 : 0,
    exact: options?.exact ?? 0,
    image_hint: options?.image_hint ?? 0,
    emulate_jpeg_size: 0,
    thread_level: 0,
    low_memory: 0,
    near_lossless: options?.near_lossless ?? options?.quality ?? 75,
    use_delta_palette: 0,
    use_sharp_yuv: options?.use_sharp_yuv ?? 0
  };
}
async function webpEncodeClient(image, options, signal) {
  validateImageInput(image);
  validateWebpOptions(options);
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const width = image.width;
  const height = image.height;
  const data = image.data;
  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error("Image data must be Uint8Array or Uint8ClampedArray");
  }
  const module = await loadWebPModule();
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
    throw new Error("WebP encoding failed");
  }
  return result;
}
async function loadWebPDecModule() {
  if (cachedDecModule)
    return cachedDecModule;
  if (loadDecModulePromise)
    return loadDecModulePromise;
  loadDecModulePromise = (async () => {
    const modulePath = "webp-dec/webp_dec.js";
    try {
      console.log("[WebP Worker] Initializing dec module...");
      console.log(`[WebP Worker] Attempting to import dec module from path: ${modulePath}`);
      const globalSelf = typeof self !== "undefined" ? self : globalThis;
      if (!globalSelf.location) {
        globalSelf.location = {
          href: import.meta.url
        };
      }
      if (typeof self === "undefined" && typeof globalThis !== "undefined") {
        globalThis.self = globalThis;
      }
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
      let moduleFactory;
      const isSource = import.meta.url.includes("/src/");
      const pathsToTry = isSource ? ["../wasm/" + modulePath, "./wasm/" + modulePath] : ["./wasm/" + modulePath, "../wasm/" + modulePath];
      let lastError = null;
      for (const importPath of pathsToTry) {
        try {
          moduleFactory = (await import(importPath)).default;
          console.log(`[WebP Worker] Successfully loaded dec module from: ${importPath}`);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`[WebP Worker] Failed to load dec from ${importPath}, trying next path...`);
        }
      }
      if (!moduleFactory) {
        throw lastError || new Error("Could not load WebP dec module from any path");
      }
      console.log("[WebP Worker] Dec module factory loaded successfully.");
      const wasmPathsToTry = isSource ? ["../wasm/webp-dec/webp_dec.wasm", "./wasm/webp-dec/webp_dec.wasm"] : ["./wasm/webp-dec/webp_dec.wasm", "../wasm/webp-dec/webp_dec.wasm"];
      console.log(`[WebP Worker] Preparing to load dec WASM binary. Will try paths: ${wasmPathsToTry.join(", ")}`);
      const initDecModuleWithBinary = async (moduleFactory2, wasmPaths) => {
        const workerBaseUrl = new URL(".", import.meta.url);
        let lastError2 = null;
        for (const wasmPath of wasmPaths) {
          try {
            console.log(`[WebP Worker] Calling loadWasmBinary with dec path: ${wasmPath}`);
            const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
            console.log(`[WebP Worker] Successfully fetched dec WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`);
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
            console.warn(`[WebP Worker] Failed to load dec WASM from ${wasmPath}, trying next path...`);
          }
        }
        throw lastError2 || new Error("Could not load dec WASM binary from any of the attempted paths");
      };
      cachedDecModule = await initDecModuleWithBinary(moduleFactory, wasmPathsToTry);
      console.log("[WebP Worker] WebP dec module initialized successfully.");
      return cachedDecModule;
    } catch (err) {
      console.error("[WebP Worker] CRITICAL: Failed to load WebP dec module", err);
      throw err;
    }
  })().catch((err) => {
    loadDecModulePromise = null;
    throw err;
  });
  return loadDecModulePromise;
}
async function webpDecodeClient(data, signal) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const module = await loadWebPDecModule();
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const result = module.decode(data);
  if (!result) {
    throw new Error("WebP decoding failed");
  }
  return result;
}
var cachedModule = null, loadModulePromise = null, cachedDecModule = null, loadDecModulePromise = null;
var init_webp_worker = __esm(() => {
  init_src();
  if (typeof self !== "undefined") {
    loadWebPModule().catch(() => {});
    self.onmessage = async (event) => {
      const data = event.data;
      if (data?.type === "worker:ping") {
        await loadWebPModule();
        self.postMessage({ type: "worker:ready" });
        return;
      }
      if (data?.type === "webp:encode") {
        const request2 = data;
        const response2 = {
          id: request2.id,
          ok: false
        };
        try {
          const { image, options } = request2.payload;
          const result = await webpEncodeClient(image, options);
          response2.ok = true;
          response2.data = result;
          const transferBuffer = result.buffer instanceof ArrayBuffer ? result.buffer : result.slice().buffer;
          self.postMessage(response2, {
            transfer: [transferBuffer]
          });
        } catch (error) {
          response2.error = error instanceof Error ? error.message : String(error);
          self.postMessage(response2);
        }
        return;
      }
      if (data?.type === "webp:decode") {
        const request2 = data;
        const response2 = {
          id: request2.id,
          ok: false
        };
        try {
          const result = await webpDecodeClient(request2.payload.data);
          response2.ok = true;
          response2.data = result;
          const transferBuffer = result.data.buffer instanceof ArrayBuffer ? result.data.buffer : result.data.slice().buffer;
          self.postMessage(response2, {
            transfer: [transferBuffer]
          });
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
init_webp_worker();

export {
  webpEncodeClient,
  webpDecodeClient
};

//# debugId=8054534D4E681F7164756E2164756E21
