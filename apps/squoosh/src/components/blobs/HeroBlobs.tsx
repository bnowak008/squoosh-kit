import { useEffect, useMemo, useRef } from 'react';
import { BLOB_COLOR, HERO_BLOB_LAYERS } from './config';
import type { BlobFieldProps } from './types';
import { useHeroBlobMotion } from './useHeroBlobMotion';

export default function HeroBlobs({
  isDragging,
  editorVisible,
}: BlobFieldProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const jiggleRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const motionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const depths = useMemo(
    () => HERO_BLOB_LAYERS.map((layer) => layer.depth),
    []
  );

  useHeroBlobMotion({
    fieldRef: wrapperRef,
    motionRefs,
    depths,
    isDragging,
    editorVisible,
    jiggleRef,
  });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (editorVisible) {
      el.style.opacity = '0';
      const onEnd = () => {
        el.style.visibility = 'hidden';
        if (floatRef.current) {
          floatRef.current.style.animationPlayState = 'paused';
        }
      };
      el.addEventListener('transitionend', onEnd, { once: true });
      return () => el.removeEventListener('transitionend', onEnd);
    }
    el.style.visibility = '';
    if (floatRef.current) {
      floatRef.current.style.animationPlayState = '';
    }
    requestAnimationFrame(() => {
      if (wrapperRef.current) wrapperRef.current.style.opacity = '1';
    });
  }, [editorVisible]);

  return (
    <div
      ref={wrapperRef}
      className="big-blob-wrapper"
      style={{
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1,
        transition: 'opacity 600ms ease-out',
        willChange: 'opacity',
      }}
    >
      <div ref={jiggleRef}>
        <div
          ref={floatRef}
          style={{
            animation: 'blob-float 17s linear infinite',
            willChange: 'transform',
          }}
        >
          <div className="big-blob-scale">
            {HERO_BLOB_LAYERS.map((layer, index) => (
              <div
                key={layer.morph}
                ref={(el) => {
                  motionRefs.current[index] = el;
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: layer.size,
                    height: layer.size,
                    transform: 'translate(-50%, -50%)',
                    opacity: layer.opacity,
                    backgroundColor: BLOB_COLOR,
                    animation: `${layer.morph} ${layer.duration} ease-in-out ${layer.delay} infinite`,
                    willChange: 'border-radius',
                    ...(layer.blur > 0
                      ? { filter: `blur(${layer.blur}px)` }
                      : {}),
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
