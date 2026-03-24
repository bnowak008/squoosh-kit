import type { EncodeResult, CodecId } from '../types';
import { useSplitPane } from '../hooks/useSplitPane';
import ImagePane from './ImagePane';
import DragHandle from './DragHandle';

type Props = {
  sourceObjectUrl: string | null;
  encodeResult: EncodeResult | null;
  codecId: CodecId;
  isEncoding: boolean;
};

export default function SplitView({
  sourceObjectUrl,
  encodeResult,
  codecId,
  isEncoding,
}: Props) {
  const { containerRef, splitPercent, handlePointerDown } =
    useSplitPane(50);
  const hasEncodedOutput = Boolean(encodeResult);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none rounded-2xl shadow-xl"
      style={{ '--split': `${splitPercent}%` } as React.CSSProperties}
    >
      {/* Right pane — compressed (bottom layer, full size) */}
      <div className="absolute inset-0">
        <ImagePane
          objectUrl={hasEncodedOutput ? encodeResult?.objectUrl ?? null : sourceObjectUrl}
          codecId={hasEncodedOutput ? codecId : undefined}
          encodedBytes={hasEncodedOutput ? encodeResult?.bytes ?? null : null}
          isEncodedPreview={hasEncodedOutput}
          label="Compressed"
          side="right"
          isEncoding={isEncoding}
        />
      </div>

      {/* Left pane — original (top layer, clipped to --split) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: 'inset(0 calc(100% - var(--split, 50%)) 0 0)' }}
      >
        <ImagePane
          objectUrl={sourceObjectUrl}
          label="Original"
          side="left"
        />
      </div>

      <DragHandle onPointerDown={handlePointerDown} />
    </div>
  );
}
