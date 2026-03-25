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

// src/qoi.worker.ts
var exports_qoi_worker = {};
__export(exports_qoi_worker, {
  qoiEncodeClient: () => qoiEncodeClient,
  qoiDecodeClient: () => qoiDecodeClient
});
async function loadQoiEncModule() {
  if (cachedEncModule) {
    return cachedEncModule;
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
  const modulePath = "qoi-enc/qoi_enc.js";
  console.log("[QOI Worker] Loading encoder module.");
  console.log(`[QOI Worker] Attempting to import encoder module from path: ${modulePath}`);
  let moduleFactory;
  const isSource = import.meta.url.includes("/src/");
  const pathsToTry = isSource ? ["../wasm/" + modulePath, "./wasm/" + modulePath] : ["./wasm/" + modulePath, "../wasm/" + modulePath];
  let lastError = null;
  for (const importPath of pathsToTry) {
    try {
      moduleFactory = (await import(importPath)).default;
      console.log(`[QOI Worker] Successfully loaded encoder module from: ${importPath}`);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[QOI Worker] Failed to load encoder from ${importPath}, trying next path...`);
    }
  }
  if (!moduleFactory) {
    throw lastError || new Error("Could not load QOI encoder module from any path");
  }
  console.log("[QOI Worker] Encoder module factory loaded successfully.");
  const wasmFile = "qoi-enc/qoi_enc.wasm";
  const wasmPathsToTry = isSource ? ["../wasm/" + wasmFile, "./wasm/" + wasmFile] : ["./wasm/" + wasmFile, "../wasm/" + wasmFile];
  console.log(`[QOI Worker] Preparing to load encoder WASM binary. Will try paths: ${wasmPathsToTry.join(", ")}`);
  const workerBaseUrl = new URL(".", import.meta.url);
  let wasmLastError = null;
  for (const wasmPath of wasmPathsToTry) {
    try {
      console.log(`[QOI Worker] Calling loadWasmBinary with path: ${wasmPath}`);
      const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
      console.log(`[QOI Worker] Successfully fetched encoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`);
      const globalSelf2 = typeof self !== "undefined" ? self : globalThis;
      if (!globalSelf2.location) {
        globalSelf2.location = {
          href: import.meta.url
        };
      }
      if (typeof self === "undefined" && typeof globalThis !== "undefined") {
        globalThis.self = globalThis;
      }
      cachedEncModule = await moduleFactory({
        noInitialRun: true,
        wasmBinary
      });
      console.log("[QOI Worker] QOI encoder module initialized successfully.");
      return cachedEncModule;
    } catch (err) {
      wasmLastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[QOI Worker] Failed to load encoder WASM from ${wasmPath}, trying next path...`);
    }
  }
  throw wasmLastError || new Error("Could not load encoder WASM binary from any of the attempted paths");
}
async function loadQoiDecModule() {
  if (cachedDecModule) {
    return cachedDecModule;
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
  polyfillImageData();
  const modulePath = "qoi-dec/qoi_dec.js";
  console.log("[QOI Worker] Loading decoder module.");
  console.log(`[QOI Worker] Attempting to import decoder module from path: ${modulePath}`);
  let moduleFactory;
  const isSource = import.meta.url.includes("/src/");
  const pathsToTry = isSource ? ["../wasm/" + modulePath, "./wasm/" + modulePath] : ["./wasm/" + modulePath, "../wasm/" + modulePath];
  let lastError = null;
  for (const importPath of pathsToTry) {
    try {
      moduleFactory = (await import(importPath)).default;
      console.log(`[QOI Worker] Successfully loaded decoder module from: ${importPath}`);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[QOI Worker] Failed to load decoder from ${importPath}, trying next path...`);
    }
  }
  if (!moduleFactory) {
    throw lastError || new Error("Could not load QOI decoder module from any path");
  }
  console.log("[QOI Worker] Decoder module factory loaded successfully.");
  const wasmFile = "qoi-dec/qoi_dec.wasm";
  const wasmPathsToTry = isSource ? ["../wasm/" + wasmFile, "./wasm/" + wasmFile] : ["./wasm/" + wasmFile, "../wasm/" + wasmFile];
  console.log(`[QOI Worker] Preparing to load decoder WASM binary. Will try paths: ${wasmPathsToTry.join(", ")}`);
  const workerBaseUrl = new URL(".", import.meta.url);
  let wasmLastError = null;
  for (const wasmPath of wasmPathsToTry) {
    try {
      console.log(`[QOI Worker] Calling loadWasmBinary with path: ${wasmPath}`);
      const wasmBinary = await loadWasmBinary(wasmPath, workerBaseUrl);
      console.log(`[QOI Worker] Successfully fetched decoder WASM binary from ${wasmPath}. Size: ${wasmBinary.byteLength} bytes.`);
      const globalSelf2 = typeof self !== "undefined" ? self : globalThis;
      if (!globalSelf2.location) {
        globalSelf2.location = {
          href: import.meta.url
        };
      }
      if (typeof self === "undefined" && typeof globalThis !== "undefined") {
        globalThis.self = globalThis;
      }
      cachedDecModule = await moduleFactory({
        noInitialRun: true,
        wasmBinary
      });
      console.log("[QOI Worker] QOI decoder module initialized successfully.");
      return cachedDecModule;
    } catch (err) {
      wasmLastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[QOI Worker] Failed to load decoder WASM from ${wasmPath}, trying next path...`);
    }
  }
  throw wasmLastError || new Error("Could not load decoder WASM binary from any of the attempted paths");
}
async function qoiEncodeClient(image, signal) {
  validateImageInput(image);
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const width = image.width;
  const height = image.height;
  const data = image.data;
  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) {
    throw new Error("Image data must be Uint8Array or Uint8ClampedArray");
  }
  const module = await loadQoiEncModule();
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const dataBuffer = data instanceof Uint8ClampedArray ? new Uint8Array(data.buffer, data.byteOffset, data.length) : new Uint8Array(data.buffer, data.byteOffset, data.length);
  const options = {};
  const result = module.encode(dataBuffer, width, height, options);
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (!result) {
    throw new Error("QOI encoding failed");
  }
  return result;
}
async function qoiDecodeClient(data, signal) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const module = await loadQoiDecModule();
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const result = module.decode(data);
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (!result) {
    throw new Error("QOI decoding failed");
  }
  return result;
}
var cachedEncModule = null, cachedDecModule = null;
var init_qoi_worker = __esm(() => {
  init_src();
  if (typeof self !== "undefined") {
    self.onmessage = async (event) => {
      const data = event.data;
      if (data?.type === "worker:ping") {
        self.postMessage({ type: "worker:ready" });
        return;
      }
      if (data?.type === "qoi:encode") {
        const request2 = data;
        const response2 = {
          id: request2.id,
          ok: false
        };
        try {
          const { image } = request2.payload;
          const result = await qoiEncodeClient(image);
          response2.ok = true;
          response2.data = result;
          self.postMessage(response2);
        } catch (error) {
          response2.error = error instanceof Error ? error.message : String(error);
          self.postMessage(response2);
        }
        return;
      }
      if (data?.type === "qoi:decode") {
        const request2 = data;
        const response2 = {
          id: request2.id,
          ok: false
        };
        try {
          const result = await qoiDecodeClient(request2.payload.data);
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

class QoiClientBridge {
  async encode(image, signal) {
    const module = await Promise.resolve().then(() => (init_qoi_worker(), exports_qoi_worker));
    const qoiEncodeClient2 = module.qoiEncodeClient;
    return qoiEncodeClient2(image, signal);
  }
  async decode(data, signal) {
    const module = await Promise.resolve().then(() => (init_qoi_worker(), exports_qoi_worker));
    const qoiDecodeClient2 = module.qoiDecodeClient;
    return qoiDecodeClient2(data, signal);
  }
  async terminate() {}
}

class QoiWorkerBridge {
  worker = null;
  workerReady = null;
  options;
  constructor(options) {
    console.log("[qoi/bridge] QoiWorkerBridge constructor called with options:", options);
    this.options = options;
  }
  async getWorker() {
    if (!this.workerReady) {
      this.workerReady = this.createWorker();
    }
    return this.workerReady;
  }
  async createWorker() {
    console.log("[qoi/bridge] createWorker called. Creating ready worker...");
    this.worker = await createReadyWorker("qoi.worker.js", this.options);
    console.log("[qoi/bridge] createWorker: Ready worker created successfully.");
    return this.worker;
  }
  async encode(image, signal) {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, "qoi:encode", { image }, signal);
  }
  async decode(data, signal) {
    const worker = await this.getWorker();
    return callWorker(worker, "qoi:decode", { data }, signal);
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
  console.log(`[qoi/bridge] createBridge called with mode: ${mode}`);
  if (mode === "worker") {
    return new QoiWorkerBridge(options);
  }
  return new QoiClientBridge;
}

// src/index.ts
var globalClientBridge = null;
async function encode(image, signal) {
  if (!globalClientBridge) {
    globalClientBridge = createBridge("worker");
  }
  return globalClientBridge.encode(image, signal);
}
async function decode(data, signal) {
  if (!globalClientBridge) {
    globalClientBridge = createBridge("worker");
  }
  return globalClientBridge.decode(data, signal);
}
function createQoiEncoder(mode = "worker", options) {
  const bridge = createBridge(mode, options);
  return Object.assign((image, signal) => {
    return bridge.encode(image, signal);
  }, {
    terminate: async () => {
      await bridge.terminate();
    }
  });
}
function createQoiDecoder(mode = "worker", options) {
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
  createQoiEncoder,
  createQoiDecoder
};

//# debugId=515CAF273B42FCDE64756E2164756E21
