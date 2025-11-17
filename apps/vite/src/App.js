"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var webp_1 = require("@squoosh-kit/webp");
var resize_1 = require("@squoosh-kit/resize");
require("./App.css");
function App() {
    var _this = this;
    var _a = (0, react_1.useState)(null), file = _a[0], setFile = _a[1];
    var _b = (0, react_1.useState)(null), sourceImageUrl = _b[0], setSourceImageUrl = _b[1];
    var _c = (0, react_1.useState)(null), resizedImageUrl = _c[0], setResizedImageUrl = _c[1];
    var _d = (0, react_1.useState)(null), processedImageUrl = _d[0], setProcessedImageUrl = _d[1];
    var _e = (0, react_1.useState)(false), isProcessing = _e[0], setIsProcessing = _e[1];
    var _f = (0, react_1.useState)(null), status = _f[0], setStatus = _f[1];
    // Options state
    var _g = (0, react_1.useState)('worker'), mode = _g[0], setMode = _g[1];
    var _h = (0, react_1.useState)(85), quality = _h[0], setQuality = _h[1];
    var _j = (0, react_1.useState)(false), lossless = _j[0], setLossless = _j[1];
    var _k = (0, react_1.useState)(), resizeWidth = _k[0], setResizeWidth = _k[1];
    var _l = (0, react_1.useState)(), resizeHeight = _l[0], setResizeHeight = _l[1];
    var _m = (0, react_1.useState)(false), premultiply = _m[0], setPremultiply = _m[1];
    var _o = (0, react_1.useState)(false), linearRGB = _o[0], setLinearRGB = _o[1];
    // Stats state
    var _p = (0, react_1.useState)(''), originalInfo = _p[0], setOriginalInfo = _p[1];
    var _q = (0, react_1.useState)(''), resizedInfo = _q[0], setResizedInfo = _q[1];
    var _r = (0, react_1.useState)(''), webpInfo = _r[0], setWebpInfo = _r[1];
    var _s = (0, react_1.useState)(''), resizeTiming = _s[0], setResizeTiming = _s[1];
    var _t = (0, react_1.useState)(''), webpTiming = _t[0], setWebpTiming = _t[1];
    var _u = (0, react_1.useState)(''), compressionRatio = _u[0], setCompressionRatio = _u[1];
    var fileInputRef = (0, react_1.useRef)(null);
    var _v = (0, react_1.useState)(null), currentWebpData = _v[0], setCurrentWebpData = _v[1];
    (0, react_1.useEffect)(function () {
        return function () {
            if (sourceImageUrl)
                URL.revokeObjectURL(sourceImageUrl);
            if (resizedImageUrl)
                URL.revokeObjectURL(resizedImageUrl);
            if (processedImageUrl)
                URL.revokeObjectURL(processedImageUrl);
        };
    }, []);
    var handleFileChange = function (event) {
        var _a;
        var selectedFile = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setStatus(null);
            var url = URL.createObjectURL(selectedFile);
            if (sourceImageUrl) {
                URL.revokeObjectURL(sourceImageUrl);
            }
            setSourceImageUrl(url);
            var img_1 = new Image();
            img_1.src = url;
            img_1.onload = function () {
                setOriginalInfo("".concat(selectedFile.name, " (").concat((selectedFile.size / 1024).toFixed(2), " KB) \u2014 ").concat(img_1.naturalWidth, "\u00D7").concat(img_1.naturalHeight));
                setResizeWidth(img_1.naturalWidth);
                setResizeHeight(img_1.naturalHeight);
            };
        }
        else {
            setFile(null);
            setStatus({
                message: 'Please select a valid image file.',
                type: 'error',
            });
        }
    };
    var handleProcessImage = function () { return __awaiter(_this, void 0, void 0, function () {
        var controller, assetPath, bridgeOptions, resizer, encoder, img_2, canvas, ctx, imageData, resizeOptions, resizeStart, resized, resizeEnd, resizedCanvas, resizedCtx, webpStart, webpOptions, webpData, webpEnd, webpBlob, compression, err_1, error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!file || !sourceImageUrl)
                        return [2 /*return*/];
                    setIsProcessing(true);
                    setStatus({ message: 'Processing image...', type: 'loading' });
                    controller = new AbortController();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, 10, 11]);
                    assetPath = '/squoosh-kit/';
                    bridgeOptions = { assetPath: assetPath };
                    console.log('Creating resizer and encoder with assetPath:', assetPath);
                    resizer = (0, resize_1.createResizer)(mode, bridgeOptions);
                    encoder = (0, webp_1.createWebpEncoder)(mode, bridgeOptions);
                    console.log('Resizer and encoder created successfully');
                    img_2 = new Image();
                    img_2.src = sourceImageUrl;
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            img_2.onload = resolve;
                            img_2.onerror = reject;
                        })];
                case 2:
                    _a.sent();
                    canvas = document.createElement('canvas');
                    canvas.width = img_2.naturalWidth;
                    canvas.height = img_2.naturalHeight;
                    ctx = canvas.getContext('2d');
                    if (!ctx) {
                        throw new Error('Failed to get 2d context from canvas');
                    }
                    ctx.drawImage(img_2, 0, 0);
                    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    resizeOptions = {
                        width: resizeWidth,
                        height: resizeHeight,
                        premultiply: premultiply,
                        linearRGB: linearRGB,
                    };
                    resizeStart = performance.now();
                    resized = void 0;
                    if (!(resizeWidth === imageData.width &&
                        resizeHeight === imageData.height)) return [3 /*break*/, 3];
                    resized = imageData;
                    setResizedInfo("".concat(imageData.width, "x").concat(imageData.height, " - No resize applied"));
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, resizer(imageData, resizeOptions, controller.signal)];
                case 4:
                    resized = _a.sent();
                    setResizedInfo("".concat(resized.width, "x").concat(resized.height, " (").concat((resized.data.length / 1024).toFixed(2), " KB)"));
                    _a.label = 5;
                case 5:
                    resizeEnd = performance.now();
                    setResizeTiming("Resize: ".concat((resizeEnd - resizeStart).toFixed(2), "ms"));
                    resizedCanvas = document.createElement('canvas');
                    resizedCanvas.width = resized.width;
                    resizedCanvas.height = resized.height;
                    resizedCtx = resizedCanvas.getContext('2d');
                    if (!resizedCtx) {
                        throw new Error('Failed to get 2d context from canvas');
                    }
                    resizedCtx.putImageData(new ImageData(new Uint8ClampedArray(resized.data), resized.width, resized.height), 0, 0);
                    if (resizedImageUrl)
                        URL.revokeObjectURL(resizedImageUrl);
                    setResizedImageUrl(resizedCanvas.toDataURL());
                    webpStart = performance.now();
                    webpOptions = { quality: quality, lossless: lossless ? 1 : 0 };
                    return [4 /*yield*/, encoder(resized, webpOptions, controller.signal)];
                case 6:
                    webpData = _a.sent();
                    setCurrentWebpData(webpData);
                    webpEnd = performance.now();
                    setWebpTiming("WebP encode: ".concat((webpEnd - webpStart).toFixed(2), "ms"));
                    webpBlob = new Blob([new Uint8Array(webpData)], {
                        type: 'image/webp',
                    });
                    if (processedImageUrl)
                        URL.revokeObjectURL(processedImageUrl);
                    setProcessedImageUrl(URL.createObjectURL(webpBlob));
                    setWebpInfo("".concat((webpData.length / 1024).toFixed(2), " KB WebP"));
                    compression = (((file.size - webpData.length) / file.size) *
                        100).toFixed(1);
                    setCompressionRatio("".concat(compression, "% smaller than original"));
                    setStatus({
                        message: 'Processing completed successfully!',
                        type: 'success',
                    });
                    return [4 /*yield*/, resizer.terminate()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, encoder.terminate()];
                case 8:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 9:
                    err_1 = _a.sent();
                    console.error('Full error:', err_1);
                    error = err_1 instanceof Error ? err_1 : new Error(String(err_1));
                    console.error('Error stack:', error.stack);
                    if (error.name === 'AbortError') {
                        setStatus({ message: 'Operation was cancelled.', type: 'error' });
                    }
                    else {
                        setStatus({ message: "Error: ".concat(error.message), type: 'error' });
                        console.error(error);
                    }
                    return [3 /*break*/, 11];
                case 10:
                    setIsProcessing(false);
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var handleDownload = function () {
        if (currentWebpData && file) {
            var blob = new Blob([new Uint8Array(currentWebpData)], {
                type: 'image/webp',
            });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = file.name.replace(/\.[^.]+$/, '.webp');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };
    return (<div className="container">
      <div className="header">
        <h1>@squoosh-kit/core - Vite React Demo</h1>
        <p>Demonstrates WebP encoding and image resizing in the browser</p>
      </div>

      <div className="upload-section">
        <div className="upload-controls">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="file-input"/>
          <div className="process-controls">
            <div className="mode-toggle">
              <label>
                <input type="radio" name="mode" value="worker" checked={mode === 'worker'} onChange={function () { return setMode('worker'); }}/>
                Worker Mode
              </label>
              <label>
                <input type="radio" name="mode" value="client" checked={mode === 'client'} onChange={function () { return setMode('client'); }}/>
                Client Mode
              </label>
            </div>
            <button onClick={handleProcessImage} disabled={!file || isProcessing}>
              {isProcessing ? 'Processing...' : 'Process Image'}
            </button>
          </div>
        </div>

        {status && (<div className={"status ".concat(status.type)}>{status.message}</div>)}

        <div className="controls">
          <div className="webp-options">
            <div className="options-title">WebP Options:</div>
            <label>
              Quality:{' '}
              <input type="range" min="1" max="100" value={quality} onChange={function (e) { return setQuality(Number(e.target.value)); }}/>
              <span>{quality}</span>
            </label>
            <label>
              <input type="checkbox" checked={lossless} onChange={function (e) { return setLossless(e.target.checked); }}/>{' '}
              Lossless
            </label>
          </div>

          <div className="resize-options">
            <div className="options-title">Resize Options:</div>
            <label>
              Width:{' '}
              <input type="number" value={resizeWidth || ''} onChange={function (e) {
            return setResizeWidth(e.target.value ? Number(e.target.value) : undefined);
        }}/>
            </label>
            <label>
              Height:{' '}
              <input type="number" value={resizeHeight || ''} onChange={function (e) {
            return setResizeHeight(e.target.value ? Number(e.target.value) : undefined);
        }}/>
            </label>
            <label>
              <input type="checkbox" checked={premultiply} onChange={function (e) { return setPremultiply(e.target.checked); }}/>{' '}
              Premultiply Alpha
            </label>
            <label>
              <input type="checkbox" checked={linearRGB} onChange={function (e) { return setLinearRGB(e.target.checked); }}/>{' '}
              Linear RGB
            </label>
          </div>
        </div>
      </div>

      {(sourceImageUrl || resizedImageUrl || processedImageUrl) && (<div className="results">
          {sourceImageUrl && (<div className="result-card">
              <h3>Original Image</h3>
              <div className="image-container">
                <img src={sourceImageUrl} alt="Original"/>
              </div>
              <div className="info">{originalInfo}</div>
            </div>)}

          {resizedImageUrl && (<div className="result-card">
              <h3>Resized Image</h3>
              <div className="image-container">
                <img src={resizedImageUrl} alt="Resized"/>
              </div>
              <div className="info">{resizedInfo}</div>
              <div className="timing">{resizeTiming}</div>
            </div>)}

          {processedImageUrl && (<div className="result-card">
              <h3>WebP Output</h3>
              <div className="image-container">
                <img src={processedImageUrl} alt="WebP"/>
              </div>
              <div className="info">{webpInfo}</div>
              <div className="timing">{webpTiming}</div>
              <button onClick={handleDownload} disabled={!currentWebpData}>
                Download WebP
              </button>
            </div>)}

          {mode && (<div className="result-card">
              <h3>Processing Info</h3>
              <div className="info">
                <div>
                  Mode:{' '}
                  <span>
                    {mode === 'worker' ? 'Web Worker' : 'Main Thread'}
                  </span>
                </div>
                <div>
                  WebP Size: <span>{compressionRatio}</span>
                </div>
              </div>
            </div>)}
        </div>)}
    </div>);
}
exports.default = App;
