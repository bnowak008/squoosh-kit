import { useState, useRef, useCallback } from 'react';
import type { Dispatch } from 'react';
import type { AppState, Action, CodecId } from '../types';
import { CodePanel, SettingsPanel } from './BottomPanel';

type SheetTab = 'code' | 'settings';

type Props = {
  state: AppState;
  dispatch: Dispatch<Action>;
  onSetCodec: (codecId: CodecId) => void;
};

const COLLAPSED_VH = 50;
const EXPANDED_VH = 93;
const SNAP_VH = 68; // snap to expanded if released above this

export default function MobileBottomSheet({ state, dispatch, onSetCodec }: Props) {
  const [tab, setTab] = useState<SheetTab>('code');
  const [heightVh, setHeightVh] = useState(COLLAPSED_VH);
  const [animating, setAnimating] = useState(false);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(COLLAPSED_VH);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      dragging.current = true;
      startY.current = e.touches[0]!.clientY;
      startHeight.current = heightVh;
      setAnimating(false);
    },
    [heightVh]
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dy = startY.current - e.touches[0]!.clientY;
    const dvh = (dy / window.innerHeight) * 100;
    setHeightVh(Math.max(25, Math.min(EXPANDED_VH, startHeight.current + dvh)));
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setAnimating(true);
    setHeightVh((h) => (h > SNAP_VH ? EXPANDED_VH : COLLAPSED_VH));
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-gray-900 rounded-t-2xl shadow-2xl text-white"
      style={{
        height: `${heightVh}vh`,
        transition: animating ? 'height 300ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
      }}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTransitionEnd={() => setAnimating(false)}
    >
      {/* Drag handle */}
      <div
        className="shrink-0 flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none touch-none"
        onTouchStart={onTouchStart}
      >
        <div className="w-10 h-1 rounded-full bg-white/30" />
      </div>

      {/* Tab bar */}
      <div className="shrink-0 flex items-center border-b border-white/10 px-1">
        {(['code', 'settings'] as SheetTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'text-white border-b-2 border-[#ff2d78] -mb-px'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {t === 'code' ? 'Code' : 'Settings'}
          </button>
        ))}
      </div>

      {/* Content — keep both mounted to preserve scroll / tab state */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className={`h-full ${tab === 'code' ? 'block' : 'hidden'}`}>
          <CodePanel
            codecId={state.codecId}
            codecOptions={state.codecOptions}
            resizeEnabled={state.resizeEnabled}
            resizeOptions={state.resizeOptions}
            onReset={() => dispatch({ type: 'RESET' })}
          />
        </div>
        <div
          className={`h-full overflow-y-auto ${tab === 'settings' ? 'block' : 'hidden'}`}
          style={{ background: '#09f' }}
        >
          <SettingsPanel state={state} dispatch={dispatch} onSetCodec={onSetCodec} />
        </div>
      </div>
    </div>
  );
}
