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

// src/png.worker.ts
var exports_png_worker = {};
__export(exports_png_worker, {
  pngEncodeClient: () => pngEncodeClient,
  pngDecodeClient: () => pngDecodeClient
});
async function initPNG() {
  if (encodeFn && decodeFn) {
    return;
  }
  if (initPromise) {
    return initPromise;
  }
  initPromise = (async () => {
    try {
      polyfillImageData();
      const workerBaseUrl = new URL(".", import.meta.url);
      const isSource = import.meta.url.includes("/src/");
      const wasmPaths = isSource ? ["../wasm/png/squoosh_png_bg.wasm", "./wasm/png/squoosh_png_bg.wasm"] : ["./wasm/png/squoosh_png_bg.wasm", "../wasm/png/squoosh_png_bg.wasm"];
      let wasmBuffer = null;
      let lastError = null;
      for (const path of wasmPaths) {
        try {
          wasmBuffer = await loadWasmBinary(path, workerBaseUrl);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      }
      if (!wasmBuffer) {
        throw lastError || new Error("Could not load PNG WASM binary from any path");
      }
      const jsPaths = isSource ? ["../wasm/png/squoosh_png.js", "./wasm/png/squoosh_png.js"] : ["./wasm/png/squoosh_png.js", "../wasm/png/squoosh_png.js"];
      let pngModule = null;
      let jsLastError = null;
      for (const jsPath of jsPaths) {
        try {
          pngModule = await import(jsPath);
          break;
        } catch (error) {
          jsLastError = error instanceof Error ? error : new Error(String(error));
        }
      }
      if (!pngModule) {
        throw jsLastError || new Error("Could not load PNG JS module from any path");
      }
      await pngModule.default(wasmBuffer);
      encodeFn = pngModule.encode;
      decodeFn = pngModule.decode;
    } catch (error) {
      initPromise = null;
      throw new Error(`Failed to initialize PNG WASM module: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  })();
  return initPromise;
}
async function pngEncodeClient(image, signal) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  await initPNG();
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (!encodeFn) {
    throw new Error("PNG module not initialized");
  }
  const { data, width, height } = image;
  const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data.buffer, data.byteOffset, data.length);
  const result = encodeFn(uint8Data, width, height);
  if (!result) {
    throw new Error("PNG encoding failed");
  }
  return result;
}
async function pngDecodeClient(data, signal) {
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  await initPNG();
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (!decodeFn) {
    throw new Error("PNG module not initialized");
  }
  return decodeFn(data);
}
var encodeFn = null, decodeFn = null, initPromise = null;
var init_png_worker = __esm(() => {
  init_src();
  if (typeof self !== "undefined") {
    self.onmessage = async (event) => {
      const msgData = event.data;
      if (msgData?.type === "worker:ping") {
        self.postMessage({ type: "worker:ready" });
        return;
      }
      if (msgData?.type === "png:encode") {
        const request2 = msgData;
        const response2 = {
          id: request2.id,
          ok: false
        };
        try {
          const result = await pngEncodeClient(request2.payload.image);
          response2.ok = true;
          response2.data = result;
          self.postMessage(response2);
        } catch (error) {
          response2.error = error instanceof Error ? error.message : String(error);
          self.postMessage(response2);
        }
        return;
      }
      if (msgData?.type === "png:decode") {
        const request2 = msgData;
        const response2 = {
          id: request2.id,
          ok: false
        };
        try {
          const result = await pngDecodeClient(request2.payload.data);
          response2.ok = true;
          response2.data = result;
          self.postMessage(response2);
        } catch (error) {
          response2.error = error instanceof Error ? error.message : String(error);
          self.postMessage(response2);
        }
        return;
      }
      const request = msgData;
      const response = {
        id: request.id,
        ok: false,
        error: `Unknown message type: ${request.type}`
      };
      self.postMessage(response);
    };
  }
});

// src/bridge.ts
init_src();
init_src();

class PngClientBridge {
  async encode(image, signal) {
    const module = await Promise.resolve().then(() => (init_png_worker(), exports_png_worker));
    const pngEncodeClient2 = module.pngEncodeClient;
    return pngEncodeClient2(image, signal);
  }
  async decode(data, signal) {
    const module = await Promise.resolve().then(() => (init_png_worker(), exports_png_worker));
    const pngDecodeClient2 = module.pngDecodeClient;
    return pngDecodeClient2(data, signal);
  }
  async terminate() {}
}

class PngWorkerBridge {
  worker = null;
  workerReady = null;
  options;
  constructor(options) {
    this.options = options;
  }
  async getWorker() {
    if (!this.workerReady) {
      this.workerReady = this.createWorker();
    }
    return this.workerReady;
  }
  async createWorker() {
    this.worker = await createReadyWorker("png.worker.js", this.options);
    return this.worker;
  }
  async encode(image, signal) {
    const worker = await this.getWorker();
    validateImageInput(image);
    return callWorker(worker, "png:encode", { image }, signal);
  }
  async decode(data, signal) {
    const worker = await this.getWorker();
    return callWorker(worker, "png:decode", { data }, signal);
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
  if (mode === "worker") {
    return new PngWorkerBridge(options);
  }
  return new PngClientBridge;
}

// src/index.ts
var globalWorkerBridge = null;
function getGlobalBridge() {
  if (!globalWorkerBridge) {
    globalWorkerBridge = createBridge("worker");
  }
  return globalWorkerBridge;
}
async function encode(imageData, signal) {
  return getGlobalBridge().encode(imageData, signal);
}
async function decode(data, signal) {
  return getGlobalBridge().decode(data, signal);
}
function createPngEncoder(mode = "worker", options) {
  const bridge = createBridge(mode, options);
  return Object.assign((imageData, signal) => {
    return bridge.encode(imageData, signal);
  }, {
    terminate: async () => {
      await bridge.terminate();
    }
  });
}
function createPngDecoder(mode = "worker", options) {
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
  createPngEncoder,
  createPngDecoder
};

//# debugId=73556391F6768E2B64756E2164756E21
