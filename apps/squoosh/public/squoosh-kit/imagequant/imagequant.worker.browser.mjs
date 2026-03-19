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

// ../runtime/src/index.ts
var init_src = __esm(() => {
  init_worker_helper();
  init_simd_detector();
});

// src/validators.ts
function validateImagequantOptions(options) {
  if (options === undefined) {
    return;
  }
  if (typeof options !== "object" || options === null) {
    throw new TypeError("options must be an object or undefined");
  }
  const opts = options;
  if ("numColors" in opts && opts.numColors !== undefined) {
    const numColors = opts.numColors;
    if (Number.isNaN(numColors)) {
      throw new RangeError("numColors must be a valid integer in the range 2-256, got NaN");
    }
    if (typeof numColors !== "number") {
      throw new TypeError("numColors must be a number");
    }
    if (!Number.isFinite(numColors) || !Number.isInteger(numColors)) {
      throw new RangeError("numColors must be an integer in the range 2-256, got floating point");
    }
    if (numColors < 2 || numColors > 256) {
      throw new RangeError(`numColors must be in the range 2-256, got ${numColors}`);
    }
  }
  if ("dither" in opts && opts.dither !== undefined) {
    const dither = opts.dither;
    if (Number.isNaN(dither)) {
      throw new RangeError("dither must be a valid number in the range 0-1, got NaN");
    }
    if (typeof dither !== "number") {
      throw new TypeError("dither must be a number");
    }
    if (!Number.isFinite(dither)) {
      throw new RangeError("dither must be a finite number in the range 0-1");
    }
    if (dither < 0 || dither > 1) {
      throw new RangeError(`dither must be in the range 0-1, got ${dither}`);
    }
  }
}

// src/imagequant.worker.ts
var exports_imagequant_worker = {};
__export(exports_imagequant_worker, {
  imagequantQuantizeClient: () => imagequantQuantizeClient
});
async function loadImagequantModule() {
  if (cachedModule) {
    return cachedModule;
  }
  const globalSelf = typeof self !== "undefined" ? self : globalThis;
  if (!globalSelf.location) {
    globalSelf.location = {
      href: import.meta.url
    };
  }
  if (typeof self === "undefined" && typeof globalThis !== "undefined") {
    globalThis.self = globalThis;
  }
  const isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;
  const modulePath = isNode ? "imagequant/imagequant_node.js" : "imagequant/imagequant.js";
  console.log("[ImageQuant Worker] Loading module. Node mode:", isNode);
  console.log(`[ImageQuant Worker] Attempting to import module from path: ${modulePath}`);
  let moduleFactory;
  const isSource = import.meta.url.includes("/src/");
  const pathsToTry = isSource ? ["../wasm/" + modulePath, "./wasm/" + modulePath] : ["./wasm/" + modulePath, "../wasm/" + modulePath];
  let lastError = null;
  for (const importPath of pathsToTry) {
    try {
      moduleFactory = (await import(importPath)).default;
      console.log(`[ImageQuant Worker] Successfully loaded module from: ${importPath}`);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[ImageQuant Worker] Failed to load from ${importPath}, trying next path...`);
    }
  }
  if (!moduleFactory) {
    throw lastError || new Error("Could not load ImageQuant module from any path");
  }
  console.log("[ImageQuant Worker] Module factory loaded successfully.");
  const wasmFile = isNode ? "imagequant/imagequant_node.wasm" : "imagequant/imagequant.wasm";
  const wasmPathsToTry = isSource ? ["../wasm/" + wasmFile, "./wasm/" + wasmFile] : ["./wasm/" + wasmFile, "../wasm/" + wasmFile];
  console.log(`[ImageQuant Worker] Preparing to load WASM binary. Will try paths: ${wasmPathsToTry.join(", ")}`);
  const workerBaseUrl = new URL(".", import.meta.url);
  let wasmLastError = null;
  for (const wasmPath of wasmPathsToTry) {
    try {
      console.log(`[ImageQuant Worker] Calling loadWasmBinary with path: ${wasmPath}`);
      const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
      console.log(`[ImageQuant Worker] Successfully fetched WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`);
      const globalSelf2 = typeof self !== "undefined" ? self : globalThis;
      if (!globalSelf2.location) {
        globalSelf2.location = {
          href: import.meta.url
        };
      }
      if (typeof self === "undefined" && typeof globalThis !== "undefined") {
        globalThis.self = globalThis;
      }
      cachedModule = await moduleFactory({
        noInitialRun: true,
        wasmBinary
      });
      console.log("[ImageQuant Worker] ImageQuant module initialized successfully.");
      return cachedModule;
    } catch (err) {
      wasmLastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[ImageQuant Worker] Failed to load WASM from ${wasmPath}, trying next path...`);
    }
  }
  throw wasmLastError || new Error("Could not load WASM binary from any of the attempted paths");
}
async function imagequantQuantizeClient(image, options, signal) {
  validateImageInput(image);
  validateImagequantOptions(options);
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const width = image.width;
  const height = image.height;
  const data = image.data;
  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error("Image data must be Uint8Array or Uint8ClampedArray");
  }
  const module = await loadImagequantModule();
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const numColors = options?.numColors ?? 256;
  const dither = options?.dither ?? 1;
  const zx = options?.zx ?? false;
  const dataBuffer = data instanceof Uint8ClampedArray ? new Uint8Array(data.buffer, data.byteOffset, data.length) : new Uint8Array(data.buffer, data.byteOffset, data.length);
  const result = zx ? module.zx_quantize(dataBuffer, width, height, dither) : module.quantize(dataBuffer, width, height, numColors, dither);
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (!result) {
    throw new Error("ImageQuant quantization failed");
  }
  return { data: result, width, height };
}
var cachedModule = null;
var init_imagequant_worker = __esm(() => {
  init_src();
  if (typeof self !== "undefined") {
    self.onmessage = async (event) => {
      const data = event.data;
      if (data?.type === "worker:ping") {
        self.postMessage({ type: "worker:ready" });
        return;
      }
      if (data?.type === "imagequant:quantize") {
        const request2 = data;
        const response2 = {
          id: request2.id,
          ok: false
        };
        try {
          const { image, options } = request2.payload;
          const result = await imagequantQuantizeClient(image, options);
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
init_imagequant_worker();

export {
  imagequantQuantizeClient
};

//# debugId=AA02826DE36DAFA864756E2164756E21
