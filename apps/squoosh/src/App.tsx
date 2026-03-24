import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import type { AppState, Action, CodecId } from './types';
import { getCodec, CODECS } from './codec/registry';
import InfoPanel from './components/InfoPanel';
import DropZone from './components/DropZone';
import SplitView from './components/SplitView';
import BottomPanel from './components/BottomPanel';
import { useImageDecode } from './hooks/useImageDecode';
import { useEncoder } from './hooks/useEncoder';
import { prewarmCodec } from './codec/encode';

type BlobConfig = {
  id: number;
  size: number;
  top: string;
  left: string;
  opacity: number;
  duration: string;
  delay: string;
};

const AMBIENT_BLOB_COUNT = 14;
const PERF_FLAG = 'perf';

function generateBlobs(count: number): BlobConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.floor(Math.random() * 50) + 16,
    // Spread ambient blobs across the full top pane (both details + image panes)
    top: `${(Math.random() * 80 + 5).toFixed(1)}%`,
    left: `${(Math.random() * 90 + 5).toFixed(1)}%`,
    opacity: parseFloat((Math.random() * 0.35 + 0.08).toFixed(2)),
    duration: `${(Math.random() * 7 + 5).toFixed(1)}s`,
    delay: `${(Math.random() * 5).toFixed(1)}s`,
  }));
}

// Multi-layer blob — large enough to feel dominant, matching Squoosh scale
const BIG_BLOB_LAYERS = [
  { size: 600, opacity: 0.05, morph: 'blob-morph-a', duration: '22s', delay: '0s',    blur: 18 },
  { size: 550, opacity: 0.10, morph: 'blob-morph-b', duration: '28s', delay: '-6s',   blur: 0  },
  { size: 500, opacity: 0.55, morph: 'blob-morph-c', duration: '18s', delay: '-3s',   blur: 0  },
  { size: 450, opacity: 0.88, morph: 'blob-morph-d', duration: '24s', delay: '-10s',  blur: 0  },
] as const;

