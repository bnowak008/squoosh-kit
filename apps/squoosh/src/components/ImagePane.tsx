import { useEffect, useRef } from 'react';
import type { CodecId } from '../types';
import { jxl } from '@squoosh-kit/core';

const BRIDGE_OPTIONS = { assetPath: '/squoosh-kit' };
const PERF_FLAG = 'perf';

type Props = {
  objectUrl: string | null;
  label: string;
  side: 'left' | 'right';
  codecId?: CodecId;
  encodedBytes?: Uint8Array | null;
  isEncoding?: boolean;
  isEncodedPreview?: boolean;
};

function isPerfEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has(PERF_FLAG);
}

function mark(name: string): void {
  if (typeof performance === 'undefined') return;
  performance.mark(name);
}

function measure(name: string, start: string, end: string): void {
  if (typeof performance === 'undefined') return;
  try {
    performance.measure(name, start, end);
    if (!isPerfEnabled()) return;
    const entries = performance.getEntriesByName(name);
    const latest = entries[entries.length - 1];
    if (latest) console.info(`[perf] ${name}: ${latest.duration.toFixed(2)}ms`);
  } catch {
    return;
  }
}

export default function ImagePane({
  objectUrl,
  label,
  side,
  codecId,
  encodedBytes,
  isEncoding = false,
  isEncodedPreview = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldTrackEncodedLoad = side === 'right' && isEncodedPreview;

  function onEncodedOutputLoaded(): void {
    if (!shouldTrackEncodedLoad) return;
    mark('squoosh.right_pane_encoded_loaded');
    measure(
      'squoosh.encode_start_to_right_pane_loaded',
      'squoosh.encode_start',
      'squoosh.right_pane_encoded_loaded'
    );
    measure(
      'squoosh.encode_end_to_right_pane_loaded',
      'squoosh.encode_end',
      'squoosh.right_pane_encoded_loaded'
    );
    measure(
      'squoosh.right_pane_url_to_loaded',
      'squoosh.right_pane_url_set',
      'squoosh.right_pane_encoded_loaded'
    );
  }

  // For JXL, render to canvas since browsers don't support it natively
  useEffect(() => {
    if (codecId !== 'jxl' || !encodedBytes || !canvasRef.current) return;

    let cancelled = false;
    const decoder = jxl.createJxlDecoder('worker', BRIDGE_OPTIONS);

    void decoder(encodedBytes)
      .then((imgData: ImageData) => {
        if (cancelled || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = imgData.width;
        canvas.height = imgData.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.putImageData(
          new ImageData(
            imgData.data instanceof Uint8ClampedArray
              ? imgData.data
              : new Uint8ClampedArray(imgData.data),
            imgData.width,
            imgData.height
          ),
          0,
          0
        );
        onEncodedOutputLoaded();
      })
      .catch(() => {
        // JXL decode failed — canvas stays hidden
      })
      .finally(() => {
        void decoder.terminate();
      });

    return () => {
      cancelled = true;
    };
  }, [codecId, encodedBytes]);

  const isJxl = codecId === 'jxl';

  return (
    <div className="relative w-full h-full bg-[repeating-conic-gradient(#1a1a1a_0%_25%,#222_0%_50%)] bg-[length:24px_24px]">
      {/* Image or canvas */}
      {isJxl ? (
        <canvas
          ref={canvasRef}
          className={`
            absolute inset-0 w-full h-full object-contain
            transition-opacity duration-200
            ${encodedBytes && !isEncoding ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        objectUrl && (
          <img
            src={objectUrl}
            alt={label}
            className="absolute inset-0 w-full h-full object-contain"
            loading="eager"
            decoding="async"
            onLoad={onEncodedOutputLoaded}
            draggable={false}
          />
        )
      )}

      {/* Encoding spinner overlay */}
      {isEncoding && side === 'right' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/60">
          <svg
            className="animate-spin h-8 w-8 text-blue-400"
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
        </div>
      )}

      {/* Label badge */}
      <div
        className={`
          absolute top-3 px-2.5 py-1 rounded text-xs font-semibold
          bg-black/60 text-white backdrop-blur-sm
          ${side === 'left' ? 'left-3' : 'right-3'}
        `}
      >
        {label}
      </div>
    </div>
  );
}
