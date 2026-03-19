import { useCallback } from 'react';
import type { Dispatch } from 'react';
import type { AppState, Action } from '../types';

type Props = {
  state: AppState;
  dispatch: Dispatch<Action>;
  isDragging: boolean;
};

export default function DropZone({ state, dispatch, isDragging }: Props) {
  const isDecoding = state.phase === 'decoding';

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) dispatch({ type: 'SET_FILE', file });
    },
    [dispatch]
  );

  return (
    <label
      className={`
        relative h-full w-full flex flex-col items-center justify-center cursor-pointer
        select-none
        ${isDecoding ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input
        type="file"
        accept="image/*,.jxl"
        className="sr-only"
        onChange={handleInputChange}
        disabled={isDecoding}
      />

      {isDecoding ? (
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <svg
            className="animate-spin h-12 w-12 text-white drop-shadow"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-white font-medium drop-shadow">Decoding…</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 pointer-events-none z-10">
          <svg
            className="h-14 w-14 text-white drop-shadow-md mb-1"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 12l-4-4m0 0l-4 4m4-4v9" />
          </svg>
          <span className="text-lg font-semibold text-white drop-shadow-md tracking-wide">
            {isDragging
              ? 'Release to drop!'
              : <>Drop OR <span className="underline underline-offset-2">Paste</span></>
            }
          </span>
          <span className="text-xs text-white/70 mt-1 tracking-widest uppercase">
            JPEG · PNG · WebP · AVIF · JXL · GIF
          </span>
        </div>
      )}

      {state.encodeError && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500/90 rounded-lg text-white text-sm whitespace-nowrap shadow-lg">
          {state.encodeError}
        </div>
      )}
    </label>
  );
}
