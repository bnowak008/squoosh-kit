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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'animated-waves': React.HTMLAttributes<HTMLElement>;
    }
  }
}

type BlobConfig = {
  id: number;
  size: number;
  top: string;
  left: string;
  opacity: number;
  duration: string;
  delay: string;
};

function generateBlobs(count: number): BlobConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.floor(Math.random() * 50) + 16,
    // Keep ambient blobs in the right ~60% of the screen so they don't clutter InfoPanel
    top: `${(Math.random() * 80 + 5).toFixed(1)}%`,
    left: `${(Math.random() * 55 + 42).toFixed(1)}%`,
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

function BigBlob({ isDragging }: { isDragging: boolean }) {
  // dragRef: translates + skews toward cursor (no React re-renders — direct DOM)
  const dragRef  = useRef<HTMLDivElement>(null);
  // jiggleRef: fires squash-and-stretch on drop
  const jiggleRef = useRef<HTMLDivElement>(null);

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
        void el.offsetHeight; // force reflow so animation restarts
        el.style.animation = 'blob-jiggle 0.9s cubic-bezier(0.36,0.07,0.19,0.97) forwards';
        setTimeout(() => { if (el) el.style.animation = ''; }, 950);
      }
    }
    prevDrag.current = isDragging;
  }, [isDragging]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '75%',
        width: 0,
        height: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Drag deformation layer (translate + skew toward cursor) */}
      <div ref={dragRef}>
        {/* Jiggle layer (squash-and-stretch on drop) */}
        <div ref={jiggleRef}>
          {/* Float layer (slow ambient drift) */}
          <div style={{ animation: 'blob-float 16s linear infinite' }}>
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
  codecOptions: CODECS[0].defaultOptions,
  resizeEnabled: false,
  resizeOptions: { method: 'lanczos3', premultiply: true, linearRGB: true },
  encodeResult: null,
  encodeError: null,
};

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
    case 'DECODE_SUCCESS':
      return {
        ...state,
        phase: 'encoding',
        imageInput: action.imageInput,
        sourceObjectUrl: action.objectUrl,
        resizeOptions: {
          ...state.resizeOptions,
          width: action.imageInput.width,
          height: action.imageInput.height,
        },
      };
    case 'DECODE_ERROR':
      return {
        ...state,
        phase: 'landing',
        encodeError: action.error,
      };
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
    case 'SET_OPTIONS':
      return {
        ...state,
        codecOptions: { ...state.codecOptions, ...action.options },
      };
    case 'SET_RESIZE_ENABLED':
      return { ...state, resizeEnabled: action.enabled, encodeResult: null };
    case 'SET_RESIZE_OPTIONS':
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
    el.setAttribute('speed', '0.25');
    el.setAttribute('wave-color', '#09f');
    el.setAttribute('wave-count', '3');
  }, []);
  return (
    <animated-waves
      ref={ref}
    />
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const isDragging = useGlobalDrop(dispatch);
  const blobs = useMemo(() => generateBlobs(7), []);

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

  const hasImage = state.phase === 'encoding' || state.phase === 'editor';

  return (
    <div className="h-screen flex flex-col overflow-hidden checker-bg">
      {/* TOP PANE */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Big multi-layer blob centered on drop zone */}
        <BigBlob isDragging={isDragging} />

        {/* Procedural ambient blobs */}
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

        {/* Two-column split */}
        <div className="absolute inset-0 flex z-10">
          <InfoPanel />
          <div className="w-1/2 relative overflow-hidden flex items-center justify-center p-6">
            {hasImage ? (
              <SplitView
                sourceObjectUrl={state.sourceObjectUrl}
                encodeResult={state.encodeResult}
                codecId={state.codecId}
                isEncoding={state.phase === 'encoding'}
              />
            ) : (
              <DropZone state={state} dispatch={dispatch} isDragging={isDragging} />
            )}
          </div>
        </div>
      </div>

      {/* Waves capping the top of the dark zone */}
      <WaveSeparator />

      {/* BOTTOM ZONE — always rendered */}
      <div className="flex-shrink-0 bg-[#09f] relative">
        {/* Spacer matching wave height */}
        <div className="h-[60px]" />

        {/* Codec panel — animates in when image loaded */}
        <div
          className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
          style={{ maxHeight: hasImage ? '420px' : '0px' }}
        >
          <BottomPanel
            state={state}
            dispatch={dispatch}
            onSetCodec={handleSetCodec}
          />
        </div>

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
  );
}
