import { useState } from 'react';
import type { ResizeOptions } from '../types';

const METHODS = [
  { value: 'lanczos3', label: 'Lanczos3' },
  { value: 'mitchell', label: 'Mitchell' },
  { value: 'catrom', label: 'Catmull-Rom' },
  { value: 'triangular', label: 'Triangular' },
];

type Props = {
  enabled: boolean;
  options: ResizeOptions;
  originalWidth: number;
  originalHeight: number;
  onToggle: (enabled: boolean) => void;
  onChange: (options: ResizeOptions) => void;
};

export default function ResizePanel({
  enabled,
  options,
  originalWidth,
  originalHeight,
  onToggle,
  onChange,
}: Props) {
  const [locked, setLocked] = useState(true);
  const ratio = originalHeight / originalWidth;

  const w = options.width ?? originalWidth;
  const h = options.height ?? originalHeight;

  function handleWidth(raw: string) {
    const val = Math.max(1, parseInt(raw, 10) || 1);
    onChange({
      ...options,
      width: val,
      height: locked ? Math.round(val * ratio) : h,
    });
  }

  function handleHeight(raw: string) {
    const val = Math.max(1, parseInt(raw, 10) || 1);
    onChange({
      ...options,
      height: val,
      width: locked ? Math.round(val / ratio) : w,
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header row with toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
          Resize
        </span>
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${enabled ? 'bg-white/50' : 'bg-white/20'}`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {enabled && (
        <>
          {/* Width × Height */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              value={w}
              onChange={(e) => handleWidth(e.target.value)}
              className="w-16 bg-white/20 border border-white/30 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-white/60"
            />
            <button
              onClick={() => setLocked((l) => !l)}
              title={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
              className={`p-1 rounded transition-colors ${locked ? 'text-white hover:text-white/80' : 'text-white/40 hover:text-white/70'}`}
            >
              {locked ? (
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                </svg>
              )}
            </button>
            <input
              type="number"
              min={1}
              value={h}
              onChange={(e) => handleHeight(e.target.value)}
              className="w-16 bg-white/20 border border-white/30 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-white/60"
            />
            <span className="text-xs text-white/40">px</span>
          </div>

          {/* Method */}
          <select
            value={options.method ?? 'lanczos3'}
            onChange={(e) =>
              onChange({
                ...options,
                method: e.target.value as ResizeOptions['method'],
              })
            }
            className="w-full bg-white/20 border border-white/30 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-white/60"
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
