import { useState, useRef, useCallback } from "react";
import { AnimatedCharacter } from "./AnimatedCharacter";
import { createWebpEncoder } from "@squoosh-lite/core/webp";
import { createResizer } from "@squoosh-lite/core/resize";
import "./ImageProcessor.css";

interface ProcessingState {
  status: 'idle' | 'thinking' | 'working' | 'success' | 'error';
  message: string;
  progress?: number;
}

interface ImageDetails {
  file: File;
  preview: string;
  dimensions: { width: number; height: number };
  size: number;
}

interface ProcessedImageData {
  processedBlob: Blob;
  processedUrl: string;
  processedSize: number;
  processedDimensions: { width: number; height: number };
}

export function ImageProcessor() {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    message: 'Drop an image here to get started'
  });
  
  const [imageData, setImageData] = useState<ImageDetails | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingMode, setProcessingMode] = useState<'worker' | 'client'>('worker');
  const [webpQuality, setWebpQuality] = useState(85);
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const [resizeHeight, setResizeHeight] = useState<number | null>(null);
  const [processedImageData, setProcessedImageData] = useState<ProcessedImageData | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Utility function to convert image URL to ImageData
  const imageUrlToImageData = useCallback((imageUrl: string): Promise<globalThis.ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D context'));
          return;
        }

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setProcessingState({
        status: 'error',
        message: 'Please select a valid image file'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageData({
          file,
          preview: e.target?.result as string,
          dimensions: { width: img.naturalWidth, height: img.naturalHeight },
          size: file.size
        });
        
        setResizeWidth(img.naturalWidth);
        setResizeHeight(img.naturalHeight);
        
        setProcessingState({
          status: 'idle',
          message: 'Image loaded! Ready to process'
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files?.[0]) {
      handleFile(files?.[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files?.[0]) {
      handleFile(files?.[0]);
    }
  }, [handleFile]);

  const processImage = async () => {
    if (!imageData) return;

    setProcessingState({
      status: 'thinking',
      message: 'Analyzing your image...'
    });

    try {
      // Step 1: Convert image URL to ImageData
      const originalImageData = await imageUrlToImageData(imageData.preview);

      setProcessingState({
        status: 'working',
        message: 'Resizing image...',
        progress: 30
      });

      // Step 2: Resize if needed
      let resizedImageData: globalThis.ImageData | { data: Uint8Array; width: number; height: number } = originalImageData;
      const needsResize = (resizeWidth && resizeWidth !== originalImageData.width) ||
                          (resizeHeight && resizeHeight !== originalImageData.height);

      if (needsResize) {
        const resizeOptions = {
          width: resizeWidth || originalImageData.width,
          height: resizeHeight || originalImageData.height,
        };

        const resizer = await createResizer(processingMode);
        resizedImageData = await resizer(
          new AbortController().signal,
          resizedImageData,
          resizeOptions
        );
      }

      setProcessingState({
        status: 'working',
        message: 'Encoding to WebP...',
        progress: 70
      });

      // Step 3: Encode to WebP
      const webpEncoder = await createWebpEncoder(processingMode);
      const webpOptions = { quality: webpQuality };

      const webpData = await webpEncoder(
        new AbortController().signal,
        resizedImageData,
        webpOptions
      );

      setProcessingState({
        status: 'working',
        message: 'Finalizing...',
        progress: 90
      });

      // Step 4: Create blob and URL for display
      const processedBlob = new Blob([webpData.slice()], { type: 'image/webp' });
      const processedUrl = URL.createObjectURL(processedBlob);

      // Clean up previous processed image URL if it exists
      if (processedImageData) {
        URL.revokeObjectURL(processedImageData.processedUrl);
      }

      setProcessedImageData({
        processedBlob,
        processedUrl,
        processedSize: processedBlob.size,
        processedDimensions: {
          width: resizedImageData.width,
          height: resizedImageData.height
        }
      });

      setProcessingState({
        status: 'success',
        message: 'Processing complete!',
        progress: 100
      });

    } catch (error) {
      console.error('Image processing failed:', error);
      setProcessingState({
        status: 'error',
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const resetProcessor = () => {
    setImageData(null);
    setProcessedImageData(null);
    setProcessingState({
      status: 'idle',
      message: 'Drop an image here to get started'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="image-processor">
      <div className="processor-layout">
        {/* Left side - Mascot */}
        <div className="mascot-section">
          <div className="mascot-container">
            <AnimatedCharacter state={processingState.status} />
            <div className="status-message">
              <p className="status-text">{processingState.message}</p>
              {processingState.progress && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${processingState.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Image Processing */}
        <div className="processing-section">
          <div className="section-header">
            <h2 className="section-title">Image Processing</h2>
            <p className="section-subtitle">Upload and transform your images</p>
          </div>

          <div className="drop-zone-container">
            <div
              ref={dropZoneRef}
              className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${imageData ? 'has-image' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden-input"
              />
              
              {imageData ? (
                <div className="image-preview">
                  <img 
                    src={imageData.preview} 
                    alt="Preview" 
                    className="preview-image"
                  />
                  <div className="image-info">
                    <p className="image-name">{imageData.file.name}</p>
                    <p className="image-details">
                      {imageData.dimensions.width} × {imageData.dimensions.height} • {formatFileSize(imageData.size)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="drop-content">
                  <div className="drop-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  </div>
                  <p className="drop-text">Drop an image here or click to browse</p>
                  <p className="drop-hint">Supports JPG, PNG, WebP, and more</p>
                </div>
              )}
            </div>
          </div>

          {/* Image Comparison Section */}
          {imageData && (
            <div className="image-comparison">
              <div className="comparison-header">
                <h3 className="comparison-title">Before & After</h3>
              </div>
              <div className="comparison-images">
                <div className="image-card original">
                  <div className="card-header">
                    <h4 className="card-title">Original</h4>
                    <div className="card-stats">
                      <span className="stat">{imageData.dimensions.width} × {imageData.dimensions.height}</span>
                      <span className="stat">{formatFileSize(imageData.size)}</span>
                    </div>
                  </div>
                  <div className="image-container">
                    <img 
                      src={imageData.preview} 
                      alt="Original" 
                      className="comparison-image"
                    />
                  </div>
                </div>

                <div className="image-card processed">
                  <div className="card-header">
                    <h4 className="card-title">Processed</h4>
                    <div className="card-stats">
                      <span className="stat">WebP Format</span>
                      <span className="stat">Optimized</span>
                      {processedImageData && (
                        <>
                          <span className="stat">
                            {processedImageData.processedDimensions.width} × {processedImageData.processedDimensions.height}
                          </span>
                          <span className="stat">{formatFileSize(processedImageData.processedSize)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="image-container">
                    {processedImageData ? (
                      <img
                        src={processedImageData.processedUrl}
                        alt="Processed"
                        className="comparison-image"
                      />
                    ) : (
                      <div className="processing-placeholder">
                        <div className="placeholder-icon">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                          </svg>
                        </div>
                        <p className="placeholder-text">Process to see result</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        {imageData && (
          <div className="processing-controls">
            <div className="control-group">
              <label className="control-label">Processing Mode</label>
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${processingMode === 'worker' ? 'active' : ''}`}
                  onClick={() => setProcessingMode('worker')}
                >
                  Web Worker
                </button>
                <button
                  className={`mode-btn ${processingMode === 'client' ? 'active' : ''}`}
                  onClick={() => setProcessingMode('client')}
                >
                  Main Thread
                </button>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">WebP Quality</label>
              <div className="quality-control">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={webpQuality}
                  onChange={(e) => setWebpQuality(Number(e.target.value))}
                  className="quality-slider"
                />
                <span className="quality-value">{webpQuality}</span>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">Resize Dimensions</label>
              <div className="resize-controls">
                <input
                  type="number"
                  value={resizeWidth || ''}
                  onChange={(e) => setResizeWidth(Number(e.target.value) || null)}
                  placeholder="Width"
                  className="resize-input"
                />
                <span className="resize-separator">×</span>
                <input
                  type="number"
                  value={resizeHeight || ''}
                  onChange={(e) => setResizeHeight(Number(e.target.value) || null)}
                  placeholder="Height"
                  className="resize-input"
                />
              </div>
            </div>

            <div className="action-buttons">
              <button
                onClick={processImage}
                disabled={processingState.status === 'working' || processingState.status === 'thinking'}
                className="process-btn"
              >
                {processingState.status === 'working' ? 'Processing...' : 'Process Image'}
              </button>
              <button
                onClick={resetProcessor}
                className="reset-btn"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
