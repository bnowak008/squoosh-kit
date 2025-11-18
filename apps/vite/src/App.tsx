import { useState, useEffect, useRef } from 'react';
import { createWebpEncoder } from '@squoosh-kit/webp';
import { createResizer, type ImageInput } from '@squoosh-kit/resize';
import './App.css';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [resizedImageUrl, setResizedImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    type: 'info' | 'success' | 'error' | 'loading';
  } | null>(null);

  // Options state
  const [mode, setMode] = useState<'worker' | 'client'>('worker');
  const [quality, setQuality] = useState(85);
  const [lossless, setLossless] = useState(false);
  const [resizeWidth, setResizeWidth] = useState<number | undefined>();
  const [resizeHeight, setResizeHeight] = useState<number | undefined>();
  const [premultiply, setPremultiply] = useState(false);
  const [linearRGB, setLinearRGB] = useState(false);

  // Stats state
  const [originalInfo, setOriginalInfo] = useState('');
  const [resizedInfo, setResizedInfo] = useState('');
  const [webpInfo, setWebpInfo] = useState('');
  const [resizeTiming, setResizeTiming] = useState('');
  const [webpTiming, setWebpTiming] = useState('');
  const [compressionRatio, setCompressionRatio] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentWebpData, setCurrentWebpData] = useState<Uint8Array | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (sourceImageUrl) URL.revokeObjectURL(sourceImageUrl);
      if (resizedImageUrl) URL.revokeObjectURL(resizedImageUrl);
      if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setStatus(null);

      const url = URL.createObjectURL(selectedFile);
      if (sourceImageUrl) {
        URL.revokeObjectURL(sourceImageUrl);
      }
      setSourceImageUrl(url);

      const img = new Image();
      img.src = url;
      img.onload = () => {
        setOriginalInfo(
          `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(
            2
          )} KB) — ${img.naturalWidth}×${img.naturalHeight}`
        );
        setResizeWidth(img.naturalWidth);
        setResizeHeight(img.naturalHeight);
      };
    } else {
      setFile(null);
      setStatus({
        message: 'Please select a valid image file.',
        type: 'error',
      });
    }
  };

  const handleProcessImage = async () => {
    if (!file || !sourceImageUrl) return;

    setIsProcessing(true);
    setStatus({ message: 'Processing image...', type: 'loading' });

    const controller = new AbortController();

    try {
      // Set the correct assetPath based on environment
      // In dev: files are in node_modules/@squoosh-kit/
      // In production: files are copied to public/squoosh-kit/ -> /squoosh-kit/ in dist
      const assetPath = '/squoosh-kit/';
      const bridgeOptions = { assetPath };
      console.log('Creating resizer and encoder with assetPath:', assetPath);
      const resizer = createResizer(mode, bridgeOptions);
      const encoder = createWebpEncoder(mode, bridgeOptions);
      console.log('Resizer and encoder created successfully');

      const img = new Image();
      img.src = sourceImageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2d context from canvas');
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ) as ImageInput;

      const resizeOptions = {
        width: resizeWidth,
        height: resizeHeight,
        premultiply,
        linearRGB,
      };

      const resizeStart = performance.now();
      let resized: ImageInput;
      if (
        resizeWidth === imageData.width &&
        resizeHeight === imageData.height
      ) {
        resized = imageData;
        setResizedInfo(
          `${imageData.width}x${imageData.height} - No resize applied`
        );
      } else {
        resized = await resizer(imageData, resizeOptions, controller.signal);
        setResizedInfo(
          `${resized.width}x${resized.height} (${(
            resized.data.length / 1024
          ).toFixed(2)} KB)`
        );
      }
      const resizeEnd = performance.now();
      setResizeTiming(`Resize: ${(resizeEnd - resizeStart).toFixed(2)}ms`);

      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = resized.width;
      resizedCanvas.height = resized.height;
      const resizedCtx = resizedCanvas.getContext('2d');
      if (!resizedCtx) {
        throw new Error('Failed to get 2d context from canvas');
      }
      resizedCtx.putImageData(
        new ImageData(
          new Uint8ClampedArray(resized.data),
          resized.width,
          resized.height
        ),
        0,
        0
      );
      if (resizedImageUrl) URL.revokeObjectURL(resizedImageUrl);
      setResizedImageUrl(resizedCanvas.toDataURL());

      const webpStart = performance.now();
      const webpOptions = { quality, lossless: lossless ? 1 : 0 };
      const webpData = await encoder(resized, webpOptions, controller.signal);
      setCurrentWebpData(webpData);
      const webpEnd = performance.now();
      setWebpTiming(`WebP encode: ${(webpEnd - webpStart).toFixed(2)}ms`);

      const webpBlob = new Blob([new Uint8Array(webpData)], {
        type: 'image/webp',
      });
      if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
      setProcessedImageUrl(URL.createObjectURL(webpBlob));

      setWebpInfo(`${(webpData.length / 1024).toFixed(2)} KB WebP`);
      const compression = (
        ((file.size - webpData.length) / file.size) *
        100
      ).toFixed(1);
      setCompressionRatio(`${compression}% smaller than original`);

      setStatus({
        message: 'Processing completed successfully!',
        type: 'success',
      });
      await resizer.terminate();
      await encoder.terminate();
    } catch (err: unknown) {
      console.error('Full error:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Error stack:', error.stack);
      if (error.name === 'AbortError') {
        setStatus({ message: 'Operation was cancelled.', type: 'error' });
      } else {
        setStatus({ message: `Error: ${error.message}`, type: 'error' });
        console.error(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (currentWebpData && file) {
      const blob = new Blob([new Uint8Array(currentWebpData)], {
        type: 'image/webp',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.[^.]+$/, '.webp');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>@squoosh-kit/core - Vite React Demo</h1>
        <p>Demonstrates WebP encoding and image resizing in the browser</p>
      </div>

      <div className="upload-section">
        <div className="upload-controls">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="file-input"
          />
          <div className="process-controls">
            <div className="mode-toggle">
              <label>
                <input
                  type="radio"
                  name="mode"
                  value="worker"
                  checked={mode === 'worker'}
                  onChange={() => setMode('worker')}
                />
                Worker Mode
              </label>
              <label>
                <input
                  type="radio"
                  name="mode"
                  value="client"
                  checked={mode === 'client'}
                  onChange={() => setMode('client')}
                />
                Client Mode
              </label>
            </div>
            <button
              onClick={handleProcessImage}
              disabled={!file || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process Image'}
            </button>
          </div>
        </div>

        {status && (
          <div className={`status ${status.type}`}>{status.message}</div>
        )}

        <div className="controls">
          <div className="webp-options">
            <div className="options-title">WebP Options:</div>
            <label>
              Quality:{' '}
              <input
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
              <span>{quality}</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={lossless}
                onChange={(e) => setLossless(e.target.checked)}
              />{' '}
              Lossless
            </label>
          </div>

          <div className="resize-options">
            <div className="options-title">Resize Options:</div>
            <label>
              Width:{' '}
              <input
                type="number"
                value={resizeWidth || ''}
                onChange={(e) =>
                  setResizeWidth(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </label>
            <label>
              Height:{' '}
              <input
                type="number"
                value={resizeHeight || ''}
                onChange={(e) =>
                  setResizeHeight(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={premultiply}
                onChange={(e) => setPremultiply(e.target.checked)}
              />{' '}
              Premultiply Alpha
            </label>
            <label>
              <input
                type="checkbox"
                checked={linearRGB}
                onChange={(e) => setLinearRGB(e.target.checked)}
              />{' '}
              Linear RGB
            </label>
          </div>
        </div>
      </div>

      {(sourceImageUrl || resizedImageUrl || processedImageUrl) && (
        <div className="results">
          {sourceImageUrl && (
            <div className="result-card">
              <h3>Original Image</h3>
              <div className="image-container">
                <img src={sourceImageUrl} alt="Original" />
              </div>
              <div className="info">{originalInfo}</div>
            </div>
          )}

          {resizedImageUrl && (
            <div className="result-card">
              <h3>Resized Image</h3>
              <div className="image-container">
                <img src={resizedImageUrl} alt="Resized" />
              </div>
              <div className="info">{resizedInfo}</div>
              <div className="timing">{resizeTiming}</div>
            </div>
          )}

          {processedImageUrl && (
            <div className="result-card">
              <h3>WebP Output</h3>
              <div className="image-container">
                <img src={processedImageUrl} alt="WebP" />
              </div>
              <div className="info">{webpInfo}</div>
              <div className="timing">{webpTiming}</div>
              <button onClick={handleDownload} disabled={!currentWebpData}>
                Download WebP
              </button>
            </div>
          )}

          {mode && (
            <div className="result-card">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
