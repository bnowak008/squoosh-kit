import { useState, useRef, useEffect } from 'react';
import type { Dispatch } from 'react';
import type { AppState, Action, CodecId } from '../types';
import { CodePanel, SettingsPanel } from './BottomPanel';

type SheetTab = 'code' | 'settings';

type Props = {
  state: AppState;
  dispatch: Dispatch<Action>;
  onSetCodec: (codecId: CodecId) => void;
};

export const SHEET_COLLAPSED_VH = 38;
const EXPANDED_VH = 93;
const SNAP_VH = 60;

export default function MobileBottomSheet({
  state,
  dispatch,
  onSetCodec,
}: Props) {
  const [tab, setTab] = useState<SheetTab>('settings');
  const [heightVh, setHeightVh] = useState(SHEET_COLLAPSED_VH);
  const [animating, setAnimating] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLElement>(null);
  const heightVhRef = useRef(heightVh);
  const startY = useRef(0);
  const startHeight = useRef(SHEET_COLLAPSED_VH);

  heightVhRef.current = heightVh;

  useEffect(() => {
    const el = waveRef.current;
    if (!el) return;
    el.setAttribute('position', 'top');
    el.setAttribute('speed', '0.33');
    el.setAttribute('wave-color', '#09f');
    el.setAttribute('wave-count', '3');
    el.setAttribute('opacity-range', '.33, 1');
  }, []);

  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      startY.current = e.clientY;
      startHeight.current = heightVhRef.current;
      setAnimating(false);
    };

    const onMove = (e: PointerEvent) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      const dy = startY.current - e.clientY;
      const dvh = (dy / window.innerHeight) * 100;
      setHeightVh(
        Math.max(25, Math.min(EXPANDED_VH, startHeight.current + dvh))
      );
    };

    const onUp = (e: PointerEvent) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      setAnimating(true);
      setHeightVh((h) => (h > SNAP_VH ? EXPANDED_VH : SHEET_COLLAPSED_VH));
    };

    el.addEventListener('pointerdown', onDown, { passive: false });
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col text-white"
      style={{
        height: `${heightVh}vh`,
        transition: animating
          ? 'height 300ms cubic-bezier(0.22, 1, 0.36, 1)'
          : 'none',
      }}
      onTransitionEnd={() => setAnimating(false)}
    >
      {/* Wave handle — negative margin floats it above the sheet top edge */}
      <div
        ref={handleRef}
        className="relative shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
      >
        <animated-waves
          ref={waveRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/50 pointer-events-none" />
      </div>

      {/* Tab bar */}
      <div className="shrink-0 flex items-center bg-[#09f] px-1">
        {(['settings', 'code'] as SheetTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors capitalize hover:cursor-pointer ${
              tab === t
                ? 'text-white border-b-2 border-white -mb-px'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {t === 'code' ? 'Code' : 'Settings'}
          </button>
        ))}
      </div>

      {/* Content — keep both mounted to preserve scroll / tab state */}
      <div className="flex-1 min-h-0 overflow-hidden bg-[#09f] pt-2">
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
        >
          <SettingsPanel
            state={state}
            dispatch={dispatch}
            onSetCodec={onSetCodec}
          />
        </div>
      </div>
    </div>
  );
}