function BigBlob({ isDragging, editorVisible }: { isDragging: boolean; editorVisible: boolean }) {
  // dragRef: translates + skews toward cursor (no React re-renders — direct DOM)
  const dragRef  = useRef<HTMLDivElement>(null);
  // jiggleRef: fires squash-and-stretch on drop
  const jiggleRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const floatRef   = useRef<HTMLDivElement>(null);

  const rafRef = useRef(0);
  const pos    = useRef({ cx: 0, cy: 0, tx: 0, ty: 0 });

  // rAF loop — lerp current → target, write directly to DOM
  const startRaf = () => {
    if (rafRef.current) return;
    const tick = () => {
      const p = pos.current;
      p.cx += (p.tx - p.cx) * 0.07;
      p.cy += (p.ty - p.cy) * 0.07;
      if (dragRef.current) {
        const skX = (p.cx * 0.013).toFixed(3);
        const skY = (p.cy * 0.013).toFixed(3);
        dragRef.current.style.transform =
          `translate(${p.cx.toFixed(2)}px,${p.cy.toFixed(2)}px) skewX(${skX}deg) skewY(${skY}deg)`;
      }
      if (Math.abs(p.cx - p.tx) > 0.05 || Math.abs(p.cy - p.ty) > 0.05) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Track cursor during dragover
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      const blobX = window.innerWidth  * 0.75;
      const blobY = window.innerHeight * 0.44;
      const dx = e.clientX - blobX;
      const dy = e.clientY - blobY;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = Math.min(dist / 380, 1) * 24;
      pos.current.tx = (dx / dist) * pull;
      pos.current.ty = (dy / dist) * pull;
      startRaf();
    };
    window.addEventListener('dragover', onDragOver);
    return () => window.removeEventListener('dragover', onDragOver);
  }, []);

  // Detect drop: isDragging just went false → spring back + jiggle
  const prevDrag = useRef(false);
  useEffect(() => {
    if (prevDrag.current && !isDragging) {
      pos.current.tx = 0;
      pos.current.ty = 0;
      startRaf();

      const el = jiggleRef.current;
      if (el) {
        el.style.animation = 'none';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (el) {
              el.style.animation = 'blob-jiggle 0.9s cubic-bezier(0.36,0.07,0.19,0.97) forwards';
              setTimeout(() => { if (el) el.style.animation = ''; }, 950);
            }
          });
        });
      }
    }
    prevDrag.current = isDragging;
  }, [isDragging]);

  // Fade out when editor becomes visible
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (editorVisible) {
      el.style.opacity = '0';
      const onEnd = () => {
        el.style.visibility = 'hidden';
        if (floatRef.current) floatRef.current.style.animationPlayState = 'paused';
      };
      el.addEventListener('transitionend', onEnd, { once: true });
      return () => el.removeEventListener('transitionend', onEnd);
    } else {
      el.style.visibility = '';
      if (floatRef.current) floatRef.current.style.animationPlayState = '';
      requestAnimationFrame(() => { if (wrapperRef.current) wrapperRef.current.style.opacity = '1'; });
    }
  }, [editorVisible]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        top: '50%',
        left: '66%',
        width: 0,
        height: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1,
        transition: 'opacity 600ms ease-out',
        willChange: 'opacity',
      }}
    >
      {/* Drag deformation layer (translate + skew toward cursor) */}
      <div ref={dragRef}>
        {/* Jiggle layer (squash-and-stretch on drop) */}
        <div ref={jiggleRef}>
          {/* Float layer (slow ambient drift) */}
          <div ref={floatRef} style={{ animation: 'blob-float 17s linear infinite', willChange: 'transform' }}>
            {BIG_BLOB_LAYERS.map((layer, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: layer.size,
                  height: layer.size,
                  transform: 'translate(-50%, -50%)',
                  opacity: layer.opacity,
                  backgroundColor: '#ff2d78',
                  animation: `${layer.morph} ${layer.duration} ease-in-out ${layer.delay} infinite`,
                  willChange: 'border-radius',
                  ...(layer.blur > 0 ? { filter: `blur(${layer.blur}px)` } : {}),
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const initialState: AppState = {
  phase: 'landing',
  sourceFile: null,
  imageInput: null,
  sourceObjectUrl: null,
  codecId: 'webp',
  codecOptions: CODECS[0]?.defaultOptions ?? {},
  resizeEnabled: false,
  resizeOptions: { method: 'lanczos3', premultiply: true, linearRGB: true },
  encodeResult: null,
  encodeError: null,
};

function shallowEqualObjects(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FILE': {
      if (state.sourceObjectUrl) URL.revokeObjectURL(state.sourceObjectUrl);
      if (state.encodeResult?.objectUrl)
        URL.revokeObjectURL(state.encodeResult.objectUrl);
      return {
        ...state,
        phase: 'decoding',
        sourceFile: action.file,
        imageInput: null,
        sourceObjectUrl: null,
        encodeResult: null,
        encodeError: null,
      };
    }
    case 'SET_FILE_URL':
      return { ...state, sourceObjectUrl: action.objectUrl };
    case 'DECODE_SUCCESS':
      return {
        ...state,
        phase: 'encoding',
        imageInput: action.imageInput,
        resizeOptions: {
          ...state.resizeOptions,
          width: action.imageInput.width,
          height: action.imageInput.height,
        },
      };
    case 'DECODE_ERROR': {
      if (state.sourceObjectUrl) URL.revokeObjectURL(state.sourceObjectUrl);
      return {
        ...state,
        phase: 'landing',
        sourceObjectUrl: null,
        encodeError: action.error,
      };
    }
    case 'SET_CODEC': {
      if (state.encodeResult?.objectUrl)
        URL.revokeObjectURL(state.encodeResult.objectUrl);
      return {
        ...state,
        codecId: action.codecId,
        codecOptions: action.defaultOptions,
        encodeResult: null,
        encodeError: null,
      };
    }
    case 'SET_OPTIONS': {
      const nextCodecOptions = { ...state.codecOptions, ...action.options };
      if (shallowEqualObjects(state.codecOptions, nextCodecOptions)) return state;
      return {
        ...state,
        codecOptions: nextCodecOptions,
      };
    }
    case 'SET_RESIZE_ENABLED':
      if (state.resizeEnabled === action.enabled) return state;
      return { ...state, resizeEnabled: action.enabled, encodeResult: null };
    case 'SET_RESIZE_OPTIONS':
      if (shallowEqualObjects(state.resizeOptions, action.options)) return state;
      return { ...state, resizeOptions: action.options, encodeResult: null };
    case 'ENCODE_START':
      return { ...state, phase: 'encoding', encodeError: null };
    case 'ENCODE_SUCCESS': {
      if (state.encodeResult?.objectUrl)
        URL.revokeObjectURL(state.encodeResult.objectUrl);
      return {
        ...state,
        phase: 'editor',
        encodeResult: {
          bytes: action.bytes,
          objectUrl: action.objectUrl,
          sizeBytes: action.bytes.length,
        },
        encodeError: null,
      };
    }
    case 'ENCODE_ERROR':
      return {
        ...state,
        phase: state.imageInput ? 'editor' : 'landing',
        encodeError: action.error,
      };
    case 'RESET': {
      if (state.sourceObjectUrl) URL.revokeObjectURL(state.sourceObjectUrl);
      if (state.encodeResult?.objectUrl)
        URL.revokeObjectURL(state.encodeResult.objectUrl);
      return { ...initialState };
    }
  }
}

export type AppDispatch = Dispatch<Action>;

function useGlobalDrop(dispatch: Dispatch<Action>) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let clearTimer: ReturnType<typeof setTimeout> | null = null;

    function onDragOver(e: DragEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      setIsDragging(true);
      if (clearTimer !== null) clearTimeout(clearTimer);
      clearTimer = setTimeout(() => setIsDragging(false), 200);
    }

    function onDrop(e: DragEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (clearTimer !== null) { clearTimeout(clearTimer); clearTimer = null; }
      setIsDragging(false);
      const file = e.dataTransfer?.files[0];
      if (file) dispatch({ type: 'SET_FILE', file });
    }

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop',     onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop',     onDrop);
      if (clearTimer !== null) clearTimeout(clearTimer);
    };
  }, [dispatch]);

  return isDragging;
}

