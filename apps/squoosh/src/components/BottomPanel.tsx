import type { Dispatch } from 'react';
import type { AppState, Action, CodecId } from '../types';
import FormatSelector from './FormatSelector';
import OptionsPanel from './OptionsPanel';
import DownloadButton from './DownloadButton';

type Props = {
  state: AppState;
  dispatch: Dispatch<Action>;
  onSetCodec: (codecId: CodecId) => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function compressionRatio(original: number, compressed: number): string {
  const ratio = ((original - compressed) / original) * 100;
  return ratio >= 0 ? `↓${ratio.toFixed(1)}%` : `↑${Math.abs(ratio).toFixed(1)}%`;
}

export default function BottomPanel({ state, dispatch, onSetCodec }: Props) {
  const { sourceFile, imageInput, encodeResult, codecId, codecOptions, phase } =
    state;

  function handleOptionsChange(patch: Record<string, unknown>) {
    dispatch({ type: 'SET_OPTIONS', options: patch });
  }

  function handleReset() {
    dispatch({ type: 'RESET' });
  }

  const isEncoding = phase === 'encoding';

  return (
    <div className="flex border-t border-gray-800 bg-gray-900 text-white">
      {/* Left — source info */}
      <div className="flex-1 flex flex-col justify-center gap-1 px-5 py-4 border-r border-gray-800 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate text-gray-200">
            {sourceFile?.name ?? '—'}
          </span>
          <button
            onClick={handleReset}
            title="Upload new image"
            className="ml-auto flex-shrink-0 p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {imageInput && (
          <span className="text-xs text-gray-500">
            {imageInput.width} × {imageInput.height}
          </span>
        )}
        {sourceFile && (
          <span className="text-xs text-gray-500">
            {formatBytes(sourceFile.size)}
          </span>
        )}
      </div>

      {/* Right — codec controls */}
      <div className="flex flex-col gap-3 px-5 py-4 w-72 flex-shrink-0">
        <div className="flex items-center gap-3">
          <FormatSelector value={codecId} onChange={onSetCodec} />

          {/* Output size / spinner */}
          <div className="ml-auto text-right">
            {isEncoding ? (
              <svg
                className="animate-spin h-5 w-5 text-blue-400 ml-auto"
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
            ) : encodeResult ? (
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-white">
                  {formatBytes(encodeResult.sizeBytes)}
                </span>
                {sourceFile && (
                  <span className="text-xs text-green-400">
                    {compressionRatio(sourceFile.size, encodeResult.sizeBytes)}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <OptionsPanel
          codecId={codecId}
          options={codecOptions}
          onChange={handleOptionsChange}
        />

        <div className="mt-auto pt-1">
          <DownloadButton
            bytes={encodeResult?.bytes ?? null}
            codecId={codecId}
            sourceFileName={sourceFile?.name ?? null}
          />
        </div>
      </div>
    </div>
  );
}
