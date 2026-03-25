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
function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function isBun() {
  return typeof Bun !== "undefined";
}
function isNode() {
  return typeof process !== "undefined" && process.versions != null && process.versions.node != null;
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
function validateMozjpegOptions(options) {
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
  if ("smoothing" in opts && opts.smoothing !== undefined) {
    const smoothing = opts.smoothing;
    if (Number.isNaN(smoothing)) {
      throw new RangeError("smoothing must be a valid number in the range 0-100, got NaN");
    }
    if (typeof smoothing !== "number") {
      throw new TypeError("smoothing must be a number");
    }
    if (!Number.isFinite(smoothing) || !Number.isInteger(smoothing)) {
      throw new RangeError("smoothing must be an integer in the range 0-100, got floating point");
    }
    if (smoothing < 0 || smoothing > 100) {
      throw new RangeError(`smoothing must be in the range 0-100, got ${smoothing}`);
    }
  }
}

// src/mozjpeg.worker.ts
var exports_mozjpeg_worker = {};
__export(exports_mozjpeg_worker, {
  mozjpegEncodeClient: () => mozjpegEncodeClient,
  mozjpegDecodeClient: () => mozjpegDecodeClient
});
async function loadMozjpegModule() {
  if (cachedEncModule)
    return cachedEncModule;
  if (loadEncModulePromise)
    return loadEncModulePromise;
  loadEncModulePromise = (async () => {
    const globalSelf = typeof self !== "undefined" ? self : globalThis;
    if (!globalSelf.location) {
      globalSelf.location = {
        href: import.meta.url
      };
    }
    if (typeof self === "undefined" && typeof globalThis !== "undefined") {
      globalThis.self = globalThis;
    }
    const useNode = isBun() || isNode();
    const modulePath = useNode ? "mozjpeg-enc/mozjpeg_node_enc.js" : "mozjpeg-enc/mozjpeg_enc.js";
    try {
      console.log("[MozJPEG Worker] Initializing encoder. Node/Bun:", useNode);
      console.log(`[MozJPEG Worker] Attempting to import encoder module from path: ${modulePath}`);
      let moduleFactory;
      const isSource = import.meta.url.includes("/src/");
      const pathsToTry = isSource ? ["../wasm/" + modulePath, "./wasm/" + modulePath] : ["./wasm/" + modulePath, "../wasm/" + modulePath];
      let lastError = null;
      for (const importPath of pathsToTry) {
        try {
          moduleFactory = (await import(importPath)).default;
          console.log(`[MozJPEG Worker] Successfully loaded encoder module from: ${importPath}`);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`[MozJPEG Worker] Failed to load encoder from ${importPath}, trying next path...`);
        }
      }
      if (!moduleFactory) {
        throw lastError || new Error("Could not load MozJPEG encoder module from any path");
      }
      console.log("[MozJPEG Worker] Encoder module factory loaded successfully.");
      const wasmFileName = useNode ? "mozjpeg_node_enc.wasm" : "mozjpeg_enc.wasm";
      const wasmPathsToTry = isSource ? [
        `../wasm/mozjpeg-enc/${wasmFileName}`,
        `./wasm/mozjpeg-enc/${wasmFileName}`
      ] : [
        `./wasm/mozjpeg-enc/${wasmFileName}`,
        `../wasm/mozjpeg-enc/${wasmFileName}`
      ];
      console.log(`[MozJPEG Worker] Preparing to load encoder WASM binary. Will try paths: ${wasmPathsToTry.join(", ")}`);
      const initModuleWithBinary = async (factory, wasmPaths) => {
        const workerBaseUrl = new URL(".", import.meta.url);
        let lastErr = null;
        for (const wasmPath of wasmPaths) {
          try {
            console.log(`[MozJPEG Worker] Calling loadWasmBinary with path: ${wasmPath}`);
            const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
            console.log(`[MozJPEG Worker] Successfully fetched encoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`);
            const globalSelf2 = typeof self !== "undefined" ? self : globalThis;
            if (!globalSelf2.location) {
              globalSelf2.location = {
                href: import.meta.url
              };
            }
            if (typeof self === "undefined" && typeof globalThis !== "undefined") {
              globalThis.self = globalThis;
            }
            return await factory({
              noInitialRun: true,
              wasmBinary
            });
          } catch (err) {
            lastErr = err instanceof Error ? err : new Error(String(err));
            console.warn(`[MozJPEG Worker] Failed to load encoder WASM from ${wasmPath}, trying next path...`);
          }
        }
        throw lastErr || new Error("Could not load encoder WASM binary from any of the attempted paths");
      };
      cachedEncModule = await initModuleWithBinary(moduleFactory, wasmPathsToTry);
      console.log("[MozJPEG Worker] MozJPEG encoder module initialized successfully.");
      return cachedEncModule;
    } catch (err) {
      console.error(`[MozJPEG Worker] CRITICAL: Failed to load MozJPEG encoder module from path: ${modulePath}`, err);
      throw err;
    }
  })().catch((err) => {
    loadEncModulePromise = null;
    throw err;
  });
  return loadEncModulePromise;
}
async function loadMozjpegNodeDecModule() {
  if (cachedDecModule)
    return cachedDecModule;
  if (loadDecModulePromise)
    return loadDecModulePromise;
  loadDecModulePromise = (async () => {
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
    const modulePath = "mozjpeg-dec/mozjpeg_node_dec.js";
    try {
      console.log("[MozJPEG Worker] Initializing node decoder...");
      console.log(`[MozJPEG Worker] Attempting to import decoder module from path: ${modulePath}`);
      let moduleFactory;
      const isSource = import.meta.url.includes("/src/");
      const pathsToTry = isSource ? ["../wasm/" + modulePath, "./wasm/" + modulePath] : ["./wasm/" + modulePath, "../wasm/" + modulePath];
      let lastError = null;
      for (const importPath of pathsToTry) {
        try {
          moduleFactory = (await import(importPath)).default;
          console.log(`[MozJPEG Worker] Successfully loaded decoder module from: ${importPath}`);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`[MozJPEG Worker] Failed to load decoder from ${importPath}, trying next path...`);
        }
      }
      if (!moduleFactory) {
        throw lastError || new Error("Could not load MozJPEG decoder module from any path");
      }
      console.log("[MozJPEG Worker] Decoder module factory loaded successfully.");
      const wasmPathsToTry = isSource ? [
        "../wasm/mozjpeg-dec/mozjpeg_node_dec.wasm",
        "./wasm/mozjpeg-dec/mozjpeg_node_dec.wasm"
      ] : [
        "./wasm/mozjpeg-dec/mozjpeg_node_dec.wasm",
        "../wasm/mozjpeg-dec/mozjpeg_node_dec.wasm"
      ];
      console.log(`[MozJPEG Worker] Preparing to load decoder WASM binary. Will try paths: ${wasmPathsToTry.join(", ")}`);
      const initDecModuleWithBinary = async (factory, wasmPaths) => {
        const workerBaseUrl = new URL(".", import.meta.url);
        let lastErr = null;
        for (const wasmPath of wasmPaths) {
          try {
            console.log(`[MozJPEG Worker] Calling loadWasmBinary with path: ${wasmPath}`);
            const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
            console.log(`[MozJPEG Worker] Successfully fetched decoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`);
            const globalSelf2 = typeof self !== "undefined" ? self : globalThis;
            if (!globalSelf2.location) {
              globalSelf2.location = {
                href: import.meta.url
              };
            }
            if (typeof self === "undefined" && typeof globalThis !== "undefined") {
              globalThis.self = globalThis;
            }
            return await factory({
              noInitialRun: true,
              wasmBinary
            });
          } catch (err) {
            lastErr = err instanceof Error ? err : new Error(String(err));
            console.warn(`[MozJPEG Worker] Failed to load decoder WASM from ${wasmPath}, trying next path...`);
          }
        }
        throw lastErr || new Error("Could not load decoder WASM binary from any of the attempted paths");
      };
      cachedDecModule = await initDecModuleWithBinary(moduleFactory, wasmPathsToTry);
      console.log("[MozJPEG Worker] MozJPEG decoder module initialized successfully.");
      return cachedDecModule;
    } catch (err) {
      console.error("[MozJPEG Worker] CRITICAL: Failed to load MozJPEG decoder module", err);
      throw err;
    }
  })().catch((err) => {
    loadDecModulePromise = null;
    throw err;
  });
  return loadDecModulePromise;
}
function createEncodeOptions(options) {
  return {
    quality: options?.quality ?? 75,
    baseline: options?.baseline ?? false,
    arithmetic: options?.arithmetic ?? false,
    progressive: options?.progressive ?? true,
    optimize_coding: options?.optimize_coding ?? true,
    smoothing: options?.smoothing ?? 0,
    color_space: options?.color_space ?? MozJpegColorSpace.YCbCr,
    quant_table: options?.quant_table ?? 3,
    trellis_multipass: options?.trellis_multipass ?? false,
    trellis_opt_zero: options?.trellis_opt_zero ?? false,
    trellis_opt_table: options?.trellis_opt_table ?? false,
    trellis_loops: options?.trellis_loops ?? 1,
    auto_subsample: options?.auto_subsample ?? true,
    chroma_subsample: options?.chroma_subsample ?? 2,
    separate_chroma_quality: options?.separate_chroma_quality ?? false,
    chroma_quality: options?.chroma_quality ?? 75
  };
}
async function mozjpegEncodeClient(image, options, signal) {
  validateImageInput(image);
  validateMozjpegOptions(options);
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const width = image.width;
  const height = image.height;
  const data = image.data;
  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error("Image data must be Uint8Array or Uint8ClampedArray");
  }
  const module = await loadMozjpegModule();
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
    throw new Error("MozJPEG encoding failed");
  }
  return result;
}
async function mozjpegDecodeClient(data, signal) {
  if (isBrowser()) {
    throw new Error("MozJPEG decoding is not supported in browser environments. No browser decoder is available.");
  }
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const module = await loadMozjpegNodeDecModule();
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const result = module.decode(data);
  if (!result) {
    throw new Error("MozJPEG decoding failed");
  }
  return result;
}
var MozJpegColorSpace, cachedEncModule = null, cachedDecModule = null, loadEncModulePromise = null, loadDecModulePromise = null;
var init_mozjpeg_worker = __esm(() => {
  init_src();
  MozJpegColorSpace = { GRAYSCALE: 1, RGB: 2, YCbCr: 3 };
  if (typeof self !== "undefined") {
    self.onmessage = async (event) => {
      const data = event.data;
      if (data?.type === "worker:ping") {
        await loadMozjpegModule();
        self.postMessage({ type: "worker:ready" });
        return;
      }
      if (data?.type === "mozjpeg:encode") {
        const request2 = data;
        const response2 = {
          id: request2.id,
          ok: false
        };
        try {
          const { image, options } = request2.payload;
          const result = await mozjpegEncodeClient(image, options);
          response2.ok = true;
          response2.data = result;
          self.postMessage(response2, {
            transfer: [result.buffer]
          });
        } catch (error) {
          response2.error = error instanceof Error ? error.message : String(error);
          self.postMessage(response2);
        }
        return;
      }
      if (data?.type === "mozjpeg:decode") {
        const request2 = data;
        const response2 = {
          id: request2.id,
          ok: false
        };
        try {
          const result = await mozjpegDecodeClient(request2.payload.data);
          response2.ok = true;
          response2.data = result;
          self.postMessage(response2, {
            transfer: [result.data.buffer]
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
init_mozjpeg_worker();

export {
  mozjpegEncodeClient,
  mozjpegDecodeClient
};

//# debugId=191A700E1217700E64756E2164756E21
