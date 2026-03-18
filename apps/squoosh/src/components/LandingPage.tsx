import { useCallback, useState } from 'react';
import type { Dispatch } from 'react';
import type { Action } from '../types';

type Props = {
  isDecoding: boolean;
  error: string | null;
  dispatch: Dispatch<Action>;
};

export default function LandingPage({ isDecoding, error, dispatch }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/') && !file.name.endsWith('.jxl')) {
        return;
      }
      dispatch({ type: 'SET_FILE', file });
    },
    [dispatch]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-white">Squoosh Kit</h1>
        <p className="text-gray-400">
          Compress images with WebP, AVIF, MozJPEG, JPEG XL, OxiPNG, and more
        </p>
      </div>

      <label
        className={`
          relative flex flex-col items-center justify-center
          w-full max-w-xl h-64 rounded-2xl border-2 border-dashed cursor-pointer
          transition-colors duration-150
          ${
            isDragging
              ? 'border-blue-400 bg-blue-950/30'
              : 'border-gray-600 bg-gray-900 hover:border-gray-500 hover:bg-gray-900/80'
          }
          ${isDecoding ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*,.jxl"
          className="sr-only"
          onChange={handleInputChange}
          disabled={isDecoding}
        />

        {isDecoding ? (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-10 w-10 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-gray-300">Decoding image…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pointer-events-none select-none">
            <svg
              className="h-12 w-12 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 12l-4-4m0 0l-4 4m4-4v9"
              />
            </svg>
            <span className="text-lg font-medium text-gray-300">
              Drop an image here
            </span>
            <span className="text-sm text-gray-500">or click to browse</span>
            <span className="text-xs text-gray-600 mt-1">
              JPEG · PNG · WebP · AVIF · JPEG XL · GIF
            </span>
          </div>
        )}
      </label>

      {error && (
        <div className="mt-4 px-4 py-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-sm max-w-xl w-full">
          {error}
        </div>
      )}
    </div>
  );
}
