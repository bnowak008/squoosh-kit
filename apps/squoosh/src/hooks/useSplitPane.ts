import { useRef, useState, useCallback } from 'react';

export type SplitPaneHandle = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  splitPercent: number;
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export function useSplitPane(initialPercent = 50): SplitPaneHandle {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [splitPercent, setSplitPercent] = useState(initialPercent);
  const currentPercent = useRef(initialPercent);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      e.preventDefault();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

      const rect = container.getBoundingClientRect();

      function onPointerMove(moveEvent: PointerEvent): void {
        const percent = Math.min(
          95,
          Math.max(5, ((moveEvent.clientX - rect.left) / rect.width) * 100)
        );
        currentPercent.current = percent;
        if (container) {
          container.style.setProperty('--split', `${percent}%`);
        }
      }

      function onPointerUp(): void {
        setSplitPercent(currentPercent.current);
        if (container) {
          container.removeEventListener('pointermove', onPointerMove);
          container.removeEventListener('pointerup', onPointerUp);
        }
      }

      container.addEventListener('pointermove', onPointerMove);
      container.addEventListener('pointerup', onPointerUp);
    },
    []
  );

  return { containerRef, splitPercent, handlePointerDown };
}