function WaveSeparator() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute('position', 'top');
    el.setAttribute('speed', '0.35');
    el.setAttribute('wave-color', '#09f');
    el.setAttribute('wave-count', '3');
  }, []);
  
  return <animated-waves ref={ref} />;
}

function runWhenIdle(task: () => void): () => void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(() => task(), { timeout: 900 });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = globalThis.setTimeout(() => task(), 120);
  return () => globalThis.clearTimeout(timeoutId);
}

function isPerfEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has(PERF_FLAG);
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const isDragging = useGlobalDrop(dispatch);
  const blobs = useMemo(() => generateBlobs(AMBIENT_BLOB_COUNT), []);

  useImageDecode(state.sourceFile, dispatch);
  useEncoder(
    state.imageInput,
    state.codecId,
    state.codecOptions,
    state.resizeEnabled,
    state.resizeOptions,
    dispatch
  );

  function handleSetCodec(codecId: CodecId) {
    const codec = getCodec(codecId);
    dispatch({ type: 'SET_CODEC', codecId, defaultOptions: codec.defaultOptions });
  }

  // Transition starts as soon as the file is dropped (decoding phase),
  // not after decode finishes — so the editor appears immediately
  const showingEditor = state.phase !== 'landing';
  const editorVisible = showingEditor;
  const isProcessing = state.phase === 'decoding' || state.phase === 'encoding';

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => prewarmCodec('webp'), 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    return runWhenIdle(() => prewarmCodec(state.codecId));
  }, [state.codecId]);

  useEffect(() => {
    if (!isPerfEnabled() || typeof window === 'undefined') return;

    const observer =
      typeof PerformanceObserver !== 'undefined'
        ? new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              console.info(`[perf] squoosh.longtask: ${entry.duration.toFixed(2)}ms @ start=${entry.startTime.toFixed(0)}ms`);
            }
          })
        : null;

    try {
      observer?.observe({ type: 'longtask', buffered: true } as PerformanceObserverInit);
    } catch {
      observer?.disconnect();
    }

    let rafId = 0;
    let lastTs = performance.now();
    const tick = (ts: number) => {
      const gap = ts - lastTs;
      if (gap > 100) {
        console.info(`[perf] squoosh.raf_gap: ${gap.toFixed(2)}ms`);
      }
      lastTs = ts;
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      observer?.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className={`h-screen flex flex-col w-full justify-center overflow-hidden checker-bg ${isProcessing ? 'processing-active' : ''}`}
    >
      {/* Procedural ambient blobs — stay visible; large blob (BigBlob) hides when editor opens */}
      <div style={{ pointerEvents: 'none' }}>
        {blobs.map((b) => (
          <div
            key={b.id}
            className="blob"
            style={{
              position: 'absolute',
              width: b.size,
              height: b.size,
              top: b.top,
              left: b.left,
              opacity: b.opacity,
              animationDuration: b.duration,
              animationDelay: b.delay,
              backgroundColor: '#ff2d78',
              zIndex: 0,
            }}
          />
        ))}
      </div>

      {/* TOP PANE */}
      <div className="flex flex-1 relative min-h-0 w-full max-w-[1920px] mx-auto">
        {/* Big multi-layer blob centered on drop zone */}
        <BigBlob isDragging={isDragging} editorVisible={editorVisible} />

        {/* Two-column split */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/3 overflow-hidden shrink-0 flex items-center justify-center">
            <InfoPanel />
          </div>
          <div className="w-2/3 shrink-0 relative overflow-hidden flex items-center justify-center p-6">
            <div
              className="absolute inset-0 flex items-center justify-center p-6"
              style={{
                opacity: showingEditor ? 0 : 1,
                transition: 'opacity 250ms ease-in-out',
                pointerEvents: showingEditor ? 'none' : 'auto',
              }}
            >
              <DropZone state={state} dispatch={dispatch} isDragging={isDragging} />
            </div>

            <div
              className="absolute inset-0 flex items-center justify-center p-6"
              style={{
                opacity: showingEditor ? 1 : 0,
                transition: 'opacity 250ms ease-in-out',
                pointerEvents: showingEditor ? 'auto' : 'none',
              }}
            >
              <SplitView
                sourceObjectUrl={state.sourceObjectUrl}
                encodeResult={state.encodeResult}
                codecId={state.codecId}
                isEncoding={state.phase === 'decoding' || state.phase === 'encoding'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Waves capping the top of the dark zone */}
      <WaveSeparator />

      {/* BOTTOM ZONE — always rendered */}
      <div className="shrink-0 bg-[#09f] relative">
        {/* Spacer matching wave height */}
        <div className={`${showingEditor ? 'h-0' : 'h-[15vh] '} transition-height duration-200 ease-out`} />

        <div className="max-w-[1920px] mx-auto">
          {/* Codec panel — instant layout switch, content fades in */}
          {showingEditor && (
            <div className="fade-in-editor">
              <BottomPanel
                state={state}
                dispatch={dispatch}
                onSetCodec={handleSetCodec}
              />
            </div>
          )}

          {/* Footer — always visible */}
          <footer className="relative z-10 flex items-center gap-5 px-6 py-3 text-xs text-white flex-wrap">
            <a
              href="https://npmjs.com/package/@squoosh-kit/core"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              npm
            </a>
            <a
              href="https://github.com/bnowak008/squoosh-kit"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://bnowak.dev"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              bnowak.dev
            </a>
            <span className="ml-auto text-white">Built on the shoulders of <a href="https://github.com/GoogleChromeLabs/squoosh" target="_blank" rel="noreferrer" className="hover:text-gray-300 transition-colors underline">Squoosh</a></span>
          </footer>
        </div>
      </div>

    </div>
  );
}
