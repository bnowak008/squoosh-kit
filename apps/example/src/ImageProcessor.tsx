import { useState, useRef, useCallback } from 'react';
import { AnimatedCharacter } from './AnimatedCharacter';
import { type ImageInput } from '@squoosh-kit/core';

export type SquooshImageData = ImageInput['data'];

interface ProcessingState {
  status: 'idle' | 'thinking' | 'working' | 'success' | 'error';
  message: string;
  progress?: number;
}

interface ImageData {
  file: File;
  preview: string;
  dimensions: { width: number; height: number };
  size: number;
}

export function ImageProcessor() {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    message: 'Drop an image here to get started',
  });

  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingMode, setProcessingMode] = useState<'worker' | 'client'>(
    'worker'
  );
  const [webpQuality, setWebpQuality] = useState(85);
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const [resizeHeight, setResizeHeight] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setProcessingState({
        status: 'error',
        message: 'Please select a valid image file',
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
          size: file.size,
        });

        setResizeWidth(img.naturalWidth);
        setResizeHeight(img.naturalHeight);

        setProcessingState({
          status: 'idle',
          message: 'Image loaded! Ready to process',
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const processImage = async () => {
    if (!imageData) return;

    setProcessingState({
      status: 'thinking',
      message: 'Analyzing your image...',
    });

    setTimeout(() => {
      setProcessingState({
        status: 'working',
        message: 'Encoding to WebP...',
        progress: 60,
      });
    }, 1600);

    setTimeout(() => {
      setProcessingState({
        status: 'success',
        message: 'Processing complete!',
        progress: 100,
      });
    }, 2400);
  };

  const resetProcessor = () => {
    setImageData(null);
    setProcessingState({
      status: 'idle',
      message: 'Drop an image here to get started',
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
                      {imageData.dimensions.width} ×{' '}
                      {imageData.dimensions.height} •{' '}
                      {formatFileSize(imageData.size)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="drop-content">
                  <div className="drop-icon">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10,9 9,9 8,9" />
                    </svg>
                  </div>
                  <p className="drop-text">
                    Drop an image here or click to browse
                  </p>
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
                      <span className="stat">
                        {imageData.dimensions.width} ×{' '}
                        {imageData.dimensions.height}
                      </span>
                      <span className="stat">
                        {formatFileSize(imageData.size)}
                      </span>
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
                    </div>
                  </div>
                  <div className="image-container">
                    <div className="processing-placeholder">
                      <div className="placeholder-icon">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12,6 12,12 16,14" />
                        </svg>
                      </div>
                      <p className="placeholder-text">Process to see result</p>
                    </div>
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
                    onChange={(e) =>
                      setResizeWidth(Number(e.target.value) || null)
                    }
                    placeholder="Width"
                    className="resize-input"
                  />
                  <span className="resize-separator">×</span>
                  <input
                    type="number"
                    value={resizeHeight || ''}
                    onChange={(e) =>
                      setResizeHeight(Number(e.target.value) || null)
                    }
                    placeholder="Height"
                    className="resize-input"
                  />
                </div>
              </div>

              <div className="action-buttons">
                <button
                  onClick={processImage}
                  disabled={
                    processingState.status === 'working' ||
                    processingState.status === 'thinking'
                  }
                  className="process-btn"
                >
                  {processingState.status === 'working'
                    ? 'Processing...'
                    : 'Process Image'}
                </button>
                <button onClick={resetProcessor} className="reset-btn">
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .image-processor {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .processor-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }

        .mascot-section {
          position: sticky;
          top: 2rem;
        }

        .mascot-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 3rem 2rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 2rem;
          border: 2px solid #dee2e6;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .processing-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .section-header {
          text-align: center;
          margin-bottom: 1rem;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          font-size: 1rem;
          color: #7f8c8d;
          margin: 0;
        }

        .status-message {
          text-align: center;
        }

        .status-text {
          font-size: 1.25rem;
          color: #495057;
          margin: 0 0 1rem 0;
          font-weight: 500;
        }

        .progress-bar {
          width: 250px;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #74b9ff, #0984e3);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        /* Image Comparison Styles */
        .image-comparison {
          margin-top: 2rem;
        }

        .comparison-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .comparison-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
        }

        .comparison-images {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .image-card {
          background: #ffffff;
          border-radius: 1rem;
          border: 2px solid #e9ecef;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .image-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e9ecef;
          background: #f8f9fa;
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 0.5rem 0;
        }

        .card-stats {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .stat {
          font-size: 0.875rem;
          color: #6c757d;
          background: #e9ecef;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
        }

        .image-container {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        .comparison-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .processing-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: #6c757d;
          min-height: 200px;
        }

        .placeholder-icon {
          opacity: 0.5;
        }

        .placeholder-text {
          font-size: 0.875rem;
          margin: 0;
          opacity: 0.7;
        }

        .drop-zone-container {
          margin: 1rem 0;
        }

        .drop-zone {
          border: 3px dashed #bdc3c7;
          border-radius: 1rem;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #ffffff;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drop-zone:hover {
          border-color: #74b9ff;
          background: #f8f9ff;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(116, 185, 255, 0.15);
        }

        .drop-zone.drag-over {
          border-color: #0984e3;
          background: #e3f2fd;
          transform: scale(1.02) translateY(-4px);
          box-shadow: 0 12px 30px rgba(9, 132, 227, 0.2);
        }

        .drop-zone.has-image {
          border-color: #00b894;
          background: #f0fff4;
          padding: 1rem;
        }

        .drop-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .drop-icon {
          color: #bdc3c7;
          transition: color 0.3s ease;
        }

        .drop-zone:hover .drop-icon {
          color: #74b9ff;
        }

        .drop-text {
          font-size: 1.25rem;
          color: #495057;
          margin: 0;
          font-weight: 500;
        }

        .drop-hint {
          font-size: 0.875rem;
          color: #6c757d;
          margin: 0;
        }

        .image-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .preview-image {
          max-width: 200px;
          max-height: 150px;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .image-info {
          text-align: center;
        }

        .image-name {
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 0.25rem 0;
        }

        .image-details {
          font-size: 0.875rem;
          color: #6c757d;
          margin: 0;
        }

        .processing-controls {
          background: #ffffff;
          border-radius: 1rem;
          padding: 2rem;
          border: 2px solid #e9ecef;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-label {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .mode-toggle {
          display: flex;
          gap: 0.5rem;
        }

        .mode-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 2px solid #e9ecef;
          background: #ffffff;
          color: #6c757d;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-btn:hover {
          border-color: #74b9ff;
          color: #74b9ff;
        }

        .mode-btn.active {
          border-color: #0984e3;
          background: #0984e3;
          color: #ffffff;
        }

        .quality-control {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .quality-slider {
          flex: 1;
          height: 6px;
          background: #e9ecef;
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }

        .quality-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #0984e3;
          border-radius: 50%;
          cursor: pointer;
        }

        .quality-value {
          font-weight: 600;
          color: #2c3e50;
          min-width: 2rem;
          text-align: center;
        }

        .resize-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .resize-input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .resize-input:focus {
          outline: none;
          border-color: #74b9ff;
        }

        .resize-separator {
          color: #6c757d;
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .process-btn {
          flex: 1;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #00b894, #00a085);
          color: #ffffff;
          border: none;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 184, 148, 0.3);
        }

        .process-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 184, 148, 0.4);
        }

        .process-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .reset-btn {
          padding: 1rem 1.5rem;
          background: #ffffff;
          color: #6c757d;
          border: 2px solid #e9ecef;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reset-btn:hover {
          border-color: #74b9ff;
          color: #74b9ff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(116, 185, 255, 0.2);
        }

        .hidden-input {
          display: none;
        }

        @media (max-width: 1024px) {
          .processor-layout {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .mascot-section {
            position: static;
          }

          .mascot-container {
            padding: 2rem 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .image-processor {
            padding: 1rem;
          }

          .comparison-images {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .resize-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .resize-separator {
            text-align: center;
          }

          .mascot-container {
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
