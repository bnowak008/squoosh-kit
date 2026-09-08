import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import {
  DRAG_MAX_PULL,
  DRAG_RADIUS,
  MOBILE_MAX_WIDTH,
  MOTION_LERP,
  MOTION_SKEW,
  POINTER_MAX_PULL,
  POINTER_RADIUS,
} from './config';

type MotionLayer = {
  depth: number;
  getEl: () => HTMLDivElement | null;
  cx: number;
  cy: number;
  tx: number;
  ty: number;
};

type UseHeroBlobMotionOptions = {
  fieldRef: RefObject<HTMLElement | null>;
  motionRefs: RefObject<(HTMLDivElement | null)[]>;
  depths: readonly number[];
  isDragging: boolean;
  editorVisible: boolean;
  jiggleRef: RefObject<HTMLDivElement | null>;
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
}

function writeLayerTransform(layer: MotionLayer): void {
  const el = layer.getEl();
  if (!el) return;
  const skX = (layer.cx * MOTION_SKEW).toFixed(3);
  const skY = (layer.cy * MOTION_SKEW).toFixed(3);
  el.style.transform = `translate(${layer.cx.toFixed(2)}px,${layer.cy.toFixed(2)}px) skewX(${skX}deg) skewY(${skY}deg)`;
}

function triggerJiggle(jiggleRef: RefObject<HTMLDivElement | null>): void {
  const el = jiggleRef.current;
  if (!el) return;
  el.style.animation = 'none';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!jiggleRef.current) return;
      jiggleRef.current.style.animation =
        'blob-jiggle 0.9s cubic-bezier(0.36,0.07,0.19,0.97) forwards';
      globalThis.setTimeout(() => {
        if (jiggleRef.current) jiggleRef.current.style.animation = '';
      }, 950);
    });
  });
}

export function useHeroBlobMotion({
  fieldRef,
  motionRefs,
  depths,
  isDragging,
  editorVisible,
  jiggleRef,
}: UseHeroBlobMotionOptions): void {
  const rafRef = useRef(0);
  const layersRef = useRef<MotionLayer[]>([]);
  const draggingRef = useRef(isDragging);
  const enabledRef = useRef(!editorVisible);

  draggingRef.current = isDragging;
  enabledRef.current = !editorVisible;

  useEffect(() => {
    layersRef.current = depths.map((depth, index) => ({
      depth,
      getEl: () => motionRefs.current[index] ?? null,
      cx: 0,
      cy: 0,
      tx: 0,
      ty: 0,
    }));
  }, [depths, motionRefs]);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const startRaf = () => {
      if (rafRef.current) return;
      const tick = () => {
        let moving = false;
        for (const layer of layersRef.current) {
          layer.cx += (layer.tx - layer.cx) * MOTION_LERP;
          layer.cy += (layer.ty - layer.cy) * MOTION_LERP;
          writeLayerTransform(layer);
          if (
            Math.abs(layer.cx - layer.tx) > 0.05 ||
            Math.abs(layer.cy - layer.ty) > 0.05
          ) {
            moving = true;
          }
        }
        rafRef.current = moving ? requestAnimationFrame(tick) : 0;
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const applyPull = (clientX: number, clientY: number, dragging: boolean) => {
      const field = fieldRef.current;
      if (!field || !enabledRef.current) return;

      const rect = field.getBoundingClientRect();
      const anchorX = rect.left + rect.width / 2;
      const anchorY = rect.top + rect.height / 2;
      const dx = clientX - anchorX;
      const dy = clientY - anchorY;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      let pull: number;
      if (dragging) {
        pull = Math.min(dist / DRAG_RADIUS, 1) * DRAG_MAX_PULL;
      } else if (isMobileViewport()) {
        return;
      } else {
        const t = Math.max(0, 1 - dist / POINTER_RADIUS);
        pull = t * t * POINTER_MAX_PULL;
      }

      for (const layer of layersRef.current) {
        layer.tx = nx * pull * layer.depth;
        layer.ty = ny * pull * layer.depth;
      }
      startRaf();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) {
        applyPull(e.clientX, e.clientY, false);
      }
    };

    const onDragOver = (e: DragEvent) => {
      applyPull(e.clientX, e.clientY, true);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('dragover', onDragOver);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('dragover', onDragOver);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [fieldRef]);

  const prevDragRef = useRef(false);
  useEffect(() => {
    if (prevDragRef.current && !isDragging) {
      for (const layer of layersRef.current) {
        layer.tx = 0;
        layer.ty = 0;
      }
      if (rafRef.current === 0) {
        const tick = () => {
          let moving = false;
          for (const layer of layersRef.current) {
            layer.cx += (layer.tx - layer.cx) * MOTION_LERP;
            layer.cy += (layer.ty - layer.cy) * MOTION_LERP;
            writeLayerTransform(layer);
            if (
              Math.abs(layer.cx - layer.tx) > 0.05 ||
              Math.abs(layer.cy - layer.ty) > 0.05
            ) {
              moving = true;
            }
          }
          if (moving) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      triggerJiggle(jiggleRef);
    }
    prevDragRef.current = isDragging;
  }, [isDragging, jiggleRef]);

  useEffect(() => {
    if (editorVisible) {
      for (const layer of layersRef.current) {
        layer.tx = 0;
        layer.ty = 0;
      }
    }
  }, [editorVisible]);
}
